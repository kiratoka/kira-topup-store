import React from 'react'
import { Alert, AlertDescription } from '../ui/alert'
import { AlertCircle } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { AlertDialogFooter, AlertDialogHeader } from '../ui/alert-dialog'
import { GameInfo, TitleGameAlertDialogProps, TopUpProduct } from '@/lib/types'




const TitleGameAlertDialog = ({ showError, errorMessage, setShowValidationDialog, showValidationDialog, validationErrors, showConfirmDialog, setShowConfirmDialog, selectedProduct, userId, gameInfo, serverId, email, handlePayment, showSuccessDialog, setShowSuccessDialog }: TitleGameAlertDialogProps) => {
    return (
        <>
            {/* Alert untuk error */}
            {showError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {errorMessage}
                    </AlertDescription>
                </Alert>
            )}

            {/* Dialog validasi form */}
            <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
                <AlertDialogContent className='bg-gray-900 border border-gray-800 text-white'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Form Belum Lengkap</AlertDialogTitle>
                        <div className="mt-2">
                            <div className="font-medium mb-2">Mohon lengkapi data berikut:</div>
                            <ul className="list-disc pl-5 space-y-1">
                                {validationErrors.map((error, index) => (
                                    <li key={index} className="text-sm">{error}</li>
                                ))}
                            </ul>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            className='bg-cyan-600 hover:bg-cyan-700 text-white'
                            onClick={() => setShowValidationDialog(false)}
                        >
                            Mengerti
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog konfirmasi pembayaran */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className='bg-gray-900 border border-gray-800 text-white'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Pembelian</AlertDialogTitle>
                        <div>
                            <div>Apakah anda yakin ingin membeli {selectedProduct?.name} seharga Rp {selectedProduct?.price.toLocaleString('id-ID')}?</div>
                            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                                <div className="text-sm font-medium">Detail Pembelian:</div>
                                <ul className="mt-2 space-y-1 text-sm">
                                    <li>User ID: {userId}</li>
                                    {gameInfo.requiresServer && <li>Server ID: {serverId}</li>}
                                    <li>Email: {email}</li>
                                    <li>Jumlah: {selectedProduct?.currency.amount} {selectedProduct?.currency.name}</li>
                                    {selectedProduct?.currency.bonus && (
                                        <li className="text-green-500">Bonus: {selectedProduct.currency.bonus}</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className='bg-red-700 hover:bg-red-800 hover:text-white text-white border-gray-700'>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className='bg-cyan-600 hover:bg-cyan-700 text-white'
                            onClick={handlePayment}
                        >
                            Lanjutkan Pembayaran
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog sukses pembayaran dengan tema hijau */}
            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <AlertDialogContent className="bg-gradient-to-br from-green-600 to-green-800 border border-green-500 text-white shadow-xl">
                    <AlertDialogHeader>
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-green-500 rounded-full p-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-12 w-12 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                        </div>
                        <AlertDialogTitle className="text-2xl font-bold text-center mb-2">Pembayaran Berhasil!</AlertDialogTitle>
                        <AlertDialogDescription className='text-white text-center'>
                            <span className="block mb-2">🎉 Selamat! Pembayaran Anda telah berhasil diproses.</span>
                            <span className="block text-green-200">Silakan tutup dialog ini untuk melakukan top up lagi.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => setShowSuccessDialog(false)}
                            className="w-full bg-white text-green-700 hover:bg-green-100 font-semibold transition-colors duration-200"
                        >
                            Lanjutkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default TitleGameAlertDialog