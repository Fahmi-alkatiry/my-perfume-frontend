// frontend/src/components/pos/cart-view.tsx
"use client";

import {
  Minus,
  Plus,
  Trash2,
  DoorClosed,
  Loader2,
  X,
  Ticket, // <-- Ikon Voucher
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // <-- Input Voucher
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

// Interface (sesuai kebutuhan)
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
  discountPoints: number; // Ganti nama biar jelas
  cartTotal: number;
  isSubmitting: boolean;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemoveFromCart: (id: number) => void;
  onOpenPaymentModal: () => void;
  paymentMethods: PaymentMethod[];
  selectedMethodId: number | null;
  onSelectMethod: (id: number) => void;
  onOpenEndShiftModal: () => void;

  // --- Props Voucher ---
  voucherCode: string;
  onVoucherCodeChange: (val: string) => void;
  onCheckVoucher: () => void;
  onRemoveVoucher: () => void;
  appliedVoucher: { code: string; discount: number } | null;
  isCheckingVoucher: boolean;
}

export function CartView({
  cart,
  selectedCustomer,
  onSelectCustomer,
  usePoints,
  onUsePointsChange,
  subtotal,
  discountPoints,
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
}: CartViewProps) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <div className="p-2 border-b shrink-0 flex justify-between items-center bg-gray-50">
        <h2 className="text-2xl font-bold">Keranjang</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenEndShiftModal}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <DoorClosed className="h-2 w-4 mr-2" /> Shift
        </Button>
      </div>

      {/* Pelanggan */}
      <div className="p-2 border-b shrink-0">
        <div className="mb-0">
          <Label className="mb-2 block">Pelanggan</Label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between rounded-md border p-2 bg-white">
              <div className="space-y-1">
                <p className="font-medium">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">
                  Poin: {selectedCustomer.points}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSelectCustomer(null)}
              >
                <X className="h-2 w-4" />
              </Button>
            </div>
          ) : (
            <CustomerCombobox onSelectCustomer={onSelectCustomer} />
          )}
        </div>
      </div>

      {/* Tabel Item */}
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
                <TableCell
                  colSpan={4}
                  className="text-center h-24 text-muted-foreground"
                >
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
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    Rp{" "}
                    {(Number(item.sellingPrice) * item.quantity).toLocaleString(
                      "id-ID"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => onRemoveFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Footer & Pembayaran */}
      <div className="p-2 border-t shrink-0 bg-white space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>Rp {subtotal.toLocaleString("id-ID")}</span>
        </div>

        {/* --- INPUT VOUCHER --- */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Ticket className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kode Voucher"
              className="pl-8"
              value={voucherCode}
              onChange={(e) =>
                onVoucherCodeChange(e.target.value.toUpperCase())
              }
              disabled={!!appliedVoucher} // Disable jika sudah terpakai
            />
          </div>
          {appliedVoucher ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={onRemoveVoucher}
              title="Hapus Voucher"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={onCheckVoucher}
              disabled={isCheckingVoucher || !voucherCode}
            >
              {isCheckingVoucher ? <Loader2 className="animate-spin" /> : "Cek"}
            </Button>
          )}
        </div>
        {appliedVoucher && (
          <div className="flex justify-between text-green-600 font-medium text-sm bg-green-50 p-2 rounded border border-green-200">
            <span>Voucher ({appliedVoucher.code})</span>
            <span>- Rp {appliedVoucher.discount.toLocaleString("id-ID")}</span>
          </div>
        )}

        {/* Diskon Poin */}
        {selectedCustomer && selectedCustomer.points >= 10 && (
          <div className="flex items-center justify-between">
            <Label htmlFor="pts" className="flex flex-col">
              Tukar 10 Poin{" "}
              <span className="text-xs font-normal text-muted-foreground">
                Diskon Rp 30.000
              </span>
            </Label>
            <Switch
              id="pts"
              checked={usePoints}
              onCheckedChange={onUsePointsChange}
            />
          </div>
        )}
        {discountPoints > 0 && (
          <div className="flex justify-between text-green-600 font-medium text-sm">
            <span>Diskon Poin</span>
            <span>- Rp {discountPoints.toLocaleString("id-ID")}</span>
          </div>
        )}

        <Separator />

        {/* Total Akhir */}
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span>Rp {cartTotal.toLocaleString("id-ID")}</span>
        </div>

        {/* Metode Bayar & Tombol */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Metode Pembayaran
          </Label>
          <Select
            value={selectedMethodId?.toString() || ""}
            onValueChange={(v) => onSelectMethod(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih..." />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="lg"
          className="w-full text-lg"
          onClick={onOpenPaymentModal}
          disabled={isSubmitting || cart.length === 0 || !selectedMethodId}
        >
          Bayar
        </Button>
      </div>
    </div>
  );
}
