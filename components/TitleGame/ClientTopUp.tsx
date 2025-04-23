"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { GameInfo, TopUpProduct } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TitleGameAlertDialog from './TitleGameAlertDialog';
import FormTopUp from './FormTopUp';

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
    // Di dalam component ClientTopUp
    useEffect(() => {
        const { isUserIdValid, isServerValid, isEmailValid, isProductSelected } = validateForm();
        setIsFormValid(isUserIdValid && isServerValid && isEmailValid && isProductSelected);
    }, [userId, serverId, email, selectedProduct, gameInfo.requiresServer]); // Dependencies

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

            const { token, orderId } = response.data;

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
                    window.location.href = `/invoice/${orderId}?status=pending`
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
                    isFormValid={isFormValid}
                />



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
