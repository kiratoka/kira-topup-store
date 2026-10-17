"use client";

import React from 'react';
import { Info } from 'lucide-react';
import type { GameInfo } from '@/lib/types/game';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AccountInfoSectionProps {
  userId: string;
  handleUserIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  gameInfo: GameInfo;
  gameId: string;
  serverId: string;
  handleServerIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setServerId: (serverId: string) => void;
  email: string;
  setEmail: (email: string) => void;
  emailError?: string;
  setEmailError?: (error: string) => void;
}

export const AccountInfoSection: React.FC<AccountInfoSectionProps> = ({
  userId,
  handleUserIdChange,
  gameInfo,
  gameId,
  serverId,
  handleServerIdChange,
  setServerId,
  email,
  setEmail,
  emailError = '',
  setEmailError,
}) => {
  const validateEmail = (val: string) => {
    if (!val.trim()) {
      return 'Email wajib diisi';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return 'Format email tidak valid';
    }
    return '';
  };

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (setEmailError) {
      setEmailError(validateEmail(val));
    }
  };

  const hasServerDropdown = Boolean(
    gameInfo.requiresServer &&
    gameInfo.serverOptions &&
    gameInfo.serverOptions.length > 0 &&
    gameId !== 'mobile-legends'
  );

  return (
    <div className="bg-[#0a1224]/80 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 sm:p-6 md:p-7 shadow-xl shadow-cyan-950/10 transition-all">
      {/* Header with Step 01 */}
      <div className="flex items-center space-x-3.5 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 font-bold text-xs tracking-wider shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
          01
        </div>
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
            Masukkan Informasi Akun
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verifikasi User ID {gameInfo.requiresServer ? '& Server ' : ''}akun {gameInfo.name} Anda
          </p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* User ID & Server ID Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* User ID Input */}
          <div className={gameInfo.requiresServer ? 'md:col-span-7' : 'md:col-span-12'}>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="userIdInput" className="text-xs sm:text-sm font-medium text-slate-300">
                User ID
              </label>
              <span className="text-[11px] text-slate-500">Contoh: 12345678</span>
            </div>
            <div className="relative flex items-center">
              <input
                id="userIdInput"
                type="number"
                value={userId}
                onChange={handleUserIdChange}
                placeholder="Masukkan User ID"
                className="w-full bg-[#0d1629]/90 rounded-xl border border-slate-700/80 px-4 py-2.5 sm:py-3 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 text-xs font-semibold text-slate-500 pointer-events-none select-none">
                #ID
              </span>
            </div>
          </div>

          {/* Server ID / Zone Input */}
          {gameInfo.requiresServer && (
            <div className="md:col-span-5">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="serverIdInput" className="text-xs sm:text-sm font-medium text-slate-300">
                  Server ID
                </label>
                <span className="text-[11px] text-slate-500">
                  {gameId === 'mobile-legends' ? '(Zone)' : '(Server)'}
                </span>
              </div>

              {hasServerDropdown ? (
                <Select
                  value={serverId}
                  onValueChange={(value) => {
                    setServerId(value);
                  }}
                >
                  <SelectTrigger className="w-full bg-[#0d1629]/90 rounded-xl border border-slate-700/80 px-4 py-2.5 sm:py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                    <SelectValue placeholder="Pilih Server" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b1329] border border-slate-800 text-slate-200">
                    {gameInfo.serverOptions?.map((server) => (
                      <SelectItem key={server.id} value={server.id} className="hover:bg-slate-800/80 cursor-pointer">
                        {server.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative flex items-center">
                  <input
                    id="serverIdInput"
                    type="number"
                    value={serverId}
                    onChange={handleServerIdChange}
                    onKeyDown={(e) => {
                      if (e.key === '-') {
                        e.preventDefault();
                      }
                    }}
                    placeholder={gameId === 'mobile-legends' ? 'Contoh: 2024' : 'Masukkan Server ID'}
                    className="w-full bg-[#0d1629]/90 rounded-xl border border-slate-700/80 px-4 py-2.5 sm:py-3 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Email Row */}
        <div>
          <label htmlFor="emailInput" className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
            Email
          </label>
          <div className="relative flex items-center">
            <input
              id="emailInput"
              type="email"
              value={email}
              onChange={onEmailChange}
              placeholder="Masukkan email yang valid"
              className={`w-full bg-[#0d1629]/90 rounded-xl border ${
                emailError
                  ? 'border-red-500/80 ring-1 ring-red-500/50'
                  : 'border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
              } px-4 py-2.5 sm:py-3 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none transition-all`}
            />
            <span className="absolute right-4 text-sm font-semibold text-slate-500 pointer-events-none select-none">
              @
            </span>
          </div>

          {emailError && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <span>✕</span> {emailError}
            </p>
          )}

          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-2.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Invoice dan detail transaksi akan dikirim ke email ini secara instan.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfoSection;
