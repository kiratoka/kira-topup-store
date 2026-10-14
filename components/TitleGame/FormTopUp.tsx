"use client";

import React, { useState } from 'react';
import { GameInfo, TopUpProduct } from '@/lib/types';
import AccountInfoSection from './AccountInfoSection';
import ProductSelectionSection from './ProductSelectionSection';

export interface FormTopUpProps {
  userId: string;
  handleUserIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  gameInfo: GameInfo;
  gameId: string;
  serverId: string;
  handleServerIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setServerId: (serverId: string) => void;
  products: TopUpProduct[];
  email: string;
  setEmail: (email: string) => void;
  selectedProduct: TopUpProduct | null;
  setSelectedProduct: (product: TopUpProduct) => void;
  isProcessing: boolean;
  handlePaymentClick: () => void;
  isFormValid: boolean;
}

export const FormTopUp: React.FC<FormTopUpProps> = ({
  userId,
  handleUserIdChange,
  gameInfo,
  gameId,
  serverId,
  handleServerIdChange,
  setServerId,
  products,
  email,
  setEmail,
  selectedProduct,
  setSelectedProduct,
}) => {
  const [emailError, setEmailError] = useState<string>('');

  const currencyName =
    products.length > 0 && products[0].currency?.name
      ? products[0].currency.name
      : 'Diamond';

  return (
    <div className="space-y-6">
      {/* Step 01: Account Information */}
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

      {/* Step 02: Product Denomination Selection */}
      <ProductSelectionSection
        products={products}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        currencyName={currencyName}
      />
    </div>
  );
};

export default FormTopUp;