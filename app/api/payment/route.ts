import { nanoid } from "nanoid";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rateLimit, getClientIp } from "@/lib/cache/rate-limit";
import midtransClient from 'midtrans-client';
import { paymentRequestSchema, formatZodErrors } from "@/lib/payment/validations/payment";
import { getProductById } from "@/lib/content/datas/productData";
import { gamesData } from "@/lib/content/datas/gameData";
import { apiError } from "@/lib/security/errors";
import { paymentLogger } from "@/lib/logging/logger";

let snapClient: InstanceType<typeof midtransClient.Snap> | null = null;

function getSnapClient() {
    if (!snapClient) {
        snapClient = new midtransClient.Snap({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
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
        return apiError('Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.', 429);
    }

    try {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return apiError('Payload JSON tidak valid', 400);
        }

        // Validate incoming payload strictly using Zod schema
        const parseResult = paymentRequestSchema.safeParse(body);
        if (!parseResult.success) {
            return apiError(
                'Data permohonan pembayaran tidak valid',
                400,
                undefined,
                { errors: formatZodErrors(parseResult.error) }
            );
        }

        const { customer, productId: directProductId, product: legacyProduct } = parseResult.data;
        const targetProductId = directProductId || legacyProduct?.id;

        if (!targetProductId) {
            return apiError('Product ID wajib diisi', 400);
        }

        // Validate game existence with prototype safety
        if (!Object.hasOwn(gamesData, customer.gameId)) {
            return apiError(`Game dengan ID "${customer.gameId}" tidak ditemukan`, 400);
        }

        const gameInfo = gamesData[customer.gameId];
        if (!gameInfo) {
            return apiError(`Game dengan ID "${customer.gameId}" tidak ditemukan`, 400);
        }

        // Validate server requirement for games that require a server
        if (gameInfo.requiresServer && (!customer.serverId || customer.serverId.trim() === '')) {
            return apiError(
                `Server ID wajib diisi untuk game ${gameInfo.name}`,
                400,
                undefined,
                { errors: { "customer.serverId": "Server ID wajib diisi" } }
            );
        }

        // Authoritative product lookup from server catalog (ignores any client submitted price)
        const canonicalProduct = getProductById(customer.gameId, targetProductId);
        if (!canonicalProduct) {
            return apiError(`Produk dengan ID "${targetProductId}" tidak ditemukan untuk game ${gameInfo.name}`, 400);
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
            paymentLogger.error({ err: error }, 'Midtrans Error');
            return apiError('Gagal membuat permohonan transaksi pembayaran', 500);
        }
    } catch (error) {
        paymentLogger.error({ err: error }, 'Server Error');
        return apiError('Terjadi kesalahan internal pada server', 500);
    }
}