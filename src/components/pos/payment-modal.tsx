// frontend/src/components/pos/payment-modal.tsx
"use client";

import { FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";

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
}: PaymentModalProps) {
  const cashAmount = Number(cashPaid) || 0;
  const change = cashAmount > totalAmount ? cashAmount - totalAmount : 0;
  const isCashInsufficient = cashAmount < totalAmount;
  const isMidtrans = selectedMethodId === 3;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isMidtrans && isCashInsufficient) {
      toast.error("Uang tunai kurang dari total belanja.");
      return;
    }
    onSubmit(cashAmount, change);
  };

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
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-dashed border-slate-300">
            <Label className="text-lg font-medium">Total Belanja</Label>
            <span 
              onClick={() => onCashPaidChange(totalAmount.toString())} 
              className="text-2xl font-black cursor-pointer hover:text-primary transition-colors"
              title="Klik untuk pas uang"
            >
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>

          <Separator />

          {!isMidtrans ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cashPaid" className="text-sm font-bold text-slate-600">Uang Tunai Diterima</Label>
                <Input
                  id="cashPaid"
                  type="number"
                  placeholder="0"
                  value={cashPaid}
                  onChange={(e) => onCashPaidChange(e.target.value)}
                  className="text-3xl h-16 font-black text-center"
                  autoFocus
                />
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-100">
                <span className="text-sm font-bold text-green-700 uppercase">Kembalian</span>
                <span className="text-2xl font-black text-green-800">
                  Rp {change.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-blue-800 font-extrabold text-sm uppercase tracking-wider">Gateway Aktif</p>
                <p className="text-blue-600 text-xs">Otomatis membuka Midtrans Snap</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500 animate-pulse" />
            </div>
          )}

          <DialogFooter className="pt-4">
            {isMidtrans ? (
              <Button
                type="submit"
                className="w-full h-14 text-xl font-black bg-blue-600 hover:bg-blue-700 shadow-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-6 w-6" />
                )}
                PROSES PEMBAYARAN
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full h-14 text-xl font-black shadow-xl"
                disabled={isSubmitting || (isCashInsufficient && !isMidtrans)}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : "SELESAIKAN TRANSAKSI"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}