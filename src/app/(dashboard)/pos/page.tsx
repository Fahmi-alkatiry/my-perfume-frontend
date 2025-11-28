// frontend/src/app/(dashboard)/pos/page.tsx
"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import axios from "@/lib/axios"; // Menggunakan instance axios yang sudah dikonfigurasi
import { toast } from "sonner";
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
// --- Impor untuk Modal Pembayaran ---
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// ---------------------------------
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
const API_URL_PRODUCTS = "/products";
const API_URL_CUSTOMERS = "/customers";
const API_URL_TRANSACTIONS = "/transactions";
const API_URL_AUTH_ME = "/auth/me";
const API_URL_PAYMENT_METHODS = "/payment-methods";

// ====================================================================
// ================= Halaman Utama POS (Induk) ========================
// ====================================================================
export default function PosPage() {
  // --- State Utama ---
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // State untuk User
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [usePoints, setUsePoints] = useState(false);
  
  // State untuk Metode Pembayaran
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  
  // --- State untuk Modal Pembayaran ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cashPaid, setCashPaid] = useState("");
  
 const [cart, setCart] = useState<CartItem[]>(() => {
    // Pastikan kode ini hanya berjalan di browser (bukan server)
    if (typeof window === "undefined") {
      return [];
    }
    
    try {
      const savedCart = localStorage.getItem("myPerfumeCart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Gagal memuat keranjang:", error);
      return [];
    }
  });
  // --- LOGIKA FETCH DATA ---
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await axios.get(API_URL_PRODUCTS, {
        params: { limit: 1000 },
      });
      setProducts(response.data.data);
    } catch (error) {
      toast.error("Error", { description: "Gagal mengambil data produk." });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(API_URL_AUTH_ME);
        setCurrentUser(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data kasir");
      }
    };

    const fetchPaymentMethods = async () => {
      try {
        const res = await axios.get(API_URL_PAYMENT_METHODS);
        setPaymentMethods(res.data);
        if (res.data.length > 0) {
          setSelectedMethodId(res.data[0].id); // Otomatis pilih metode pertama
        }
      } catch (error) {
        toast.error("Gagal memuat metode pembayaran");
      }
    };

    fetchProducts();
    fetchCurrentUser();
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("myPerfumeCart", JSON.stringify(cart));
    }
  }, [cart]);

  // --- LOGIKA FILTER PRODUK (LOKAL) ---
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        p.productCode.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [products, productSearchTerm]);

  // --- LOGIKA KERANJANG (CART) ---
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      const freshProduct = products.find((p) => p.id === product.id);
      const currentStock = freshProduct ? freshProduct.stock : 0;
      const cartQuantity = existingItem ? existingItem.quantity : 0;

      if (cartQuantity >= currentStock) {
        toast.error("Stok Tidak Cukup", {
          description: `Stok ${product.name} hanya tersisa ${currentStock}.`,
        });
        return prevCart;
      }
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, stock: currentStock, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== productId);
      }
      const itemToUpdate = prevCart.find((item) => item.id === productId);
      const freshProduct = products.find((p) => p.id === productId);
      const currentStock = freshProduct ? freshProduct.stock : 0;

      if (itemToUpdate && newQuantity > currentStock) {
        toast.error("Stok Tidak Cukup", {
          description: `Stok ${itemToUpdate.name} hanya tersisa ${currentStock}.`,
        });
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

  // --- LOGIKA PERHITUNGAN TOTAL ---
  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + Number(item.sellingPrice) * item.quantity,
      0
    );
  }, [cart]);

  const discountAmount = useMemo(() => {
    return usePoints && selectedCustomer && selectedCustomer.points >= 10
      ? 30000
      : 0;
  }, [usePoints, selectedCustomer]);

  const cartTotal = useMemo(() => {
    return subtotal - discountAmount;
  }, [subtotal, discountAmount]);

  useEffect(() => {
    if (!selectedCustomer || selectedCustomer.points < 10) {
      setUsePoints(false);
    }
  }, [selectedCustomer]);

  // --- FUNGSI Buka WhatsApp ---
  const openWhatsApp = (receiptData: { cashPaid: number; change: number }) => {
    if (!selectedCustomer || !selectedCustomer.phoneNumber) {
      toast.info("Tidak bisa kirim WhatsApp", {
        description: "Pelanggan tidak dipilih atau tidak punya nomor HP.",
      });
      return;
    }

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
      .map((item, index) => {
        return `${index + 1}. ${item.name} ${item.quantity}x Rp ${Number(
          item.sellingPrice
        ).toLocaleString("id-ID")}`;
      })
      .join("\n");
      
    let phone = selectedCustomer.phoneNumber.trim();
    if (phone.startsWith("0")) {
      phone = "62" + phone.substring(1);
    }
    
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
Terima kasih atas pesanan Anda
    `;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
  };
  
  // --- LOGIKA TRANSAKSI (CHECKOUT) ---
  const handleCheckout = async (cashPaid: number, change: number) => {
    if (cart.length === 0) {
      toast.warning("Keranjang kosong");
      return;
    }
    if (!selectedMethodId) {
      toast.error("Metode pembayaran belum dipilih");
      return;
    }

    setIsSubmitting(true);

    const transactionData = {
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      customerId: selectedCustomer?.id || null,
      usePoints: usePoints,
      userId: currentUser?.id || null,
      paymentMethodId: selectedMethodId,
    };

    try {
      await axios.post(API_URL_TRANSACTIONS, transactionData);

      toast.success("Transaksi Berhasil", {
        description: `Total: Rp ${cartTotal.toLocaleString(
          "id-ID"
        )}. Stok telah diperbarui.`,
      });

      openWhatsApp({ cashPaid, change });

      // Reset state
     setCart([]);
      localStorage.removeItem("myPerfumeCart"); // <-- TAMBAHKAN BARIS INI
      setSelectedCustomer(null);
      setSelectedCustomer(null);
      setUsePoints(false);
      setIsSheetOpen(false);
      setIsPaymentModalOpen(false);
      setCashPaid("");
      if (paymentMethods.length > 0) {
        setSelectedMethodId(paymentMethods[0].id);
      }
      
      fetchProducts();
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Terjadi kesalahan";
      toast.error("Transaksi Gagal", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER UTAMA ---
  return (
    <div className="h-full w-full">
      {/* 1. TAMPILAN DESKTOP (md:block) */}
      <div className="hidden h-full md:block">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          
          {/* Panel Kiri: Daftar Produk */}
          {/* --- PERBAIKAN SCROLL: Tambahkan className --- */}
          <ResizablePanel defaultSize={60} minSize={40} className="flex flex-col h-full min-h-0">
            <ProductListView
              products={filteredProducts}
              isLoading={isLoadingProducts}
              searchTerm={productSearchTerm}
              onSearchChange={setProductSearchTerm}
              onAddToCart={addToCart}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Panel Kanan: Keranjang */}
          {/* --- PERBAIKAN SCROLL: Tambahkan className --- */}
          <ResizablePanel defaultSize={40} minSize={30} className="flex flex-col h-full min-h-0">
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
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* 2. TAMPILAN MOBILE (md:hidden) */}
      <div className="h-full md:hidden flex flex-col">
        {/* Daftar produk full screen */}
        <ProductListView
          products={filteredProducts}
          isLoading={isLoadingProducts}
          searchTerm={productSearchTerm}
          onSearchChange={setProductSearchTerm}
          onAddToCart={addToCart}
        />

        {/* Tombol Keranjang Mengambang */}
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
          {/* --- PERBAIKAN SCROLL: Tambahkan className --- */}
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
            />
          </SheetContent>
        </Sheet>
      </div>
      
      {/* 3. MODAL PEMBAYARAN & WHATSAPP */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        totalAmount={cartTotal}
        cashPaid={cashPaid}
        onCashPaidChange={setCashPaid}
        onSubmit={handleCheckout}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// ====================================================================
// ============ Komponen UI: Daftar Produk (ProductListView) ==========
// ====================================================================
function ProductListView({
  products,
  isLoading,
  searchTerm,
  onSearchChange,
  onAddToCart,
}: {
  products: Product[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddToCart: (product: Product) => void;
}) {
  return (
    // --- PERBAIKAN SCROLL: Ganti h-full -> flex-1, Pindah padding ---
    <div className="flex flex-1 flex-col min-h-0">
      <h2 className="text-2xl font-bold mb-4 px-4 pt-4">Daftar Produk</h2>
      
      <div className="relative mb-4 px-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Cari produk (nama atau kode)..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <ScrollArea className="flex-1 min-h-0 px-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {products.map((product) => (
              <Card
                key={product.id}
                onClick={() => onAddToCart(product)}
                className={`cursor-pointer hover:border-primary ${
                  product.stock === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-base line-clamp-2">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-bold text-sm">
                    Rp {Number(product.sellingPrice).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stok: {product.stock}
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

// ====================================================================
// ================= Komponen UI: Keranjang (CartView) ================
// ====================================================================
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
}: {
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
}) {
  return (
    // --- PERBAIKAN SCROLL: Ganti h-full -> flex-1 ---
    <div className="flex flex-1 flex-col min-h-0">
      {/* Bagian Atas (Pelanggan & Item) */}
      <div className="p-4 border-b shrink-0">
        <h2 className="text-2xl font-bold mb-4">Keranjang</h2>
        <div className="mb-4">
          <Label className="mb-2 block">Pelanggan</Label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <p className="font-medium">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">
                  Poin: {selectedCustomer.points}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onSelectCustomer(null)}>
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
                <TableCell colSpan={4} className="text-center h-24">
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
      
      {/* Bagian Bawah (Total & Bayar) */}
      <div className="p-4 border-t shrink-0 bg-white">
        <div className="space-y-4">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Subtotal</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          
          {selectedCustomer && selectedCustomer.points >= 10 && (
            <div className="flex items-center justify-between">
              <Label htmlFor="use-points-switch" className="flex flex-col">
                Gunakan Poin
                <span className="text-xs text-muted-foreground">
                  Diskon Rp 30.000 (10 Poin)
                </span>
              </Label>
              <Switch
                id="use-points-switch"
                checked={usePoints}
                onCheckedChange={onUsePointsChange}
              />
            </div>
          )}
          
          {discountAmount > 0 && (
            <div className="flex justify-between text-destructive">
              <span className="font-medium">Diskon Poin</span>
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
              onValueChange={(value) => onSelectMethod(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih metode pembayaran..." />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.length === 0 ? (
                  <SelectItem value="loading" disabled>Memuat...</SelectItem>
                ) : (
                  paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name}
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
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : null}
            Bayar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// ============= KOMPONEN BARU: Modal Pembayaran ======================
// ====================================================================
function PaymentModal({
  isOpen,
  onOpenChange,
  totalAmount,
  cashPaid,
  onCashPaidChange,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  cashPaid: string;
  onCashPaidChange: (value: string) => void;
  onSubmit: (cashPaid: number, change: number) => void;
  isSubmitting: boolean;
}) {
  
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
              Konfirmasi & Kirim Struk WA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ====================================================================
// ============= Komponen UI: Combobox Pelanggan ======================
// ====================================================================
function CustomerCombobox({
  onSelectCustomer,
}: {
  onSelectCustomer: (customer: Customer) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(API_URL_CUSTOMERS, {
          params: { search: search, limit: 10 },
        });
        setCustomers(response.data.data);
      } catch (error) {
        console.error("Gagal mencari pelanggan:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <User className="mr-2 h-4 w-4" />
          Pilih Pelanggan...
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Cari nama atau nomor HP..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="p-4 text-center text-sm">Mencari...</div>
            )}
            <CommandEmpty>
              {isLoading ? "Mencari..." : "Pelanggan tidak ditemukan."}
            </CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.name} - ${customer.phoneNumber}`}
                  onSelect={() => {
                    onSelectCustomer(customer);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={"mr-2 h-4 w-4 opacity-0"}
                  />
                  <div>
                    <p>{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.phoneNumber} (Poin: {customer.points})
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}