import type { GameInfo, TopUpProduct } from './game';

export interface TitleGameAlertDialogProps {
  showError: boolean;
  errorMessage: string;
  setShowValidationDialog: (show: boolean) => void;
  showValidationDialog: boolean;
  validationErrors: string[];
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  selectedProduct: TopUpProduct | null;
  userId: string;
  gameInfo: GameInfo;
  serverId: string;
  email: string;
  handlePayment: () => void;
  showSuccessDialog: boolean;
  setShowSuccessDialog: (success: boolean) => void;
}
