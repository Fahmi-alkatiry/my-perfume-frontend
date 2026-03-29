//frontend/src/components/pos/cart-view.tsx
"use client";

import {
  Minus,
  Plus,
  Trash2,
  DoorClosed,
  Loader2,
  X,
  Ticket,
  UserPlus,
  Nfc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerCombobox, Customer } from "./customer-combobox";

// --- Tipe Data ---
interface Product {
  id: number;
  name: string;
  sellingPrice: number;
  stock: number;
}
interface CartItem extends Product {
  quantity: number;
}
interface PaymentMethod {
  id: number;
  name: string;
}

interface CartViewProps {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  usePoints: boolean;
  onUsePointsChange: (value: boolean) => void;
  subtotal: number;
  discountAmount: number;
  cartTotal: number;
  isSubmitting: boolean;
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onOpenPaymentModal: () => void;
  paymentMethods: PaymentMethod[];
  selectedMethodId: number | null;
  onSelectMethod: (id: number) => void;
  onOpenEndShiftModal: () => void;

  // Props Voucher
  voucherCode: string;
  onVoucherCodeChange: (val: string) => void;
  onCheckVoucher: () => void;
  onRemoveVoucher: () => void;
  appliedVoucher: { code: string; discount: number } | null;
  isCheckingVoucher: boolean;

  // Props Baru
  onOpenAddCustomer: () => void;
  onStartNfcScan: () => void;
  isNfcScanning: boolean;
  
  // Penambahan Handler Checkout Langsung (Optional if using PaymentModal)
  // Tapi biasanya tombol bayar memanggil onOpenPaymentModal
  // Namun di beberapa versi Anda mengirim handleCheckout ke sini.
  // Saya akan sertakan agar aman.
  onHandleCheckout?: (cashPaid: number, change: number) => void;
}

export function CartView({
  cart,
  selectedCustomer,
  onSelectCustomer,
  usePoints,
  onUsePointsChange,
  subtotal,
  discountAmount,
  cartTotal,
  isSubmitting,
  onUpdateQuantity,
  onRemoveFromCart,
  onOpenPaymentModal,
  paymentMethods,
  selectedMethodId,
  onSelectMethod,
  onOpenEndShiftModal,
  // Voucher
  voucherCode,
  onVoucherCodeChange,
  onCheckVoucher,
  onRemoveVoucher,
  appliedVoucher,
  isCheckingVoucher,
  // Props Baru
  onOpenAddCustomer,
  onStartNfcScan,
  isNfcScanning,
  onHandleCheckout,
}: CartViewProps) {
  
  const voucherDiscount = appliedVoucher ? appliedVoucher.discount : 0;
  const totalAfterVoucher = subtotal - voucherDiscount;
  const safeTotalAfterVoucher = totalAfterVoucher > 0 ? totalAfterVoucher : 0;
  const potentialPoints = Math.floor(safeTotalAfterVoucher / 30000);
  const totalVirtualPoints = (selectedCustomer?.points || 0) + potentialPoints;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <div className="p-4 border-b shrink-0 flex justify-between items-center bg-gray-50">
        <h2 className="text-2xl font-bold">Keranjang</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenEndShiftModal}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <DoorClosed className="h-4 w-4 mr-2" /> Shift
        </Button>
      </div>

      {/* Pelanggan */}
      <div className="px-2 py-3 border-b shrink-0 bg-white">
        <div className="flex gap-1 items-start">
          <div className="flex-1">
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-md border p-2 bg-slate-50">
                <div className="space-y-0.5">
                  <p className="font-bold text-sm">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Poin: {selectedCustomer.points} (+{potentialPoints})
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSelectCustomer(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <CustomerCombobox onSelectCustomer={onSelectCustomer} />
            )}
          </div>
          {!selectedCustomer && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={onStartNfcScan}
                className={isNfcScanning ? "animate-pulse border-blue-500 text-blue-500 bg-blue-50" : ""}
                title="Scan NFC"
              >
                <Nfc className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={onOpenAddCustomer} title="Tambah Pelanggan">
                <UserPlus className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cart.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  Keranjang kosong
                </TableCell>
              </TableRow>
            ) : (
              cart.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.name}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      @ Rp {Number(item.sellingPrice).toLocaleString("id-ID")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    Rp {(Number(item.sellingPrice) * item.quantity).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => onRemoveFromCart(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="p-3 border-t shrink-0 bg-gray-50 space-y-3">
        {/* Ringkasan */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          
          <div className="flex gap-1">
            <div className="relative flex-1">
              <Ticket className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kode Voucher"
                className="pl-8 h-9 text-sm"
                value={voucherCode}
                onChange={(e) => onVoucherCodeChange(e.target.value.toUpperCase())}
                disabled={!!appliedVoucher}
              />
            </div>
            {appliedVoucher ? (
              <Button variant="destructive" size="icon" className="h-9 w-9" onClick={onRemoveVoucher}>
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="secondary" className="h-9 px-3" onClick={onCheckVoucher} disabled={isCheckingVoucher || !voucherCode}>
                {isCheckingVoucher ? <Loader2 className="animate-spin h-4 w-4" /> : "Cek"}
              </Button>
            )}
          </div>

          {appliedVoucher && (
            <div className="flex justify-between text-green-600 font-medium text-xs bg-green-50 p-2 rounded border border-green-200">
              <span>Voucher ({appliedVoucher.code})</span>
              <span>- Rp {appliedVoucher.discount.toLocaleString("id-ID")}</span>
            </div>
          )}

          {selectedCustomer && totalVirtualPoints >= 10 && (
            <div className="flex items-center justify-between p-2 mt-2 bg-blue-50 rounded-md border border-blue-100 italic">
              <Label htmlFor="pts-switch" className="flex flex-col cursor-pointer">
                <span className="font-bold text-blue-700 text-xs text-sm">Tukar 10 Poin ✨ (-Rp 30rb)</span>
                <span className="text-[10px] text-blue-600">Virtual Poin: {totalVirtualPoints}</span>
              </Label>
              <Switch id="pts-switch" checked={usePoints} onCheckedChange={onUsePointsChange} />
            </div>
          )}
          
          {discountAmount > 0 && !appliedVoucher && (
             <div className="flex justify-between text-green-600 font-medium text-xs">
              <span>Diskon Poin</span>
              <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between items-center">
           <span className="font-medium">Total Akhir</span>
           <span className="text-2xl font-black text-primary">Rp {cartTotal.toLocaleString("id-ID")}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Metode Pembayaran</Label>
            <Select value={selectedMethodId?.toString() || ""} onValueChange={(v) => onSelectMethod(Number(v))}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Pilih..." />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="h-12 px-8 text-lg font-bold shadow-lg"
            onClick={onOpenPaymentModal}
            disabled={isSubmitting || cart.length === 0 || !selectedMethodId}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : "BAYAR"}
          </Button>
        </div>
      </div>
    </div>
  );
}
