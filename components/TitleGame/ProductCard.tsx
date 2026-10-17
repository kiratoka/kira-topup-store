"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import type { TopUpProduct } from '@/lib/types/game';

interface ProductCardProps {
  product: TopUpProduct;
  isSelected: boolean;
  onSelect: (product: TopUpProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected,
  onSelect,
}) => {
  const [imageError, setImageError] = useState(false);
  const badgeText = product.badge || (product.popular ? 'POPULAR' : null);

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className={`relative w-full rounded-2xl p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer flex items-center gap-3 sm:gap-3.5 ${
        isSelected
          ? 'border-2 border-cyan-400 bg-[#0c1a33]/90 shadow-[0_0_20px_rgba(6,182,212,0.22)] ring-1 ring-cyan-400/40'
          : 'border border-slate-800/90 bg-[#0a1224]/75 hover:border-slate-700 hover:bg-[#0e1933]/90'
      }`}
    >
      {/* Product Image Icon */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#091224] border border-cyan-500/20 flex items-center justify-center shrink-0 relative overflow-hidden p-1 shadow-[0_0_12px_rgba(6,182,212,0.1)]">
        {!imageError && product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={56}
            height={56}
            className="w-full h-full object-contain rounded-lg"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cyan-400 font-bold text-xs">
            💎
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="flex-1 min-w-0">
        {/* Name Row: always on its own line so badge never overlaps */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm sm:text-base text-white leading-tight tracking-tight line-clamp-2">
            {product.name}
          </h3>
          {badgeText && (
            <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(6,182,212,0.2)] whitespace-nowrap">
              {badgeText}
            </span>
          )}
        </div>

        {/* Description */}
        <p
          className={`text-xs mt-0.5 truncate ${
            product.description?.toLowerCase().includes('misi')
              ? 'text-cyan-400 font-medium'
              : 'text-slate-400'
          }`}
        >
          {product.description || `Dapatkan ${product.currency.amount} ${product.currency.name}`}
        </p>

        {/* Price Row */}
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm sm:text-base font-bold text-cyan-400 tracking-wide">
            Rp {product.price.toLocaleString('id-ID')}
          </span>
          {product.currency.bonus ? (
            <span className="text-[11px] font-semibold text-emerald-400">
              +{product.currency.bonus} Bonus
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
};

export default ProductCard;
