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

interface FrontMatter {
  title: string;
  excerpt: string;
  coverImage: string;
  date: string;
  readingTime: string;
  author: string;
  tags?: string[];
}

interface Post {
  content: string;
  frontMatter: FrontMatter;
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