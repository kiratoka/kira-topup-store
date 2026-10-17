// app/api/payment/notification/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import midtransClient from 'midtrans-client';
import crypto from 'crypto';
import { rateLimit, getClientIp } from '@/lib/cache/rate-limit';
import { apiError } from '@/lib/security/errors';
import { webhookLogger } from '@/lib/logging/logger';

export async function POST(req: Request) {
  webhookLogger.info(">> POST /api/payment/notification called");

  // Fase 1: Rate Limiting (AC-2, AC-5)
  const ip = getClientIp(req);
  const isLimited = await rateLimit(ip, 30, 60_000, 'rate-limit:webhook');
  if (isLimited) {
    return apiError('Terlalu banyak permintaan', 429);
  }

  try {
    let notification: Record<string, unknown>;
    try {
      notification = await req.json();
    } catch {
      return apiError('Data tidak lengkap', 400);
    }

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key
    } = (notification || {}) as {
      order_id?: string;
      status_code?: string;
      gross_amount?: string;
      signature_key?: string;
    };

    if (!order_id || !status_code || !gross_amount || !signature_key || typeof signature_key !== 'string') {
      return apiError('Data tidak lengkap', 400);
    }

    // Fase 2: Verifikasi Signature Timing-Safe (AC-1)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const stringToSign = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(stringToSign)
      .digest('hex');

    const sigBuffer = Buffer.from(signature_key);
    const expectedBuffer = Buffer.from(expectedSignature);

    // crypto.timingSafeEqual throws TypeError if buffer lengths do not match
    const isSignatureValid =
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isSignatureValid) {
      webhookLogger.error('Invalid Midtrans signature!');
      return apiError('Signature tidak valid', 403);
    }

    // Fase 3: Idempotency Check & Order Existence (AC-3, AC-4, AC-6)
    const existingInvoice = await prisma.invoice.findUnique({
      where: { orderId: order_id },
    });

    if (!existingInvoice) {
      webhookLogger.warn(`[Webhook Warning] Order ID "${order_id}" tidak ditemukan di database`);
      return apiError('Order tidak ditemukan', 404);
    }

    if (existingInvoice.status === 'success' || existingInvoice.status === 'failed') {
      const incomingStatus = (notification as { transaction_status?: string })?.transaction_status || 'unknown';
      webhookLogger.warn(
        `[Webhook Warning] Notifikasi diabaikan untuk order ${order_id}: invoice sudah berstatus akhir "${existingInvoice.status}", incoming: "${incomingStatus}"`
      );
      return NextResponse.json({ success: true });
    }

    // Fase 4: Konfirmasi Status Kanonikal ke Midtrans SDK
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const apiClient = new midtransClient.Snap({
      isProduction,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const statusResponse = await apiClient.transaction.notification(notification);

    const {
      transaction_status: transactionStatus,
      fraud_status: fraudStatus,
      transaction_id: transactionId,
      payment_type: paymentType,
      transaction_time: transactionTime,
    } = (statusResponse || {}) as {
      order_id?: string;
      transaction_status?: string;
      fraud_status?: string;
      transaction_id?: string;
      payment_type?: string;
      transaction_time?: string;
    };

    let invoiceStatus = 'pending';
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      invoiceStatus = fraudStatus === 'challenge' ? 'pending' : 'success';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus || '')) {
      invoiceStatus = 'failed';
    }

    if (!transactionTime) {
      webhookLogger.warn(
        `[Webhook Warning] transaction_time tidak ada untuk order ${order_id}, status: ${invoiceStatus} - paymentTime diisi dengan waktu server.`
      );
    }
    const paymentDate = transactionTime ? new Date(transactionTime) : new Date();

    // Fase 5: Pembaruan Status Invoice di Database (Atomic Conditional Update / Optimistic Locking)
    // Untuk mencegah race condition pada webhook konkuren (misalnya retry paralel dari Midtrans),
    // pembaruan menggunakan `updateMany` dengan kondisi `status NOT IN ('success', 'failed')`.
    // PostgreSQL mengeksekusi conditional update ini secara atomik dengan row-level lock.
    // Jika dua notifikasi paralel tiba saat status masih 'pending', hanya satu transaksi yang dapat
    // memfinalisasi status. Transaksi kedua yang tiba setelahnya akan menghasilkan count: 0,
    // mencegah overwriting status final dan melindungi dari webhook delayed/out-of-order.
    const updateResult = await prisma.invoice.updateMany({
      where: {
        orderId: order_id,
        status: { notIn: ['success', 'failed'] },
      },
      data: {
        status: invoiceStatus,
        paymentMethod: paymentType,
        transactionId,
        paymentTime: paymentDate,
      },
    });

    if (updateResult.count === 0) {
      // Race condition tertangani: invoice telah difinalisasi oleh pemrosesan webhook paralel lain
      const latestInvoice = await prisma.invoice.findUnique({
        where: { orderId: order_id },
      });
      webhookLogger.warn(
        `[Webhook Warning] Update diabaikan untuk order ${order_id}: invoice sudah berstatus akhir "${latestInvoice?.status || 'unknown'}" oleh proses konkuren`
      );
      return NextResponse.json({ success: true });
    }

    webhookLogger.info(`Updated invoice ${order_id} with status: ${invoiceStatus}`);
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    webhookLogger.error({ err: error }, "Notification Error:");

    return apiError('Gagal memproses notifikasi', 500);
  }
}
