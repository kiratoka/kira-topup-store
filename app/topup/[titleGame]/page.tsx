import React from 'react';
import { notFound } from 'next/navigation';
import { gamesData } from '@/lib/content/datas/gameData';
import { productsData } from '@/lib/content/datas/productData';
import ClientTopUp from '@/components/TitleGame/ClientTopUp';
import GameHeader from '@/components/TitleGame/GameHeader';

interface PageProps {
  params: Promise<{ titleGame: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { titleGame } = await params;
  const gameInfo = gamesData[titleGame];

  if (!gameInfo) {
    return {
      title: 'Game Tidak Ditemukan - Kira Topup Store',
    };
  }

  return {
    title: `Top Up ${gameInfo.name} - Kira Topup Store`,
    description: gameInfo.description || `Top up voucher dan diamond ${gameInfo.name} proses cepat & harga termurah`,
  };
}

export default async function TopUpPage({ params }: PageProps) {
  const { titleGame } = await params;
  const gameInfo = gamesData[titleGame];
  const products = productsData[titleGame];

  if (!gameInfo || !products) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#060b14] bg-tech-grid text-slate-100">
      {/* Game Header matching top bar in reference UI */}
      <GameHeader gameInfo={gameInfo} />

      {/* Interactive Top-Up Flow */}
      <main>
        <ClientTopUp gameId={titleGame} gameInfo={gameInfo} products={products} />
      </main>
    </div>
  );
}
