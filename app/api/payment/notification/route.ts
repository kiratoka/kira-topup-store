// app/api/payment/notification/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import midtransClient from 'midtrans-client';
import crypto from 'crypto';

export async function POST(req: Request) {
  console.log(">> POST /api/payment/notification called");

  try {
    const notification = await req.json();


    const {
      order_id,
      status_code,
      gross_amount,
      signature_key
    } = notification;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Generate signature untuk verifikasi
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const stringToSign = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(stringToSign)
      .digest('hex');

    // Check signature
    if (signature_key !== expectedSignature) {
      console.error('Invalid Midtrans signature!');
      return NextResponse.json(
        { success: false, message: 'Signature tidak valid' },
        { status: 403 }
      );
    }

    const apiClient = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const statusResponse = await apiClient.transaction.notification(notification);

    const {
      order_id: orderId,
      transaction_status: transactionStatus,
      fraud_status: fraudStatus,
      transaction_id: transactionId,
      payment_type: paymentType
    } = statusResponse;

    let invoiceStatus = 'pending';
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      invoiceStatus = fraudStatus === 'challenge' ? 'pending' : 'success';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      invoiceStatus = 'failed';
    }

    await prisma.invoice.update({
      where: { orderId },
      data: {
        status: invoiceStatus,
        paymentMethod: paymentType,
        transactionId,
        paymentTime: new Date(),
      },
    });

    console.log(`Updated invoice ${orderId} with status: ${invoiceStatus}`);
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("Notification Error:", error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process notification',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
