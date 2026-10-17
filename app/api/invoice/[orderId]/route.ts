// app/api/invoice/[orderId]/route.ts
import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';
import { apiError } from '@/lib/security/errors';
import { rateLimit, getClientIp } from '@/lib/cache/rate-limit';
import { sanitizeInvoice } from '@/lib/security/masking';
import { invoiceLogger } from '@/lib/logging/logger';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const ip = getClientIp(request);
        const isLimited = await rateLimit(ip, 30, 60_000, 'rate-limit:invoice');
        if (isLimited) {
            return apiError('Terlalu banyak permintaan, silakan coba beberapa saat lagi', 429);
        }

        const { orderId } = await params;

        if (!orderId) {
            return apiError('Order ID wajib diisi', 400);
        }

        // Ambil invoice dari database
        const invoice = await prisma.invoice.findUnique({
            where: {
                orderId: orderId,
            },
        });

        if (!invoice) {
            return apiError('Invoice tidak ditemukan', 404);
        }

        const formattedInvoice = {
            ...invoice,
            createdAt: invoice.createdAt.toISOString(),
            updatedAt: invoice.updatedAt.toISOString(),
            paymentTime: invoice.paymentTime ? invoice.paymentTime.toISOString() : null,
        };

        return NextResponse.json({
            success: true,
            invoice: sanitizeInvoice(formattedInvoice),
        });
    } catch (error: unknown) {
        invoiceLogger.error({ err: error }, 'Error fetching invoice');

        return apiError('Gagal mengambil data invoice', 500);
    }
}
