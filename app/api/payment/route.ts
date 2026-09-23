import { nanoid } from "nanoid";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import midtransClient from 'midtrans-client';
import { paymentRequestSchema, formatZodErrors } from "@/lib/validations/payment";
import { getProductById } from "@/lib/datas/productData";
import { gamesData } from "@/lib/datas/gameData";

let snapClient: InstanceType<typeof midtransClient.Snap> | null = null;

function getSnapClient() {
    if (!snapClient) {
        snapClient = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY || '',
            clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
        });
    }
    return snapClient;
}

export async function POST(req: Request) {
    // Get client IP address (prioritizing trusted infrastructure headers: x-real-ip, cf-connecting-ip)
    const ip = getClientIp(req);

    // Check rate limit (10 requests per minute)
    const isLimited = await rateLimit(ip, 10, 60 * 1000);
    if (isLimited) {
        return NextResponse.json(
            { success: false, message: 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.' },
            { status: 429 }
        );
    }

    try {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { success: false, message: 'Payload JSON tidak valid' },
                { status: 400 }
            );
        }

        // Validate incoming payload strictly using Zod schema
        const parseResult = paymentRequestSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Data permohonan pembayaran tidak valid',
                    errors: formatZodErrors(parseResult.error)
                },
                { status: 400 }
            );
        }

        const { customer, productId: directProductId, product: legacyProduct } = parseResult.data;
        const targetProductId = directProductId || legacyProduct?.id;

        if (!targetProductId) {
            return NextResponse.json(
                { success: false, message: 'Product ID wajib diisi' },
                { status: 400 }
            );
        }

        // Validate game existence with prototype safety
        if (!Object.hasOwn(gamesData, customer.gameId)) {
            return NextResponse.json(
                { success: false, message: `Game dengan ID "${customer.gameId}" tidak ditemukan` },
                { status: 400 }
            );
        }

        const gameInfo = gamesData[customer.gameId];
        if (!gameInfo) {
            return NextResponse.json(
                { success: false, message: `Game dengan ID "${customer.gameId}" tidak ditemukan` },
                { status: 400 }
            );
        }

        // Validate server requirement for games that require a server
        if (gameInfo.requiresServer && (!customer.serverId || customer.serverId.trim() === '')) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Server ID wajib diisi untuk game ${gameInfo.name}`,
                    errors: { "customer.serverId": "Server ID wajib diisi" }
                },
                { status: 400 }
            );
        }

        // Authoritative product lookup from server catalog (ignores any client submitted price)
        const canonicalProduct = getProductById(customer.gameId, targetProductId);
        if (!canonicalProduct) {
            return NextResponse.json(
                { success: false, message: `Produk dengan ID "${targetProductId}" tidak ditemukan untuk game ${gameInfo.name}` },
                { status: 400 }
            );
        }

        // Reusable Snap instance in sandbox mode
        const snap = getSnapClient();

        // Generate unique order ID
        const orderId = `ORDER-${nanoid()}`;

        // Prepare item details for Midtrans using canonical product details
        const itemDetails = [{
            id: canonicalProduct.id,
            price: canonicalProduct.price,
            quantity: 1,
            name: canonicalProduct.name,
        }];

        // Prepare parameters for Midtrans
        const transactionDetails = {
            transaction_details: {
                order_id: orderId,
                gross_amount: canonicalProduct.price,
            },
            item_details: itemDetails,
            customer_details: {
                email: customer.email,
                first_name: customer.userId,
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

            // Save invoice to database using Prisma with canonical product snapshot
            await prisma.invoice.create({
                data: {
                    orderId,
                    token: transaction.token,
                    product: JSON.parse(JSON.stringify(canonicalProduct)),
                    customer: {
                        email: customer.email,
                        userId: customer.userId,
                        serverId: customer.serverId || null,
                        gameId: customer.gameId
                    },
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
                    message: 'Gagal membuat permohonan transaksi pembayaran'
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Server Error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Terjadi kesalahan internal pada server'
            },
            { status: 500 }
        );
    }
}