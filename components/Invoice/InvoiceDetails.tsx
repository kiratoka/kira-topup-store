import React from 'react';
import { InvoiceData, TopUpProduct, CustomerDetails } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface InvoiceProps {
    invoiceData: InvoiceData;
    onPayNow: () => void;
}
const InvoiceDetails: React.FC<InvoiceProps> = ({ invoiceData, onPayNow }) => {
    
    const { orderId, product, customer, createdAt, status } = invoiceData;
    const formattedDate = new Date(createdAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    
      // Cek status invoice untuk styling
      const getStatusBadgeClass = () => {
        switch (status) {
          case 'success':
            return ' text-green-800';
          case 'failed':
            return 'text-red-800';
          case 'expired':
            return 'text-gray-800';
          case 'pending':
          default:
            return 'text-yellow-800';
        }
      };
    
      return (
        <Card className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-cyan-900 via-slate-900 to-indigo-900 rounded-xl shadow-2xl shadow-cyan-500/20 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent -skew-y-12" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
                        INVOICE
                    </h1>
                    <p className="text-cyan-300 font-mono mt-1">#{orderId}</p>
                </div>
                <div className={`px-4 py-2 rounded-full backdrop-blur-sm border border-cyan-400/30 ${getStatusBadgeClass()} shadow-glow`}>
                    <span className="text-sm font-semibold text-cyan-100">
                        {status.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Tanggal */}
            <div className="mb-8">
                <p className="text-cyan-300 font-semibold">
                    📅 {formattedDate}
                </p>
            </div>

            {/* Detail Pelanggan */}
            <div className="mb-8 bg-slate-800/40 backdrop-blur-sm p-5 rounded-xl border border-cyan-400/20">
                <h2 className="text-lg font-bold text-cyan-400 mb-3 flex items-center">
                    <span className="mr-2">👤</span>
                    DETAIL PELANGGAN
                </h2>
                <div className="space-y-2 text-cyan-100">
                    <p>🔗 User ID: <span className="font-mono">{customer.userId}</span></p>
                    <p>📧 Email: <span className="font-mono">{customer.email}</span></p>
                    <p>🎮 Game ID: <span className="font-mono">{customer.gameId}</span></p>
                    {customer.serverId && (
                        <p>🌐 Server ID: <span className="font-mono">{customer.serverId}</span></p>
                    )}
                </div>
            </div>

            {/* Detail Produk */}
            <div className="mb-8 bg-slate-800/40 backdrop-blur-sm p-5 rounded-xl border border-cyan-400/20">
                <h2 className="text-lg font-bold text-cyan-400 mb-3 flex items-center">
                    <span className="mr-2">💎</span>
                    DETAIL PRODUK
                </h2>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-cyan-200 text-lg">{product.name}</span>
                    <span className="font-bold text-cyan-400 text-xl">
                        {formatCurrency(product.price)}
                    </span>
                </div>
                <div className="text-cyan-300">
                    <span className="font-mono">
                        ⚡ {product.currency.amount} {product.currency.name} {product.currency.bonus && 
                            <span className="text-emerald-400">+ Bonus {product.currency.bonus}</span>}
                    </span>
                </div>
            </div>

            {/* Total */}
            <div className="border-t border-cyan-500/30 pt-6 mb-8">
                <div className="flex justify-between items-center text-xl font-bold">
                    <span className="text-cyan-300">TOTAL</span>
                    <span className="text-cyan-400">{formatCurrency(product.price)}</span>
                </div>
            </div>

            {/* Button */}
            {status === 'pending' && (
                <div className="flex justify-center relative group">
                    <Button 
                        onClick={onPayNow}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-xl transform transition-all duration-300 hover:scale-105 shadow-lg shadow-cyan-500/30 w-full"
                    >
                        <span className="mr-2">⚡</span>
                        BAYAR SEKARANG
                        <span className="ml-2 opacity-70 group-hover:opacity-100">→</span>
                    </Button>
                </div>
            )}
        </Card>
      );
    };
export default InvoiceDetails