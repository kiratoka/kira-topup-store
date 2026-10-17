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
  productId?: string;
  product?: ProductDetails;
}

export interface InvoiceData {
  id: string;
  orderId: string;
  token?: string | null;
  product: ProductDetails;
  customer: CustomerDetails;
  createdAt: string | Date;
  status: 'pending' | 'success' | 'failed' | 'expired';
  paymentMethod?: string | null;
  paymentTime?: string | Date | null;
  transactionId?: string | null;
  updatedAt: string | Date;
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
