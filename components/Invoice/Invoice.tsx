'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InvoiceData } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import InvoiceDetails from './InvoiceDetails';


const Invoice = () => {

    const params = useParams()
    const orderId = params?.orderId as string;
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true);
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                // Ambil data invoice dari API kita sendiri
                const response = await fetch(`/api/invoice/${orderId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Invoice tidak ditemukan');
                }

                setInvoiceData(data.invoice);
            } catch (err: any) {
                console.error('Error fetching invoice:', err);
                setError(err.message || 'Terjadi kesalahan saat mengambil data invoice');
            } finally {
                setIsLoading(false);
            }
        };

        if (orderId) {
            fetchInvoice();
        }
    }, [orderId]);

    const handlePayNow = () => {
        if (!invoiceData?.token) {
            setError('Token pembayaran tidak ditemukan');
            return;
        }

        // Asumsikan kita udah punya midtrans JS di layout
        // dan kita dapat memanggil snap.pay
        if (window.snap && invoiceData.token) {
            window.snap.pay(invoiceData.token, {
                onSuccess: function (result: any) {
                    console.log('Payment success:', result);
                    window.location.href = `/invoice/${orderId}`;
                },
                onPending: function (result: any) {
                    console.log('Payment pending:', result);
                    window.location.href = `/invoice/${orderId}?status=error`;
                },
                onError: function (result: any) {
                    console.log('Payment error:', result);
                    window.location.href = `/invoice/${orderId}?status=pending`;
                },
                onClose: function () {
                    
                    console.log('Customer closed the payment window');
                }
            });
        } else {
            setError('Snap tidak tersedia atau token tidak valid');
        }
    };



    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Memuat invoice...</span>
            </div>
        );
    }

    if (error || !invoiceData) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen">
                <div className="bg-red-100 text-red-800 p-4 rounded-md">
                    <p className="font-medium">Error: {error || 'Invoice tidak ditemukan'}</p>
                </div>
                <button
                    onClick={() => router.push('/')}
                    className="mt-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                    Kembali ke Beranda
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12">
            <InvoiceDetails invoiceData={invoiceData} onPayNow={handlePayNow} />
        </div>
    )
}

export default Invoice