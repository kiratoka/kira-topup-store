export type ServerOption = {
  id: string;
  name: string;
}

export type GameInfo = {
  id: string;
  name: string;
  image: string;
  description: string;
  requiresServer: boolean;
  serverOptions?: ServerOption[] | null;
  instructions: string[];
}

export type TopUpProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "subscription" | "currency" | "bundle";
  gameId: string;
  image: string;
  currency: {
    name: string;
    amount: number;
    bonus?: number;
  };
  validity?: string;
  featured?: boolean;
  popular?: boolean;
}

export interface ClientTopUpProps {
  gameId: string;
  gameInfo: GameInfo;
  products: TopUpProduct[];
}

export interface CustomerDetails {
  email: string;
  userId: string;
  serverId?: string;
  gameId: string;
}

export interface ProductDetails {
  id: string;
  name: string;
  price: number;
  currency: {
    amount: number;
    bonus?: number;
    name?: string;
  };
}

export interface PaymentRequest {
  customer: CustomerDetails;
  product: ProductDetails;
}

export interface InvoiceData {
  id: string;
  orderId: string;
  token: string;
  product: ProductDetails;
  customer: CustomerDetails;
  createdAt: string | Date;
  status: 'pending' | 'success' | 'failed' | 'expired';
  paymentMethod?: string | null;
  paymentTime?: string | Date | null;
  transactionId?: string | null;
  updatedAt: string | Date;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: {
    name: string;
    image: string;
  };
  tags: string[];
}


export interface TitleGameAlertDialogProps {
  showError: boolean;
  errorMessage: string;
  setShowValidationDialog: (show: boolean) => void;
  showValidationDialog: boolean;
  validationErrors: string[];
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  selectedProduct: TopUpProduct | null
  userId: string;
  gameInfo: GameInfo;
  serverId: string;
  email: string;
  handlePayment: () => void;
  showSuccessDialog: boolean;
  setShowSuccessDialog: (success: boolean) => void;
}


export interface SnapResponse {
  va_numbers: {
    va_number: string;
    bank: string;
  }[];
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  settlement_time?: string;
  payment_type: string;
  payment_amounts: {
    paid_at: string;
    amount: string;
  }[];
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status: string;
  expiry_time?: string;
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
  currency: string;
}
