// app/api/invoice/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { apiError } from '@/lib/errors';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

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

        return NextResponse.json({
            success: true,
            invoice: {
                ...invoice,
                createdAt: invoice.createdAt.toISOString(),
                updatedAt: invoice.updatedAt.toISOString(),
                paymentTime: invoice.paymentTime ? invoice.paymentTime.toISOString() : null,
            },
        });
    } catch (error: unknown) {
        console.error('Error fetching invoice:', error);

        return apiError('Gagal mengambil data invoice', 500);
    }
}
