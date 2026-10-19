"use client";

import React from 'react';
import { Wallet, Loader2 } from 'lucide-react';
import type { TopUpProduct } from '@/lib/types/game';

interface StickyCheckoutBarProps {
  selectedProduct: TopUpProduct | null;
  isProcessing: boolean;
  isFormValid: boolean;
  emailError?: string;
  onPaymentClick: () => void;
  currencyName?: string;
}

export const StickyCheckoutBar: React.FC<StickyCheckoutBarProps> = ({
  selectedProduct,
  isProcessing,
  isFormValid,
  emailError = '',
  onPaymentClick,
  currencyName = 'diamond',
}) => {
  const isReady = isFormValid && !isProcessing && emailError === '' && selectedProduct !== null;
  const priceDisplay = selectedProduct ? selectedProduct.price.toLocaleString('id-ID') : '0';

  return (
    <aside
      aria-label="Informasi Checkout dan Pembayaran"
      className="fixed bottom-0 right-0 z-40 bg-[#070d18]/95 backdrop-blur-xl border-t border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] pt-3 px-4 sm:px-6 lg:px-8 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      style={{ left: 'var(--sidebar-w, 0px)', transition: 'left 0.15s ease' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Mobile Info View (< sm) */}
        <div className="min-w-0 flex-1 sm:hidden">
          <span className="text-xs text-slate-300 block font-medium truncate">
            {selectedProduct ? selectedProduct.name : `Pilih nominal ${currencyName.toLowerCase()}`}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Total:</span>
            <span className="text-base font-extrabold text-cyan-400 tracking-tight">
              Rp {priceDisplay}
            </span>
          </div>
        </div>

        {/* Desktop & Tablet Info View (>= sm) */}
        <div className="hidden sm:flex items-center space-x-8 md:space-x-12 min-w-0">
          <div className="min-w-0">
            <span className="text-xs text-slate-400 block font-medium">
              Item Terpilih:
            </span>
            <span className="text-sm font-bold text-white truncate block max-w-xs md:max-w-md">
              {selectedProduct ? selectedProduct.name : `Belum memilih ${currencyName.toLowerCase()}`}
            </span>
          </div>

          <div className="shrink-0">
            <span className="text-xs text-slate-400 block font-medium">
              Total Pembayaran:
            </span>
            <span className="text-lg md:text-xl font-bold text-cyan-400 tracking-wide">
              Rp {priceDisplay}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onPaymentClick}
            disabled={isProcessing}
            className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all duration-200 select-none ${
              isProcessing
                ? 'bg-[#121c31] text-cyan-400 border border-cyan-500/30 cursor-wait'
                : isReady
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95 cursor-pointer'
                : 'bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-slate-600 active:scale-95 cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="whitespace-nowrap">Memproses...</span>
              </>
            ) : (
              <>
                <Wallet className={`w-4 h-4 ${isReady ? 'text-white' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">
                  {isReady ? (
                    <>
                      <span className="sm:hidden">Bayar Sekarang</span>
                      <span className="hidden sm:inline">Bayar Rp {priceDisplay}</span>
                    </>
                  ) : selectedProduct ? (
                    <>
                      <span className="sm:hidden">Lanjutkan</span>
                      <span className="hidden sm:inline">Lengkapi Data</span>
                    </>
                  ) : (
                    <>
                      <span className="sm:hidden">Pilih Item</span>
                      <span className="hidden sm:inline">Pilih Produk</span>
                    </>
                  )}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default StickyCheckoutBar;
