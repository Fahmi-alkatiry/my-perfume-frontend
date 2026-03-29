// frontend/src/components/pos/payment-modal.tsx
"use client";

import { FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { PaymentSnap } from "./payment-snap";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  cashPaid: string;
  onCashPaidChange: (value: string) => void;
  onSubmit: (cashPaid: number, change: number) => void;
  isSubmitting: boolean;
  selectedMethodId: number | null;
  transactionId?: number | null;
  onPaymentSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  onOpenChange,
  totalAmount,
  cashPaid,
  onCashPaidChange,
  onSubmit,
  isSubmitting,
  selectedMethodId,
  transactionId,
  onPaymentSuccess,
}: PaymentModalProps) {
  const cashAmount = Number(cashPaid) || 0;
  const change = cashAmount > totalAmount ? cashAmount - totalAmount : 0;
  const isCashInsufficient = cashAmount < totalAmount;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isCashInsufficient && selectedMethodId !== 3) {
      toast.error("Uang tunai kurang dari total belanja.");
      return;
    }
    onSubmit(cashAmount, change);
  };

  const isMidtrans = selectedMethodId === 3;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isMidtrans ? "Pembayaran Online (Midtrans)" : "Konfirmasi Pembayaran"}
          </DialogTitle>
          <DialogDescription>
            {isMidtrans 
              ? "Selesaikan transaksi menggunakan metode pembayaran online pilihan Anda."
              : "Masukkan jumlah uang tunai yang diterima dari pelanggan."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-dashed">
                <Label className="text-lg font-medium">Total Belanja</Label>
                <span onClick={() => onCashPaidChange(totalAmount.toString())} className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <Separator />

              {!isMidtrans && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cashPaid">Uang Tunai</Label>
                    <Input
                      id="cashPaid"
                      type="number"
                      placeholder="Masukkan jumlah uang..."
                      value={cashPaid}
                      onChange={(e) => onCashPaidChange(e.target.value)}
                      className="text-xl h-12 font-bold"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-sm font-medium text-green-700">Kembalian</span>
                    <span className="text-xl font-bold text-green-800">
                      Rp {change.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          <DialogFooter>
            {isMidtrans ? (
              <div className="space-y-4 w-full">
                <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between border border-blue-100">
                  <div className="flex flex-col">
                    <span className="text-blue-700 font-bold text-sm">Metode Pembayaran Online</span>
                    <span className="text-blue-500 text-xs text-muted-foreground">Proses token via Midtrans</span>
                  </div>
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 font-bold shadow-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-5 w-5" />
                  )}
                  Buat Pesanan & Bayar
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                className="w-full text-lg h-12 font-bold"
                disabled={isSubmitting || isCashInsufficient}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                Konfirmasi & Kirim WA
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}