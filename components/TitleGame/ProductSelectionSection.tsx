"use client";

import React from 'react';
import { TopUpProduct } from '@/lib/types';
import ProductCard from './ProductCard';

interface ProductSelectionSectionProps {
  products: TopUpProduct[];
  selectedProduct: TopUpProduct | null;
  setSelectedProduct: (product: TopUpProduct) => void;
  currencyName?: string;
}

export const ProductSelectionSection: React.FC<ProductSelectionSectionProps> = ({
  products,
  selectedProduct,
  setSelectedProduct,
  currencyName = 'Diamond',
}) => {
  return (
    <div className="bg-[#0a1224]/80 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 sm:p-6 md:p-7 shadow-xl shadow-cyan-950/10 transition-all mt-6">
      {/* Header with Step 02 */}
      <div className="flex items-center space-x-3.5 mb-5 sm:mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 font-bold text-xs tracking-wider shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
          02
        </div>
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
            Pilih Nominal Top Up
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pilih paket {currencyName} atau pass bulanan sesuai keinginan Anda
          </p>
        </div>
      </div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSelected={selectedProduct?.id === product.id}
            onSelect={setSelectedProduct}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductSelectionSection;
