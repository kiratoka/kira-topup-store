"use client";

import React from 'react';
import Image from 'next/image';
import { GameInfo } from '@/lib/types';

interface GameHeaderProps {
  gameInfo: GameInfo;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameInfo }) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#070c18]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex items-center space-x-3.5 sm:space-x-4">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#091224] shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center p-0.5">
            <Image
              src={gameInfo.image}
              alt={gameInfo.name}
              fill
              sizes="(max-width: 640px) 48px, 56px"
              className="object-cover rounded-xl"
              priority
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight truncate">
              {gameInfo.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 truncate mt-0.5">
              {gameInfo.description || `Top up ${gameInfo.name} dengan harga terbaik & proses kilat`}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GameHeader;
