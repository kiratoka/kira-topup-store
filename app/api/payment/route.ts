// app/api/payment/route.ts
import { nanoid } from "nanoid"
import { PaymentRequest } from '@/lib/types';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
const midtransClient = require('midtrans-client');

export async function POST(req: Request) {


    try {
        const body: PaymentRequest = await req.json();
        console.log(body);
        
        const { product, customer } = body;

        // Inisialisasi Snap dalam mode sandbox
        const snap = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
        });

        // Generate unique order ID
        const orderId = `ORDER-${nanoid()}`;

        // Siapkan item details untuk Midtrans
        const itemDetails = [{
            id: product.id,
            price: product.price,
            quantity: 1,
            name: product.name,
        }];

        // Siapkan parameter untuk Midtrans
        const transactionDetails = {
            transaction_details: {
                order_id: orderId,
                gross_amount: product.price,
            },
            item_details: itemDetails,
            customer_details: {
                email: customer.email,
                first_name: customer.userId, // Menggunakan userId sebagai nama
            },
            custom_field1: customer.gameId,
            custom_field2: customer.serverId || '',
            custom_field3: customer.userId,
            callbacks: {
                finish: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${orderId}`,
                error: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${orderId}?status=error`,
                pending: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${orderId}?status=pending`
            }
        };

        try {
            // Buat transaksi di Midtrans
            const transaction = await snap.createTransaction(transactionDetails);

            // Simpan invoice ke database dengan Prisma
            const invoice = await prisma.invoice.create({
                data: {
                    orderId: orderId,
                    token: transaction.token,
                    product: product as any, // Prisma menerima Json type
                    customer: customer as any, // Prisma menerima Json type
                    status: 'pending'
                }
            });

            // Redirect ke halaman invoice
            return NextResponse.json({
                success: true,
                token: transaction.token,
                orderId: orderId,
                invoiceUrl: `/invoice/${orderId}`
            });

        } catch (error: any) {
            console.error('Midtrans Error:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to create transaction',
                    error: error.message
                },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('Server Error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
                error: error.message
            },
            { status: 500 }
        );
    }
}

// Endpoint untuk menerima notifikasi dari Midtrans
export async function PATCH(req: Request) {
    console.log(">> PATCH /api/payment called");

    try {
        const notification = await req.json();

        const apiClient = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
        });

        const statusResponse = await apiClient.transaction.notification(notification);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;
        const transactionId = statusResponse.transaction_id;
        const paymentType = statusResponse.payment_type;
        const paymentTime = new Date();

        console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`);

        // Map status Midtrans ke status invoice
        let invoiceStatus = 'pending';
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            if (fraudStatus === 'challenge') {
                invoiceStatus = 'pending'; // Bisa juga dibuat status 'review' jika diperlukan
            } else if (fraudStatus === 'accept' || !fraudStatus) {
                invoiceStatus = 'success';
            }
        } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
            invoiceStatus = 'failed';
        } else if (transactionStatus === 'pending') {
            invoiceStatus = 'pending';
        }

        // Update invoice di database dengan Prisma
        const updatedInvoice = await prisma.invoice.update({
            where: {
                orderId: orderId
            },
            data: {
                status: invoiceStatus,
                paymentMethod: paymentType,
                paymentTime: paymentTime,
                transactionId: transactionId
            }
        });

        // Proses business logic berdasarkan status
        if (invoiceStatus === 'success') {
            // TODO: Proses top-up ke akun game user
            // Contoh: await processTopUp(orderId);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Notification Error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to process notification',
                error: error.message
            },
            { status: 500 }
        );
    }
}