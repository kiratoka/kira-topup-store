// app/api/payment/notification/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
const midtransClient = require('midtrans-client');

export async function POST(req: Request) {
  console.log(">> POST /api/payment/notification called");

  try {
    const notification = await req.json();

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

  } catch (error: any) {
    console.error("Notification Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process notification',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
    