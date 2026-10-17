"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import type { ClientTopUpProps, TopUpProduct } from '@/lib/types/game';
import { getMidtransSnapUrl } from '@/lib/payment/midtrans';
import TitleGameAlertDialog from './TitleGameAlertDialog';
import AccountInfoSection from './AccountInfoSection';
import ProductSelectionSection from './ProductSelectionSection';
import BenefitsSidebar from './BenefitsSidebar';
import StickyCheckoutBar from './StickyCheckoutBar';

export const ClientTopUp = ({ gameId, gameInfo, products }: ClientTopUpProps) => {
  const router = useRouter();

  // State form dan pilihan produk
  const [selectedProduct, setSelectedProduct] = useState<TopUpProduct | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState('');
  const [serverId, setServerId] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Dialog status
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Injeksi Midtrans Snap script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = getMidtransSnapUrl();
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Validasi form
  const validateForm = useCallback(() => {
    const isUserIdValid = userId.trim().length > 0;
    const isServerValid = !gameInfo.requiresServer || serverId.trim().length > 0;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isProductSelected = selectedProduct !== null;
    return { isUserIdValid, isServerValid, isEmailValid, isProductSelected };
  }, [userId, serverId, email, selectedProduct, gameInfo.requiresServer]);

  const { isUserIdValid, isServerValid, isEmailValid, isProductSelected } = validateForm();
  const isFormValid = isUserIdValid && isServerValid && isEmailValid && isProductSelected;

  // Handler klik bayar
  const handlePaymentClick = () => {
    const { isUserIdValid, isServerValid, isEmailValid, isProductSelected } = validateForm();
    const errors: string[] = [];

    if (!isUserIdValid) errors.push('Masukkan User ID');
    if (!isServerValid) errors.push('Masukkan Server ID');
    if (!isEmailValid) errors.push('Masukkan email yang valid');
    if (!isProductSelected) errors.push('Pilih nominal produk');

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationDialog(true);
      return;
    }

    setShowConfirmDialog(true);
  };

  // Handler proses transaksi Midtrans Snap
  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setShowConfirmDialog(false);

      const response = await axios.post('/api/payment', {
        productId: selectedProduct?.id,
        product: selectedProduct,
        customer: {
          email: email.trim(),
          userId: userId.trim(),
          serverId: serverId ? serverId.trim() : undefined,
          gameId: gameId,
        },
      });

      const { token, orderId } = response.data;

      if (!window.snap) {
        throw new Error('Midtrans Snap tidak tersedia');
      }

      window.snap.pay(token, {
        onSuccess: (result) => {
          console.log('Payment success:', result);
          setShowSuccessDialog(true);
          setIsProcessing(false);
          router.push(`/invoice/${orderId}`);
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          setIsProcessing(false);
          router.push(`/invoice/${orderId}?status=pending`);
        },
        onError: (result) => {
          console.error('Payment error:', result);
          setErrorMessage('Terjadi kesalahan saat memproses pembayaran');
          setShowError(true);
          setIsProcessing(false);
        },
        onClose: () => {
          setIsProcessing(false);
          console.log('Customer closed popup before payment');
          router.push(`/invoice/${orderId}?status=pending`);
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          alert(error.response.data?.message || '❌ Terlalu banyak permintaan. Coba lagi nanti.');
        } else if (error.response?.status === 400) {
          const errorData = error.response.data;
          let msg = errorData?.message || 'Data pembayaran tidak valid.';
          if (errorData?.errors && typeof errorData.errors === 'object') {
            const fieldErrors = Object.values(errorData.errors);
            if (fieldErrors.length > 0 && typeof fieldErrors[0] === 'string') {
              msg = `${msg}: ${fieldErrors[0]}`;
            }
          }
          setErrorMessage(msg);
          setShowError(true);
        } else {
          console.error('Payment initiation failed:', error);
          setErrorMessage(error.response?.data?.message || 'Gagal memulai pembayaran. Silakan coba lagi.');
          setShowError(true);
        }
      } else {
        console.error('Payment initiation failed:', error);
        setErrorMessage('Gagal memulai pembayaran. Silakan coba lagi.');
        setShowError(true);
      }

      setIsProcessing(false);
    }
  };

  const handleServerIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace('-', '');
    if (value === '' || parseInt(value, 10) >= 0) {
      setServerId(value);
    }
  };

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace('-', '');
    if (value === '' || parseInt(value, 10) >= 0) {
      setUserId(value);
    }
  };

  const currencyName =
    products.length > 0 && products[0].currency?.name
      ? products[0].currency.name
      : 'Diamond';

  return (
    <div className="relative min-h-screen pb-32 sm:pb-36">
      {/* Dialogs */}
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

      {/* Main Grid: Left 2 Cols (Inputs & Products), Right 1 Col (Sidebar) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Left Column: Step 01 & Step 02 */}
          <div className="lg:col-span-2 space-y-6">
            <AccountInfoSection
              userId={userId}
              handleUserIdChange={handleUserIdChange}
              gameInfo={gameInfo}
              gameId={gameId}
              serverId={serverId}
              handleServerIdChange={handleServerIdChange}
              setServerId={setServerId}
              email={email}
              setEmail={setEmail}
              emailError={emailError}
              setEmailError={setEmailError}
            />

            <ProductSelectionSection
              products={products}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              currencyName={currencyName}
            />
          </div>

          {/* Right Column: Keunggulan Kami, Cara Top Up, Peringatan */}
          <div className="lg:col-span-1">
            <BenefitsSidebar gameInfo={gameInfo} />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Checkout Bar */}
      <StickyCheckoutBar
        selectedProduct={selectedProduct}
        isProcessing={isProcessing}
        isFormValid={isFormValid}
        emailError={emailError}
        onPaymentClick={handlePaymentClick}
        currencyName={currencyName}
      />
    </div>
  );
};

export default ClientTopUp;
