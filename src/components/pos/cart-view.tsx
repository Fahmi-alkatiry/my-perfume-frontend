"use client";

import {
  Minus,
  Plus,
  Trash2,
  DoorClosed,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerCombobox, Customer } from "./customer-combobox";

// Definisi Interface yang dibutuhkan
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
}: CartViewProps) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header dengan Tombol Tutup Shift */}
      <div className="p-2 border-b shrink-0 flex justify-between items-center bg-gray-50">
        <h2 className="text-2xl font-bold">Keranjang</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenEndShiftModal}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <DoorClosed className="h-4 w-4 mr-2" /> Tutup Shift
        </Button>
      </div>

      <div className="p-2 border-b shrink-0">
        <div className="mb-2">
          <Label className="mb-2 block">Pelanggan</Label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between rounded-md border p-3 bg-white">
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
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <CustomerCombobox onSelectCustomer={onSelectCustomer} />
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-4">
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
                    {item.name} <br />
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
                    {(
                      Number(item.sellingPrice) * item.quantity
                    ).toLocaleString("id-ID")}
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

      <div className="p-4 border-t shrink-0 bg-white space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>Rp {subtotal.toLocaleString("id-ID")}</span>
        </div>
        {selectedCustomer && selectedCustomer.points >= 10 && (
          <div className="flex items-center justify-between">
            <Label htmlFor="pts" className="flex flex-col">
              Gunakan Poin{" "}
              <span className="text-xs font-normal">Diskon Rp 30.000</span>
            </Label>
            <Switch
              id="pts"
              checked={usePoints}
              onCheckedChange={onUsePointsChange}
            />
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between text-red-600 font-medium">
            <span>Diskon Poin</span>
            <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
          </div>
        )}
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span>Rp {cartTotal.toLocaleString("id-ID")}</span>
        </div>

        <div className="space-y-1">
          <Label>Metode Pembayaran</Label>
          <Select
            value={selectedMethodId?.toString() || ""}
            onValueChange={(v) => onSelectMethod(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih..." />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.length === 0 ? (
                <SelectItem value="l" disabled>
                  Loading...
                </SelectItem>
              ) : (
                paymentMethods.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="lg"
          className="w-full text-lg"
          onClick={onOpenPaymentModal}
          disabled={isSubmitting || cart.length === 0 || !selectedMethodId}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin mr-2" />
          ) : null}
          Bayar
        </Button>
      </div>
    </div>
  );
}