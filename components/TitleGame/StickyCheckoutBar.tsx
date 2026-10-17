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
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#070d18]/95 backdrop-blur-xl border-t border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] py-3 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
        {/* Left and Middle Info Container */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto space-x-6 sm:space-x-12">
          {/* Selected Item */}
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs text-slate-400 block font-medium">
              Item Terpilih:
            </span>
            <span className="text-xs sm:text-sm font-bold text-white truncate block max-w-[160px] sm:max-w-xs md:max-w-md">
              {selectedProduct ? selectedProduct.name : `Belum memilih ${currencyName.toLowerCase()}`}
            </span>
          </div>

          {/* Total Payment */}
          <div>
            <span className="text-[11px] sm:text-xs text-slate-400 block font-medium">
              Total Pembayaran:
            </span>
            <span className="text-sm sm:text-lg font-bold text-cyan-400 tracking-wide">
              Rp {priceDisplay}
            </span>
          </div>
        </div>

        {/* Right Action Button */}
        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={onPaymentClick}
            disabled={!isReady || isProcessing}
            className={`w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2.5 transition-all duration-200 ${
              isReady
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer'
                : 'bg-[#121c31] text-slate-500 border border-slate-800/80 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Memproses Pembayaran...</span>
              </>
            ) : (
              <>
                <Wallet className={`w-4 h-4 ${isReady ? 'text-white' : 'text-slate-500'}`} />
                <span>Bayar Rp {priceDisplay}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default StickyCheckoutBar;
