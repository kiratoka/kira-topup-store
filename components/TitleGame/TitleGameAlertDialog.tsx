"use client";

import React from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TitleGameAlertDialogProps } from '@/lib/types';

export const TitleGameAlertDialog = ({
  showError,
  errorMessage,
  setShowValidationDialog,
  showValidationDialog,
  validationErrors,
  showConfirmDialog,
  setShowConfirmDialog,
  selectedProduct,
  userId,
  gameInfo,
  serverId,
  email,
  handlePayment,
  showSuccessDialog,
  setShowSuccessDialog,
}: TitleGameAlertDialogProps) => {
  return (
    <>
      {/* Alert untuk error */}
      {showError && (
        <Alert variant="destructive" className="mb-6 bg-red-950/40 border border-red-500/50 text-red-200 rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-xs sm:text-sm font-medium">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Dialog validasi form */}
      <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <AlertDialogContent className="bg-[#0a1224]/95 backdrop-blur-xl border border-slate-800/90 text-white rounded-2xl shadow-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-amber-400">⚠️</span>
              <span>Form Belum Lengkap</span>
            </AlertDialogTitle>
            <div className="mt-3 text-slate-300">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Mohon lengkapi data berikut:
              </div>
              <ul className="space-y-1.5 bg-[#0d1629]/80 border border-slate-800 rounded-xl p-3.5">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-xs sm:text-sm text-cyan-300 flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20"
              onClick={() => setShowValidationDialog(false)}
            >
              Mengerti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog konfirmasi pembayaran */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-[#0a1224]/95 backdrop-blur-xl border border-slate-800/90 text-white rounded-2xl shadow-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-white">
              Konfirmasi Pembelian
            </AlertDialogTitle>
            <div className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
              <div>
                Apakah Anda yakin ingin membeli{' '}
                <strong className="text-cyan-400 font-bold">{selectedProduct?.name}</strong> seharga{' '}
                <strong className="text-white font-bold">
                  Rp {selectedProduct?.price.toLocaleString('id-ID')}
                </strong>
                ?
              </div>
              <div className="mt-3 p-3.5 bg-[#0d1629]/90 border border-slate-700/60 rounded-xl">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Detail Pembelian:
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                  <li className="flex justify-between">
                    <span className="text-slate-400">Game:</span>
                    <span className="font-medium text-white">{gameInfo.name}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">User ID:</span>
                    <span className="font-mono font-medium text-cyan-400">{userId}</span>
                  </li>
                  {gameInfo.requiresServer && serverId && (
                    <li className="flex justify-between">
                      <span className="text-slate-400">Server ID:</span>
                      <span className="font-mono font-medium text-cyan-400">{serverId}</span>
                    </li>
                  )}
                  <li className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-medium text-white truncate max-w-[200px]">{email}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Item:</span>
                    <span className="font-semibold text-cyan-300">
                      {selectedProduct?.currency.amount} {selectedProduct?.currency.name}
                    </span>
                  </li>
                  {selectedProduct?.currency.bonus ? (
                    <li className="flex justify-between text-green-400">
                      <span>Bonus:</span>
                      <span>+{selectedProduct.currency.bonus}</span>
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20"
              onClick={handlePayment}
            >
              Lanjutkan Pembayaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog sukses pembayaran */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-[#0c1f3d] to-[#08152a] border border-cyan-500/40 text-white rounded-2xl shadow-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-3">
              <div className="bg-cyan-500/20 border border-cyan-400/40 rounded-full p-3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <CheckCircle2 className="h-10 w-10 text-cyan-400" />
              </div>
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center text-white">
              Pembayaran Berhasil!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-300 text-xs sm:text-sm">
              <span className="block mb-1.5">
                🎉 Selamat! Pembayaran Anda telah berhasil diproses secara otomatis.
              </span>
              <span className="block text-cyan-300/90 text-xs">
                Diamond akan masuk ke akun Anda dalam hitungan detik.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              onClick={() => setShowSuccessDialog(false)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25"
            >
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TitleGameAlertDialog;