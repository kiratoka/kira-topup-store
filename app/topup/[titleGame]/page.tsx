// app/topup/[titleGame]/page.tsx

import React from 'react';
import { gamesData } from '@/lib/datas/gameData';
import { productsData } from '@/lib/datas/productData';
import ClientTopUp from '@/components/TitleGame/ClientTopUp';



interface PageProps {
  params: { titleGame: string }
}

export default function TopUpPage({ params }: PageProps) {
  const { titleGame } = params;
  const gameInfo = gamesData[titleGame];
  const products = productsData[titleGame];

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Header Section */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <img
              src={gameInfo.image}
              alt={gameInfo.name}
              className="w-16 h-16 rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">{gameInfo.name}</h1>
              <p className="text-gray-400">{gameInfo.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Interaktif di Client Component */}
      <ClientTopUp gameId={titleGame} gameInfo={gameInfo} products={products} />
    </div>
  );
}
