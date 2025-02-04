// app/api/payment/route.ts

import { NextResponse } from 'next/server';
const midtransClient = require('midtrans-client');

interface CustomerDetails {
    email: string;
    userId: string;
    serverId?: string;
    gameId: string;
}

interface ProductDetails {
    id: string;
    name: string;
    price: number;
    currency: {
        amount: number;
        bonus?: number;
    };
}

interface PaymentRequest {
    customer: CustomerDetails;
    product: ProductDetails;
}

export async function POST(req: Request) {
    try {
        const body: PaymentRequest = await req.json();
        const { product, customer } = body;

        // Inisialisasi Snap dalam mode sandbox
        const snap = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
        });

        // Generate unique order ID
        const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(7)}`;

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
                finish: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
                error: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error`,
                pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending`
            }
        };

        try {
            // Buat transaksi di Midtrans
            const transaction = await snap.createTransaction(transactionDetails);

            // Simpan data transaksi ke database jika diperlukan
            // await prisma.transaction.create({ ... })

            // Kembalikan token untuk frontend
            return NextResponse.json({ 
                success: true,
                token: transaction.token,
                orderId: orderId
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

        console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`);

        // Sample for handling transaction status
        if (transactionStatus == 'capture') {
            if (fraudStatus == 'challenge') {
                // TODO: handle challenge transaction
            } else if (fraudStatus == 'accept') {
                // TODO: handle accepted transaction
            }
        } else if (transactionStatus == 'settlement') {
            // TODO: handle settlement
            // Update database, proses top-up, dll
        } else if (transactionStatus == 'cancel' ||
            transactionStatus == 'deny' ||
            transactionStatus == 'expire') {
            // TODO: handle failed transaction
        } else if (transactionStatus == 'pending') {
            // TODO: handle pending transaction
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