// frontend/src/components/pos/payment-snap.tsx
"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaymentSnapProps {
  /** Transaction ID in the backend (numeric) */
  transactionId: number;
  /** Optional callback after successful payment */
  onSuccess?: (result: any) => void;
  /** Optional callback after payment is pending */
  onPending?: (result: any) => void;
  /** Optional callback after an error occurs */
  onError?: (result: any) => void;
  /** Optional callback when the Snap popup is closed by the user */
  onClose?: () => void;
}

declare global {
  interface Window {
    snap: any;
  }
}

// Module-level set to prevent duplicate triggers in React Strict Mode (Dev)
const triggeredTransactions = new Set<number>();

export function PaymentSnap({
  transactionId,
  onSuccess,
  onPending,
  onError,
  onClose,
}: PaymentSnapProps) {
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [hasAutoRun, setHasAutoRun] = useState(false);

  const handlePay = async () => {
    if (isPopupOpen) return;
    
    setLoading(true);
    try {
      const res = await axios.post("/midtrans/token", {
          transactionId,
      });
      
      const data = res.data;
      const token = data.token?.token || data.token; // midtrans-client returns { token, redirect_url }

      // Ensure Midtrans Snap script is loaded
      if (!window.snap) {
        throw new Error("Midtrans Snap script not loaded");
      }

      setIsPopupOpen(true);
      window.snap.pay(token, {
        onSuccess: (result: any) => {
          setIsPopupOpen(false);
          triggeredTransactions.delete(transactionId);
          onSuccess?.(result);
        },
        onPending: (result: any) => {
          setIsPopupOpen(false);
          triggeredTransactions.delete(transactionId);
          onPending?.(result);
        },
        onError: (result: any) => {
          setIsPopupOpen(false);
          triggeredTransactions.delete(transactionId);
          onError?.(result);
        },
        onClose: () => {
          setIsPopupOpen(false);
          triggeredTransactions.delete(transactionId);
          onClose?.();
        },
      });
    } catch (err) {
      triggeredTransactions.delete(transactionId);
      console.error(err);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger on mount
  useEffect(() => {
    if (transactionId && !triggeredTransactions.has(transactionId)) {
      triggeredTransactions.add(transactionId);
      handlePay();
    }
  }, [transactionId]);

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />
    </>
  );
}
