// frontend/src/app/(dashboard)/pos/page.tsx

"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // <-- Penting untuk redirect logout
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Minus,
  Trash2,
  Search,
  Check,
  ChevronsUpDown,
  User,
  X,
  ShoppingCart,
  DoorClosed, // <-- Ikon Tutup Shift
  LogOut,
} from "lucide-react";

// --- Tipe Data ---
interface Product {
  id: number;
  name: string;
  type: "PERFUME" | "BOTTLE";
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  productCode: string;
}
interface CartItem extends Product {
  quantity: number;
}
interface Customer {
  id: number;
  name: string;
  phoneNumber: string;
  points: number;
}
interface LoggedInUser {
  id: number;
  name: string;
  role: string;
}
interface PaymentMethod {
  id: number;
  name: string;
}

// --- Konstanta API ---
const API_URL_PRODUCTS = "/api/products";
const API_URL_CUSTOMERS = "/api/customers";
const API_URL_TRANSACTIONS = "/api/transactions";
const API_URL_AUTH_ME = "/api/auth/me";
const API_URL_PAYMENT_METHODS = "/api/payment-methods";
const API_URL_SHIFTS = "/api/shifts"; // <-- API Shift

// ====================================================================
// ================= Halaman Utama POS (Induk) ========================
// ====================================================================
export default function PosPage() {
  const router = useRouter();

  // --- State Utama ---
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // State User & Pelanggan
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [usePoints, setUsePoints] = useState(false);

  // State Metode Pembayaran
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);

  // State Modal Pembayaran (Transaksi)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cashPaid, setCashPaid] = useState("");

  // --- STATE SHIFT (MANAJEMEN KASIR) ---
  const [isStartShiftOpen, setIsStartShiftOpen] = useState(false);
  const [isEndShiftOpen, setIsEndShiftOpen] = useState(false);
  const [startCashInput, setStartCashInput] = useState("");
  const [endCashInput, setEndCashInput] = useState("");
  const [isShiftLoading, setIsShiftLoading] = useState(false);
  // -------------------------------------

  // --- INITIAL FETCH ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. User
      try {
        const userRes = await axios.get(API_URL_AUTH_ME);
        setCurrentUser(userRes.data);
      } catch {
        /* Silent */
      }

      // 2. Payment Methods
      try {
        const methodsRes = await axios.get(API_URL_PAYMENT_METHODS);
        setPaymentMethods(methodsRes.data);
        if (methodsRes.data.length > 0)
          setSelectedMethodId(methodsRes.data[0].id);
      } catch {
        /* Silent */
      }

      // 3. Products
      setIsLoadingProducts(true);
      try {
        const prodRes = await axios.get(API_URL_PRODUCTS, {
          params: { limit: 1000 },
        });
        setProducts(prodRes.data.data);
      } catch {
        toast.error("Gagal data produk");
      } finally {
        setIsLoadingProducts(false);
      }

      // 4. CEK SHIFT (PENTING)
      try {
        const shiftRes = await axios.get(`${API_URL_SHIFTS}/current`);
        if (!shiftRes.data) {
          // Jika tidak ada shift aktif, paksa buka modal
          setIsStartShiftOpen(true);
        }
      } catch (error) {
        console.error("Gagal cek shift");
      }
    };

    fetchData();
  }, []);

  // --- HANDLER SHIFT ---
  const handleStartShift = async (e: FormEvent) => {
    e.preventDefault();
    if (!startCashInput) return;

    setIsShiftLoading(true);
    try {
      await axios.post(`${API_URL_SHIFTS}/start`, {
        startCash: Number(startCashInput),
      });
      setIsStartShiftOpen(false);
      toast.success("Shift dimulai. Selamat bekerja!");
    } catch (error) {
      toast.error("Gagal memulai shift");
    } finally {
      setIsShiftLoading(false);
    }
  };

  const handleEndShift = async (e: FormEvent) => {
    e.preventDefault();
    if (!endCashInput) return;

    setIsShiftLoading(true);
    try {
      const res = await axios.post(`${API_URL_SHIFTS}/end`, {
        endCash: Number(endCashInput),
      });
      const { difference } = res.data.details;

      let msg = "Shift ditutup.";
      if (difference < 0)
        msg += ` Selisih KURANG: Rp ${Math.abs(difference).toLocaleString(
          "id-ID"
        )}`;
      else if (difference > 0)
        msg += ` Selisih LEBIH: Rp ${difference.toLocaleString("id-ID")}`;
      else msg += " Saldo Pas.";

      toast.success(msg);
      router.push("/login"); // Logout otomatis
    } catch (error) {
      toast.error("Gagal menutup shift");
    } finally {
      setIsShiftLoading(false);
      setIsEndShiftOpen(false);
    }
  };

  // --- LOGIKA FILTER PRODUK ---
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        p.productCode.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [products, productSearchTerm]);

  // --- LOGIKA KERANJANG ---
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      const freshProduct = products.find((p) => p.id === product.id);
      const currentStock = freshProduct ? freshProduct.stock : 0;
      const cartQuantity = existingItem ? existingItem.quantity : 0;

      if (cartQuantity >= currentStock) {
        toast.error("Stok Tidak Cukup", {
          description: `Sisa: ${currentStock}`,
        });
        return prevCart;
      }
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, stock: currentStock, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    setCart((prevCart) => {
      if (newQuantity <= 0)
        return prevCart.filter((item) => item.id !== productId);
      const freshProduct = products.find((p) => p.id === productId);
      const currentStock = freshProduct ? freshProduct.stock : 0;
      if (newQuantity > currentStock) {
        toast.error("Stok Tidak Cukup");
        return prevCart;
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // --- LOGIKA TOTAL ---
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + Number(item.sellingPrice) * item.quantity,
        0
      ),
    [cart]
  );
  const discountAmount = useMemo(
    () =>
      usePoints && selectedCustomer && selectedCustomer.points >= 10
        ? 30000
        : 0,
    [usePoints, selectedCustomer]
  );
  const cartTotal = useMemo(
    () => subtotal - discountAmount,
    [subtotal, discountAmount]
  );

  useEffect(() => {
    if (!selectedCustomer || selectedCustomer.points < 10) setUsePoints(false);
  }, [selectedCustomer]);

  // --- LOGIKA WHATSAPP & CHECKOUT ---
  const openWhatsApp = (receiptData: { cashPaid: number; change: number }) => {
    if (!selectedCustomer || !selectedCustomer.phoneNumber) return;

    const pointsEarned = Math.floor(cartTotal / 30000);
    const pointsUsed = usePoints ? 10 : 0;
    const finalPoints = selectedCustomer.points - pointsUsed + pointsEarned;

    const now = new Date();
    const dateStr = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const orderDetails = cart
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} ${item.quantity}x Rp ${Number(
            item.sellingPrice
          ).toLocaleString("id-ID")}`
      )
      .join("\n");
    let phone = selectedCustomer.phoneNumber.trim();
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);

    const message = `
*My Perfume*
Jl. Raya panglegur
Kota Pamekasan
Tanggal : ${dateStr} pukul ${timeStr}
Nama    : ${selectedCustomer.name}
Poin    : ${finalPoints}

*Detail Pesanan:*
${orderDetails}

*Total:* Rp ${cartTotal.toLocaleString("id-ID")}
*Tunai:* Rp ${receiptData.cashPaid.toLocaleString("id-ID")}
*Kembalian:* Rp ${receiptData.change.toLocaleString("id-ID")}

Follow @Myperfumeee_
Terima kasih atas pesanan Anda`;

    window.open(
      `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };

  const handleCheckout = async (cashPaid: number, change: number) => {
    if (cart.length === 0 || !selectedMethodId) return;
    setIsSubmitting(true);

    try {
      await axios.post(API_URL_TRANSACTIONS, {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        customerId: selectedCustomer?.id || null,
        usePoints: usePoints,
        userId: currentUser?.id || null,
        paymentMethodId: selectedMethodId,
      });

      toast.success("Transaksi Berhasil");
      openWhatsApp({ cashPaid, change });

      setCart([]);
      setSelectedCustomer(null);
      setUsePoints(false);
      setIsSheetOpen(false);
      setIsPaymentModalOpen(false);
      setCashPaid("");
      if (paymentMethods.length > 0) setSelectedMethodId(paymentMethods[0].id);

      // Refresh produk untuk update stok
      const prodRes = await axios.get(API_URL_PRODUCTS, {
        params: { limit: 1000 },
      });
      setProducts(prodRes.data.data);
    } catch (error: any) {
      toast.error("Transaksi Gagal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER UTAMA ---
  return (
    <div className="h-full w-full">
      {/* 1. DESKTOP */}
      <div className="hidden h-full md:block">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel
            defaultSize={60}
            minSize={40}
            className="flex flex-col h-full min-h-0"
          >
            <ProductListView
              products={filteredProducts}
              isLoading={isLoadingProducts}
              searchTerm={productSearchTerm}
              onSearchChange={setProductSearchTerm}
              onAddToCart={addToCart}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={40}
            minSize={30}
            className="flex flex-col h-full min-h-0"
          >
            <CartView
              cart={cart}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              usePoints={usePoints}
              onUsePointsChange={setUsePoints}
              subtotal={subtotal}
              discountAmount={discountAmount}
              cartTotal={cartTotal}
              isSubmitting={isSubmitting}
              onUpdateQuantity={updateQuantity}
              onRemoveFromCart={removeFromCart}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
              paymentMethods={paymentMethods}
              selectedMethodId={selectedMethodId}
              onSelectMethod={setSelectedMethodId}
              onOpenEndShiftModal={() => setIsEndShiftOpen(true)} // <-- PROP PENTING
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* 2. MOBILE */}
      <div className="h-full md:hidden flex flex-col">
        <ProductListView
          products={filteredProducts}
          isLoading={isLoadingProducts}
          searchTerm={productSearchTerm}
          onSearchChange={setProductSearchTerm}
          onAddToCart={addToCart}
        />
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-lg p-0">
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                  {cart.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col p-0 h-full min-h-0">
            <CartView
              cart={cart}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              usePoints={usePoints}
              onUsePointsChange={setUsePoints}
              subtotal={subtotal}
              discountAmount={discountAmount}
              cartTotal={cartTotal}
              isSubmitting={isSubmitting}
              onUpdateQuantity={updateQuantity}
              onRemoveFromCart={removeFromCart}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
              paymentMethods={paymentMethods}
              selectedMethodId={selectedMethodId}
              onSelectMethod={setSelectedMethodId}
              onOpenEndShiftModal={() => setIsEndShiftOpen(true)} // <-- PROP PENTING
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* 3. MODAL PEMBAYARAN */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        totalAmount={cartTotal}
        cashPaid={cashPaid}
        onCashPaidChange={setCashPaid}
        onSubmit={handleCheckout}
        isSubmitting={isSubmitting}
      />

      {/* 4. MODAL START SHIFT (FORCE OPEN) */}
      <Dialog open={isStartShiftOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[425px]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Buka Shift Kasir</DialogTitle>
            <DialogDescription>
              Masukkan modal awal di laci kasir.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStartShift}>
            <div className="py-4">
              <Label>Modal Awal (Rp)</Label>
              <Input
                type="number"
                value={startCashInput}
                onChange={(e) => setStartCashInput(e.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isShiftLoading}>
                {isShiftLoading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : null}{" "}
                Mulai Shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. MODAL END SHIFT */}
      <Dialog open={isEndShiftOpen} onOpenChange={setIsEndShiftOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tutup Shift & Logout</DialogTitle>
            <DialogDescription>Masukkan uang fisik di laci.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEndShift}>
            <div className="py-4">
              <Label>Uang Fisik Akhir (Rp)</Label>
              <Input
                type="number"
                value={endCashInput}
                onChange={(e) => setEndCashInput(e.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsEndShiftOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isShiftLoading}
              >
                {isShiftLoading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}{" "}
                Tutup Shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- PRODUCT LIST VIEW ---
function ProductListView({
  products,
  isLoading,
  searchTerm,
  onSearchChange,
  onAddToCart,
}: any) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="p-4 pb-0">
        <h2 className="text-2xl font-bold mb-4">Daftar Produk</h2>
      </div>
      <div className="px-4 mb-4 relative">
        <Search className="absolute left-7 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1 min-h-0 px-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {products.map((p: any) => (
              <Card
                key={p.id}
                onClick={() => onAddToCart(p)}
                className={`cursor-pointer hover:border-primary ${
                  p.stock === 0 ? "opacity-50" : ""
                }`}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-sm line-clamp-2">
                    {p.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="font-bold">
                    Rp {Number(p.sellingPrice).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stok: {p.stock}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// --- CART VIEW (TERMASUK TOMBOL TUTUP SHIFT) ---
function CartView({
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
  onOpenEndShiftModal, // <-- Prop Baru
}: any) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header dengan Tombol Tutup Shift */}
      <div className="p-4 border-b shrink-0 flex justify-between items-center bg-gray-50">
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

      <div className="p-4 border-b shrink-0">
        <div className="mb-4">
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
              cart.map((item: any) => (
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

      <div className="p-4 border-t shrink-0 bg-white space-y-4">
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

        <div className="space-y-2">
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
                paymentMethods.map((m: any) => (
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
          {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}{" "}
          Bayar
        </Button>
      </div>
    </div>
  );
}

// --- PaymentModal & CustomerCombobox (Disingkat agar muat, pastikan ada di file Anda) ---
function PaymentModal({
  isOpen,
  onOpenChange,
  totalAmount,
  cashPaid,
  onCashPaidChange,
  onSubmit,
  isSubmitting,
}: any) {
  const cash = Number(cashPaid) || 0;
  const change = cash > totalAmount ? cash - totalAmount : 0;
  const insufficient = cash < totalAmount;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Pembayaran</DialogTitle>
          <DialogDescription>
            Total: Rp {totalAmount.toLocaleString("id-ID")}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!insufficient) onSubmit(cash, change);
          }}
        >
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Uang Diterima</Label>
              <Input
                type="number"
                autoFocus
                value={cashPaid}
                onChange={(e) => onCashPaidChange(e.target.value)}
              />
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Kembalian</span>
              <span className="text-blue-600">
                Rp {change.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || insufficient}
            >
              Konfirmasi & Kirim WA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CustomerCombobox({ onSelectCustomer }: any) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(API_URL_CUSTOMERS, {
          params: { search, limit: 5 },
        });
        setCustomers(res.data.data);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          <User className="mr-2 h-4 w-4" /> Pilih Pelanggan{" "}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Cari..." onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {customers.map((c) => (
                <CommandItem
                  key={c.id}
                  onSelect={() => {
                    onSelectCustomer(c);
                    setOpen(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  {c.name} ({c.phoneNumber})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
