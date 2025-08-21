"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Shield, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { ClientTopUpProps, TopUpProduct } from '@/lib/types';
import TitleGameAlertDialog from './TitleGameAlertDialog';
import FormTopUp from './FormTopUp';

// Declare window.snap type
declare global {
    interface Window {
        snap: any;
    }
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
    const [isMidtransReady, setIsMidtransReady] = useState(false);

    // Fungsi untuk check apakah Midtrans sudah ready
    const checkMidtransReady = () => {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.snap) {
                    clearInterval(checkInterval);
                    setIsMidtransReady(true);
                    resolve(true);
                }
            }, 100); // Check setiap 100ms

            // Timeout setelah 10 detik
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!window.snap) {
                    resolve(false);
                }
            }, 10000);
        });
    };

    // Tambahkan script Midtrans Snap ke head dengan loading handler
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
        
        // Add loading event handlers
        script.onload = () => {
            console.log('✅ Midtrans script loaded successfully');
            checkMidtransReady();
        };

        script.onerror = () => {
            console.error('❌ Failed to load Midtrans script');
            setErrorMessage('Gagal memuat script pembayaran. Silakan refresh halaman.');
            setShowError(true);
        };

        document.head.appendChild(script);

        return () => {
            try {
                document.head.removeChild(script);
            } catch (error) {
                console.warn('Script already removed');
            }
        };
    }, []);

    // Fungsi untuk validasi form
    const validateForm = useCallback(() => {
        const isUserIdValid = userId.trim().length > 0;
        const isServerValid = !gameInfo.requiresServer || serverId.trim().length > 0;
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const isProductSelected = selectedProduct !== null;
        return { isUserIdValid, isServerValid, isEmailValid, isProductSelected };
    }, [userId, serverId, email, selectedProduct, gameInfo.requiresServer]);

    // Fungsi untuk mengupdate status validasi form
    useEffect(() => {
        const { isUserIdValid, isServerValid, isEmailValid, isProductSelected } = validateForm();
        setIsFormValid(isUserIdValid && isServerValid && isEmailValid && isProductSelected);
    }, [validateForm]);

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
            setShowConfirmDialog(false);

            // Tunggu sampai Midtrans ready
            console.log('🔄 Checking Midtrans readiness...');
            const isReady = await checkMidtransReady();
            
            if (!isReady) {
                console.error("❌ Midtrans tidak siap setelah 10 detik");
                setErrorMessage("Sistem pembayaran belum siap. Silakan refresh halaman dan coba lagi.");
                setShowError(true);
                setIsProcessing(false);
                return;
            }

            console.log('✅ Midtrans ready, proceeding with payment...');

            const response = await axios.post('/api/payment', {
                product: selectedProduct,
                customer: {
                    email: email,
                    userId: userId,
                    serverId: serverId || undefined,
                    gameId: gameId
                }
            });

            const { token, orderId } = response.data;

            if (!token) {
                console.error("❌ Token kosong, Snap tidak bisa jalan.");
                setErrorMessage("Token pembayaran tidak valid. Silakan coba lagi.");
                setShowError(true);
                setIsProcessing(false);
                return;
            }

            console.log("✅ Menjalankan Snap popup...");

            window.snap.pay(token, {
                onSuccess: (result: any) => {
                    console.log('Payment success:', result);
                    setShowSuccessDialog(true);
                    setIsProcessing(false);
                    window.location.href = `/invoice/${orderId}`;
                },
                onPending: (result: any) => {
                    console.log('Payment pending:', result);
                    setIsProcessing(false);
                    window.location.href = `/invoice/${orderId}?status=pending`;
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
                    window.location.href = `/invoice/${orderId}?status=pending`;
                }
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                setErrorMessage(error.response.data?.message || '❌ Terlalu banyak permintaan. Coba lagi nanti.');
            } else {
                console.error('Payment initiation failed:', error);
                setErrorMessage('Gagal memulai pembayaran. Silahkan coba lagi.');
            }
            setShowError(true);
            setIsProcessing(false);
        }
    };

    // Handler untuk perubahan pada input Server ID
    const handleServerIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace('-', '');
        if (value === '' || parseInt(value) >= 0) {
            setServerId(value);
        }
    };

    const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace('-', '');
        if (value === '' || parseInt(value) >= 0) {
            setUserId(value);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div>
                <TitleGameAlertDialog
                    showError={showError}
                    errorMessage={errorMessage}
                    setShowValidationDialog={setShowValidationDialog}
                    showValidationDialog={showValidationDialog}
                    validationErrors={validationErrors}
                    showConfirmDialog={showConfirmDialog}
                    setShowConfirmDialog={setShowConfirmDialog}
                    selectedProduct={selectedProduct}
                    userId={userId}
                    gameInfo={gameInfo}
                    serverId={serverId}
                    email={email}
                    handlePayment={handlePayment}
                    showSuccessDialog={showSuccessDialog}
                    setShowSuccessDialog={setShowSuccessDialog}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kolom Kiri: Form dan Daftar Produk */}
                <FormTopUp
                    userId={userId}
                    handleUserIdChange={handleUserIdChange}
                    gameInfo={gameInfo}
                    gameId={gameId}
                    serverId={serverId}
                    handleServerIdChange={handleServerIdChange}
                    setServerId={setServerId}
                    email={email}
                    setEmail={setEmail}
                    products={products}
                    selectedProduct={selectedProduct}
                    setSelectedProduct={setSelectedProduct}
                    isProcessing={isProcessing}
                    handlePaymentClick={handlePaymentClick}
                    isFormValid={isFormValid && isMidtransReady} // Tambahkan check Midtrans ready
                />

                {/* Kolom Kanan: Informasi Tambahan */}
                <div className="space-y-6">
                    {/* Loading indicator untuk Midtrans */}
                    {!isMidtransReady && (
                        <div className="bg-yellow-900/20 border border-yellow-600 rounded-xl p-4">
                            <div className="flex items-center space-x-3">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                                <span className="text-sm text-yellow-400">Memuat sistem pembayaran...</span>
                            </div>
                        </div>
                    )}

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