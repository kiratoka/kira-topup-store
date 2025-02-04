import React from 'react';
import Link from "next/link";
import { games } from '@/lib/datas/gameData';


export default function Home() {
  return (
    <div className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
    List Game
          </h1>
          <div className="w-20 h-1 bg-gray-800 mx-auto"/>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-4">
          {games.map((game, index) => (
            <Link key={index} href={game.link} className="block h-full">
              <div className="bg-gray-900 rounded-lg overflow-hidden h-full flex flex-col transform transition-all duration-300 hover:-translate-y-1">
                <div className="relative w-full pt-[100%]">
                  <img
                    src={game.image}
                    alt={`${game.name} Logo`}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 hover:opacity-30 transition-opacity duration-300" />
                </div>
                <div className="p-3 flex-1 flex items-center justify-center">
                  <h2 className="text-gray-200 text-center max-sm:text-xs font-bold leading-tight">
                    {game.name}
                  </h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}