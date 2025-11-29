// frontend/src/components/pos/payment-modal.tsx
"use client";

import { FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
}

export function PaymentModal({
  isOpen,
  onOpenChange,
  totalAmount,
  cashPaid,
  onCashPaidChange,
  onSubmit,
  isSubmitting,
}: PaymentModalProps) {
  const cashAmount = Number(cashPaid) || 0;
  const change = cashAmount > totalAmount ? cashAmount - totalAmount : 0;
  const isCashInsufficient = cashAmount < totalAmount;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isCashInsufficient) {
      toast.error("Uang tunai kurang dari total belanja.");
      return;
    }
    onSubmit(cashAmount, change);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
          <DialogDescription>
            Masukkan jumlah uang tunai yang diterima dari pelanggan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-medium">Total Belanja</Label>
              <span className="text-2xl font-bold">
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="cash-paid" className="text-base">
                Jumlah Tunai Diterima
              </Label>
              <Input
                id="cash-paid"
                type="number"
                value={cashPaid}
                onChange={(e) => onCashPaidChange(e.target.value)}
                placeholder="cth: 100000"
                className="text-lg"
                autoFocus
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <Label className="text-lg font-medium">Kembalian</Label>
              <span className="text-2xl font-bold text-blue-600">
                Rp {change.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="w-full text-lg"
              disabled={isSubmitting || isCashInsufficient}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              Konfirmasi & Kirim WA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}