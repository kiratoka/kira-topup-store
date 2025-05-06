"use client"
import { GameInfo, TopUpProduct } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import Image from "next/image";
import { useState } from "react";


interface FormTopUpProps {
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
const FormTopUp = ({
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
    isProcessing,
    handlePaymentClick,
    isFormValid,
}: FormTopUpProps) => {

    // Style untuk input number
    const numberInputStyle = `
 w-full bg-gray-800 rounded-lg border border-gray-700 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent
 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
`;
    const [emailError, setEmailError] = useState('');
    
    // Validasi email setiap kali berubah
    const validateEmail = (emailValue: string) => {
        if (!emailValue.trim()) {
            return 'Email wajib diisi';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            return 'Format email tidak valid';
        }
        return '';
    };

    // Handle email change dengan validasi real-time
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        setEmailError(validateEmail(newEmail));
    };

    return (
        <div className="lg:col-span-2">
            <div>
                {/* Form Section */}
                <div className="bg-gray-900 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Masukkan Informasi Akun</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">User ID</label>
                            <input
                                type="number"
                                value={userId}
                                onChange={handleUserIdChange}
                                className="w-full bg-gray-800 rounded-lg border border-gray-700 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                onChange={handleEmailChange}
                                className={`w-full bg-gray-800 rounded-lg border ${emailError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-700 focus:ring-2 focus:ring-blue-500'} px-4 py-2 focus:border-transparent`}
                                placeholder="Masukkan email yang valid"
                            />
                            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                            <div className="mt-1 text-sm text-gray-400">
                                Invoice dan detail transaksi akan dikirim ke email ini
                            </div>
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
                        }}
                        className={`${selectedProduct?.id === product.id
                            ? 'ring-2 ring-blue-500'
                            : 'hover:bg-gray-800'
                            } bg-gray-900 rounded-xl p-4 transition-all duration-200 text-left`}
                    >
                        <div className="flex items-start space-x-4">
                            <Image
                                src={product.image}
                                alt={product.name}
                                width={64}
                                height={64}
                                className="rounded-lg"
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
                    disabled={isProcessing || emailError !== ''}
                    className={`w-full py-3 px-4 rounded-lg font-semibold ${isFormValid && !isProcessing && emailError === ''
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
    )
}

export default FormTopUp