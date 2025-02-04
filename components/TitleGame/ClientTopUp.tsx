"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { GameInfo, TopUpProduct } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

declare global {
    interface Window {
        snap: {
            pay: (token: string, options: any) => void;
        };
    }
}

interface ClientTopUpProps {
    gameId: string;
    gameInfo: GameInfo;
    products: TopUpProduct[];
}

const ClientTopUp = ({ gameId, gameInfo, products }: ClientTopUpProps) => {
    // State untuk validasi form dan input data
    const [isFormValid, setIsFormValid] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<TopUpProduct | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [userId, setUserId] = useState('');
    const [serverId, setServerId] = useState('');
    const [email, setEmail] = useState('');
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showValidationDialog, setShowValidationDialog] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    // Tambahkan script Midtrans Snap ke head
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    // Fungsi untuk validasi form
    const validateForm = () => {
        const isUserIdValid = userId.trim().length > 0;
        const isServerValid = !gameInfo.requiresServer || serverId.trim().length > 0;
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const isProductSelected = selectedProduct !== null;
        return { isUserIdValid, isServerValid, isEmailValid, isProductSelected };
    };

    // Fungsi untuk mengupdate status validasi form
    const updateFormValidation = () => {
        const { isUserIdValid, isServerValid, isEmailValid, isProductSelected } = validateForm();
        setIsFormValid(isUserIdValid && isServerValid && isEmailValid && isProductSelected);
    };

    // Handler untuk klik tombol pembayaran
    const handlePaymentClick = () => {
        const { isUserIdValid, isServerValid, isEmailValid, isProductSelected } = validateForm();
        const errors = [];

        if (!isProductSelected) errors.push("Pilih produk");
        if (!isUserIdValid) errors.push("Masukkan User ID");
        if (!isServerValid) errors.push("Masukkan Server ID");
        if (!isEmailValid) errors.push("Masukkan email yang valid");

        if (errors.length > 0) {
            setValidationErrors(errors);
            setShowValidationDialog(true);
            return;
        }

        // Jika form valid, tampilkan dialog konfirmasi
        setShowConfirmDialog(true);
    };

    // Handler untuk proses pembayaran menggunakan axios dan Midtrans Snap
    const handlePayment = async () => {
        try {
            setIsProcessing(true);
            setShowConfirmDialog(false); // Tutup dialog konfirmasi sebelum memulai pembayaran

            const response = await axios.post('/api/payment', {
                product: selectedProduct,
                customer: {
                    email: email,
                    userId: userId,
                    serverId: serverId || undefined,
                    gameId: gameId
                }
            });

            const { token } = response.data;

            window.snap.pay(token, {
                onSuccess: (result: any) => {
                    console.log('Payment success:', result);
                    // Tampilkan dialog sukses tanpa mereset form
                    setShowSuccessDialog(true);
                    setIsProcessing(false);
                },
                onPending: (result: any) => {
                    console.log('Payment pending:', result);
                    setIsProcessing(false);
                },
                onError: (result: any) => {
                    console.error('Payment error:', result);
                    setErrorMessage("Terjadi kesalahan saat memproses pembayaran");
                    setShowError(true);
                    setIsProcessing(false);
                },
                onClose: () => {
                    setIsProcessing(false);
                    console.log('Customer closed the popup without finishing the payment');
                }
            });
        } catch (error) {
            console.error('Payment initiation failed:', error);
            setErrorMessage("Gagal memulai pembayaran. Silahkan coba lagi.");
            setShowError(true);
            setIsProcessing(false);
        }
    };

    // Handler untuk perubahan pada input Server ID
    const handleServerIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace('-', '');
        if (value === '' || parseInt(value) >= 0) {
            setServerId(value);
            updateFormValidation();
        }
    };

    // Style untuk input number
    const numberInputStyle = `
        w-full bg-gray-800 rounded-lg border border-gray-700 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent
        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
    `;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
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
                            <div className="mb-2">🎉 Selamat! Pembayaran Anda telah berhasil diproses.</div>
                            <div className="text-green-200">Silakan tutup dialog ini untuk melakukan top up lagi.</div>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kolom Kiri: Form dan Daftar Produk */}
                <div className="lg:col-span-2">
                    {/* Form Section */}
                    <div className="bg-gray-900 rounded-xl p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Masukkan Informasi Akun</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">User ID</label>
                                <input
                                    type="text"
                                    value={userId}
                                    onChange={(e) => {
                                        setUserId(e.target.value);
                                        updateFormValidation();
                                    }}
                                    className="w-full bg-gray-800 rounded-lg border border-gray-700 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Masukkan User ID"
                                />
                            </div>

                            {gameInfo.requiresServer && gameId === "mobile-legends" && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Server ID</label>
                                    <input
                                        type="number"
                                        value={serverId}
                                        onChange={handleServerIdChange}
                                        onKeyDown={(e) => {
                                            if (e.key === '-') {
                                                e.preventDefault();
                                            }
                                        }}
                                        className={numberInputStyle}
                                        placeholder="Masukkan Server ID"
                                    />
                                </div>
                            )}

                            {gameInfo.requiresServer && gameId !== "mobile-legends" && gameId !== "love-and-deepspace" && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Server</label>
                                    <Select
                                        value={serverId}
                                        onValueChange={(value) => {
                                            setServerId(value);
                                            updateFormValidation();
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih Server" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gameInfo.serverOptions?.map((server) => (
                                                <SelectItem key={server.id} value={server.id}>
                                                    {server.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        updateFormValidation();
                                    }}
                                    className="w-full bg-gray-800 rounded-lg border border-gray-700 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Masukkan email yang valid"
                                />
                                <div className="mt-1 text-sm text-gray-400">
                                    Invoice dan detail transaksi akan dikirim ke email ini
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => {
                                    setSelectedProduct(product);
                                    updateFormValidation();
                                }}
                                className={`${selectedProduct?.id === product.id
                                    ? 'ring-2 ring-blue-500'
                                    : 'hover:bg-gray-800'
                                    } bg-gray-900 rounded-xl p-4 transition-all duration-200 text-left`}
                            >
                                <div className="flex items-start space-x-4">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-16 h-16 rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold">{product.name}</h3>
                                            {product.popular && (
                                                <span className="px-2 py-1 bg-blue-500 text-xs rounded-full">
                                                    Popular
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">{product.description}</p>
                                        <div className="mt-2">
                                            <span className="text-lg font-bold">
                                                Rp {product.price.toLocaleString('id-ID')}
                                            </span>
                                            {product.currency.bonus && (
                                                <span className="ml-2 text-sm text-green-400">
                                                    +{product.currency.bonus} Bonus
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Payment Button */}
                    <div className="mt-6">
                        <button
                            onClick={handlePaymentClick}
                            disabled={isProcessing}
                            className={`w-full py-3 px-4 rounded-lg font-semibold ${isFormValid && !isProcessing
                                ? 'bg-cyan-600 hover:bg-cyan-700'
                                : 'bg-gray-600 cursor-pointer'
                                } transition-colors duration-200`}
                        >
                            {isProcessing
                                ? 'Memproses Pembayaran...'
                                : `Bayar Rp ${selectedProduct?.price.toLocaleString('id-ID') || 0}`
                            }
                        </button>
                    </div>
                </div>

                {/* Kolom Kanan: Informasi Tambahan */}
                <div className="space-y-6">
                    {/* Keunggulan Kami */}
                    <div className="bg-gray-900 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Keunggulan Kami</h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Shield className="w-5 h-5 text-cyan-500" />
                                <span className="text-sm">Proses Aman & Terpercaya</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <CreditCard className="w-5 h-5 text-cyan-500" />
                                <span className="text-sm">Berbagai Metode Pembayaran</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Wallet className="w-5 h-5 text-cyan-500" />
                                <span className="text-sm">Harga Terbaik</span>
                            </div>
                        </div>
                    </div>

                    {/* Cara Top Up */}
                    <div className="bg-gray-900 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Cara Top Up</h3>
                        <ol className="space-y-3">
                            {gameInfo.instructions.map((instruction, index) => (
                                <li key={index} className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-sm">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm">{instruction}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Peringatan */}
                    <div className="bg-gray-800 rounded-xl p-4 flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-400">
                            Pastikan User ID {gameInfo.requiresServer && 'dan Server'} yang dimasukkan sudah benar. Kesalahan input bukan tanggung jawab kami.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientTopUp;
