import { SnapResponse } from "@/lib/types";

// types/snap.d.ts
declare namespace MidtransSnap {
    // Options untuk Snap.pay
    interface SnapPayOptions {
        onSuccess?: (result: SnapResponse) => void;
        onPending?: (result: SnapResponse) => void;
        onError?: (result: SnapResponse) => void;
        onClose?: () => void;
        language?: 'id' | 'en';
        skipOrderSummary?: boolean;
        showOrderId?: boolean;
        // Tambahkan property lain sesuai kebutuhan
    }

    interface SnapInstance {
        pay: (token: string, options: SnapPayOptions) => void;
        // Tambahkan method lain jika ada
    }
}

declare global {
    interface Window {
        snap: MidtransSnap.SnapInstance;
    }
}

export { };