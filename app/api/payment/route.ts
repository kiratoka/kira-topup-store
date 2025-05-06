import { nanoid } from "nanoid";
import { PaymentRequest } from '@/lib/types';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from "@/lib/rate-limit";
import midtransClient from 'midtrans-client';

export async function POST(req: Request) {
    // Get IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    // Check rate limit (10 requests per minute)
    const isLimited = await rateLimit(ip, 10, 60 * 1000);
    if (isLimited) {
        return NextResponse.json(
            { success: false, message: 'Terlalu banyak request, coba lagi nanti yaa, btw kamu nyoba nge hack ya? akwowkowowo' },
            { status: 429 }
        );
    }

    try {
        const body: PaymentRequest = await req.json();
        console.log(body);

        const { product, customer } = body;

        // Initialize Snap in sandbox mode
        const snap = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY || '',
            clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
        });

        // Generate unique order ID
        const orderId = `ORDER-${nanoid()}`;

        // Prepare item details for Midtrans
        const itemDetails = [{
            id: product.id,
            price: product.price,
            quantity: 1,
            name: product.name,
        }];

        // Prepare parameters for Midtrans
        const transactionDetails = {
            transaction_details: {
                order_id: orderId,
                gross_amount: product.price,
            },
            item_details: itemDetails,
            customer_details: {
                email: customer.email,
                first_name: customer.userId, // Using userId as name
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
            // Create transaction in Midtrans
            const transaction = await snap.createTransaction(transactionDetails);

            // Save invoice to database using Prisma

            await prisma.invoice.create({
                data: {
                    orderId,
                    token: transaction.token,
                    product: JSON.parse(JSON.stringify(product)),
                    customer: JSON.parse(JSON.stringify(customer)),
                    status: 'pending'
                }
            });


            // Return payment information
            return NextResponse.json({
                success: true,
                token: transaction.token,
                orderId,
                invoiceUrl: `/invoice/${orderId}`
            });

        } catch (error) {
            console.error('Midtrans Error:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to create transaction',
                    error: error instanceof Error ? error.message : 'Unknown error'
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Server Error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}