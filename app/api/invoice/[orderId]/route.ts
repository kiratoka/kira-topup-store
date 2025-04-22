// app/api/invoice/[orderId]/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: { orderId: string } }
) {

    try {
        const { orderId } = await params;

        if (!orderId) {
            return NextResponse.json(
                { success: false, message: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Ambil invoice dari database
        const invoice = await prisma.invoice.findUnique({
            where: {
                orderId: orderId,
            },
        });

        if (!invoice) {
            return NextResponse.json(
                { success: false, message: 'Invoice not found' },
                { status: 404 }
            );
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
    } catch (error: any) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch invoice',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

