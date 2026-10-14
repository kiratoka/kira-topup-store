"use client";

import React from 'react';
import { ShieldCheck, CreditCard, CircleDollarSign, AlertTriangle } from 'lucide-react';
import { GameInfo } from '@/lib/types';

interface BenefitsSidebarProps {
  gameInfo: GameInfo;
}

export const BenefitsSidebar: React.FC<BenefitsSidebarProps> = ({ gameInfo }) => {
  // Dynamic instructions fallback or custom instructions
  const defaultInstructions = [
    `Masukkan User ID ${gameInfo.requiresServer ? '(Server) dan Zone ID' : ''} Anda.`,
    'Pilih nominal top up yang diinginkan.',
    'Masukkan email yang valid untuk bukti transaksi.',
    'Pilih metode pembayaran favorit Anda.',
    `${gameInfo.id === 'mobile-legends' ? 'Diamond' : 'Item'} akan masuk otomatis ke akun Anda dalam hitungan detik.`,
  ];

  const instructions =
    gameInfo.instructions && gameInfo.instructions.length > 0
      ? gameInfo.instructions
      : defaultInstructions;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Keunggulan Kami Card */}
      <div className="bg-[#0a1224]/80 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 sm:p-6 shadow-xl shadow-cyan-950/10 transition-all">
        <div className="flex items-center space-x-2.5 mb-5">
          <span className="w-1.5 h-4 bg-cyan-400 rounded-full" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
            Keunggulan Kami
          </h3>
        </div>

        <div className="space-y-4">
          {/* Feature 1 */}
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white tracking-tight">Proses Aman & Terpercaya</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {gameInfo.id === 'mobile-legends'
                  ? 'Diamond legal 100% langsung via Moonton API resmi tanpa login akun.'
                  : 'Legal 100% langsung via publisher resmi tanpa perlu login ke akun Anda.'}
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
              <CreditCard className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white tracking-tight">Berbagai Metode Pembayaran</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Dukungan QRIS, Virtual Account bank terlengkap, dan dompet digital.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
              <CircleDollarSign className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white tracking-tight">Harga Terbaik</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Jaminan diskon flash sale berkala dengan biaya admin paling minim.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cara Top Up Card */}
      <div className="bg-[#0a1224]/80 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 sm:p-6 shadow-xl shadow-cyan-950/10 transition-all">
        <div className="flex items-center space-x-2.5 mb-5">
          <span className="w-1.5 h-4 bg-cyan-400 rounded-full" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
            Cara Top Up
          </h3>
        </div>

        <ol className="space-y-3">
          {instructions.map((step, idx) => {
            const isLastStep = idx === instructions.length - 1;
            return (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm leading-relaxed">
                <span className="w-6 h-6 min-w-[24px] min-h-[24px] rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_8px_rgba(6,182,212,0.15)]">
                  {idx + 1}
                </span>
                <span className={`flex-1 min-w-0 ${isLastStep ? 'text-cyan-400 font-medium' : 'text-slate-300'}`}>
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Peringatan / Alert Card */}
      <div className="bg-[#10121a] border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 shadow-md">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed flex-1 min-w-0">
          <strong className="text-amber-400 font-semibold">Penting: </strong>
          Pastikan User ID {gameInfo.requiresServer ? 'dan Server ' : ''}yang dimasukkan sudah benar.
          Kesalahan input data akun bukan merupakan tanggung jawab kami.
        </p>
      </div>
    </div>
  );
};

export default BenefitsSidebar;
