// app/page.tsx
"use client";
import React from 'react';
import Link from "next/link";
import { motion } from "framer-motion";
import { games } from '@/lib/datas/gameData';

export default function Home() {
  return (
    <div className="min-h-screen mx-4 py-16 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Glowing Orb Background Effect */}
      <div className="fixed -top-1/2 left-1/2 transform -translate-x-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 rounded-full bg-cyan-500 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 relative z-10">
        {/* Enhanced Header Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 relative inline-block">
            <span className="relative z-10">Koleksi Game</span>
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          </h1>
          <p className="text-cyan-400 text-lg mb-6">Tempat Top Up Terpercaya</p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cari game..."
                className="w-full bg-gray-900/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 backdrop-blur-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Game Grid */}
        <motion.div 
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-4"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {games.map((game, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <Link href={game.link} className="block h-full">
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg overflow-hidden h-full flex flex-col transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] border border-cyan-500/20">
                  <div className="relative w-full pt-[100%] group">
                    <img
                      src={game.image}
                      alt={`${game.name} Logo`}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-cyan-500 text-sm">Lihat detail</span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex items-center justify-center relative">
                    <h2 className="text-gray-200 text-center max-sm:text-xs font-bold leading-tight">
                      {game.name}
                    </h2>
                    <div className="absolute -bottom-px left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Featured Section */}
        <motion.div 
          className="mt-16 bg-gray-900/30 backdrop-blur-md rounded-xl p-8 border border-cyan-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Featured Game</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-cyan-400 text-xl">Latest Release</h3>
              <p className="text-gray-300">Experience the newest addition to our collection with enhanced graphics and immersive gameplay.</p>
              <button className="px-6 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 rounded-lg hover:bg-cyan-500/20 transition-colors">
                Learn More
              </button>
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              {/* Placeholder for featured game image */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 animate-pulse" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}