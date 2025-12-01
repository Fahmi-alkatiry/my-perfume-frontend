// frontend/src/app/(dashboard)/pos/page.tsx
"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Loader2, LogOut } from "lucide-react";

import { ProductListView } from "@/components/pos/product-list-view";
import { CartView } from "@/components/pos/cart-view";
import { PaymentModal } from "@/components/pos/payment-modal";

// --- Tipe Data ---
export interface Product {
  id: number;
  name: string;
  type: "PERFUME" | "BOTTLE";
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  productCode: string;
}
export interface CartItem extends Product {
  quantity: number;
}
export interface Customer {
  id: number;
  name: string;
  phoneNumber: string;
  points: number;
}
interface PaymentMethod {
  id: number;
  name: string;
}

const API_URL_PRODUCTS = "/products";
const API_URL_CUSTOMERS = "/customers"; // <-- API Customer
const API_URL_TRANSACTIONS = "/transactions";
const API_URL_AUTH_ME = "/auth/me";
const API_URL_PAYMENT_METHODS = "/payment-methods";
const API_URL_SHIFTS = "/shifts";
const API_URL_VOUCHER_CHECK = "/vouchers/check";

export default function PosPage() {
  const router = useRouter();

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // UI
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Transaksi
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [usePoints, setUsePoints] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);

  // Voucher
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    id: number;
    code: string;
    discount: number;
  } | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  // Modal Bayar
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cashPaid, setCashPaid] = useState("");

  // Shift
  const [isStartShiftOpen, setIsStartShiftOpen] = useState(false);
  const [isEndShiftOpen, setIsEndShiftOpen] = useState(false);
  const [startCashInput, setStartCashInput] = useState("");
  const [endCashInput, setEndCashInput] = useState("");
  const [isShiftLoading, setIsShiftLoading] = useState(false);

  // --- STATE BARU: PELANGGAN BARU ---
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  // ----------------------------------

  // Cart (LocalStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedCart = localStorage.getItem("myPerfumeCart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("myPerfumeCart", JSON.stringify(cart));
  }, [cart]);

  // Initial Fetch
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await axios.get(API_URL_PRODUCTS, {
        params: { limit: 1000 },
      });
      setProducts(response.data.data);
    } catch {
      toast.error("Gagal mengambil data produk");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const u = await axios.get(API_URL_AUTH_ME);
        setCurrentUser(u.data);
      } catch {}
      try {
        const p = await axios.get(API_URL_PAYMENT_METHODS);
        setPaymentMethods(p.data);
        if (p.data.length > 0) setSelectedMethodId(p.data[0].id);
      } catch {}
      try {
        const s = await axios.get(`${API_URL_SHIFTS}/current`);
        if (!s.data) setIsStartShiftOpen(true);
      } catch {}
    };
    initData();
    fetchProducts();
  }, []);

    const normalizePhone = (phone: string) => {
  let cleaned = phone.replace(/[^0-9]/g, ""); // hilangkan spasi/tanda + - .

  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }

  if (cleaned.startsWith("62")) {
    return cleaned;
  }

  return "62" + cleaned;
};

  // --- HANDLER PELANGGAN BARU (QUICK ADD) ---
  const handleAddNewCustomer = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone) return;

     const phoneRegex = /^(^\+?62|0)(\d{9,13})$/;

    const newCustomerPhoneNormalized = normalizePhone(newCustomerPhone);

     if (!phoneRegex.test(newCustomerPhoneNormalized)) {
    toast.error("Nomor HP tidak valid!");
    return;
  }

    setIsAddingCustomer(true);
    try {
      // 1. Simpan ke database
      const res = await axios.post(API_URL_CUSTOMERS, {
        name: newCustomerName,
        phoneNumber: newCustomerPhoneNormalized,
      });

      // 2. Langsung pilih pelanggan baru tersebut
      const newCustomer = res.data;
      setSelectedCustomer(newCustomer);
      toast.success(`Pelanggan ${newCustomer.name} ditambahkan.`);

      // 3. Reset form
      setNewCustomerName("");
      setNewCustomerPhone("");
      setIsAddCustomerOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menambah pelanggan");
    } finally {
      setIsAddingCustomer(false);
    }
  };
  // ------------------------------------------

  // Logic Cart & Produk
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm) return products;
    const lower = productSearchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.productCode.toLowerCase().includes(lower)
    );
  }, [products, productSearchTerm]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.id === product.id);
      if (exist && exist.quantity >= product.stock) {
        toast.error("Stok tidak cukup");
        return prev;
      }
      if (exist)
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((i) => i.id !== id);
      const prod = products.find((p) => p.id === id);
      if (prod && qty > prod.stock) {
        toast.error("Stok tidak cukup");
        return prev;
      }
      return prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
    });
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  // Logic Total
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (acc, item) => acc + Number(item.sellingPrice) * item.quantity,
        0
      ),
    [cart]
  );

  useEffect(() => {
    if (appliedVoucher) {
      setAppliedVoucher(null);
      setVoucherCode("");
      toast.info("Keranjang berubah, voucher direset.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  const totalAfterVoucher = subtotal - (appliedVoucher?.discount || 0);
  const safeTotalAfterVoucher = totalAfterVoucher > 0 ? totalAfterVoucher : 0;
  const discountPoints =
    usePoints && selectedCustomer && selectedCustomer.points >= 10 ? 30000 : 0;
  const cartTotal =
    safeTotalAfterVoucher - discountPoints > 0
      ? safeTotalAfterVoucher - discountPoints
      : 0;

  useEffect(() => {
    if (!selectedCustomer || selectedCustomer.points < 10) setUsePoints(false);
  }, [selectedCustomer]);

  // Handler Voucher
  const handleCheckVoucher = async () => {
    if (!voucherCode || cart.length === 0) return;
    setIsCheckingVoucher(true);
    try {
      const res = await axios.post(API_URL_VOUCHER_CHECK, {
        code: voucherCode,
        amount: subtotal,
      });
      if (res.data.valid) {
        setAppliedVoucher({
          id: res.data.voucherId,
          code: res.data.code,
          discount: res.data.discountAmount,
        });
        toast.success(
          `Hemat Rp ${res.data.discountAmount.toLocaleString("id-ID")}`
        );
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Voucher tidak valid");
      setAppliedVoucher(null);
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
  };

  // Handler Shift
  const handleStartShift = async (e: FormEvent) => {
    e.preventDefault();
    if (!startCashInput) return;
    setIsShiftLoading(true);
    try {
      await axios.post(`${API_URL_SHIFTS}/start`, {
        startCash: Number(startCashInput),
      });
      setIsStartShiftOpen(false);
      toast.success("Shift dimulai!");
    } catch {
      toast.error("Gagal buka shift");
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
      const diff = res.data.details.difference;
      const msg =
        diff < 0
          ? `KURANG Rp ${Math.abs(diff)}`
          : diff > 0
          ? `LEBIH Rp ${diff}`
          : "PAS";
      toast.success(`Shift Ditutup. Selisih: ${msg}`);
      router.push("/login");
    } catch {
      toast.error("Gagal tutup shift");
    } finally {
      setIsShiftLoading(false);
      setIsEndShiftOpen(false);
    }
  };

  // Checkout & WA
const openWhatsApp = (receiptData: { cashPaid: number; change: number }) => {
  if (!selectedCustomer?.phoneNumber) return;

  const pointsEarned = Math.floor(cartTotal / 30000);
  const pointsUsed = usePoints ? 10 : 0;
  const finalPoints = selectedCustomer.points - pointsUsed + pointsEarned;

  const itemsList = cart
    .map(
      (i, idx) =>
        `${idx + 1}. ${i.name} ${i.quantity}x Rp ${Number(i.sellingPrice).toLocaleString("id-ID")}`
    )
    .join("\n");

  // --- Nomor WhatsApp Normalize ---
  let phone = selectedCustomer.phoneNumber.trim();
  if (phone.startsWith("0")) phone = phone.replace(/^0/, "62");
  if (!phone.startsWith("62")) phone = "62" + phone;

  // Deteksi device
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const baseUrl = isMobile
    ? "https://api.whatsapp.com/send"
    : "https://web.whatsapp.com/send";

  const msg = `*My Perfume*\nTotal: Rp ${cartTotal.toLocaleString(
    "id-ID"
  )}\nTunai: Rp ${receiptData.cashPaid.toLocaleString(
    "id-ID"
  )}\nKembalian: Rp ${receiptData.change.toLocaleString(
    "id-ID"
  )}\n\n${itemsList}\n\nSisa Poin: ${finalPoints}\nTerima kasih!`;

  window.open(`${baseUrl}?phone=${phone}&text=${encodeURIComponent(msg)}`, "_blank");
};

  const handleCheckout = async (cashPaid: number, change: number) => {
    setIsSubmitting(true);
    try {
      await axios.post(API_URL_TRANSACTIONS, {
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
        customerId: selectedCustomer?.id || null,
        usePoints,
        userId: currentUser?.id,
        paymentMethodId: selectedMethodId,
        voucherId: appliedVoucher?.id || null,
      });

      toast.success("Transaksi Berhasil");
      openWhatsApp({ cashPaid, change });

      setCart([]);
      localStorage.removeItem("myPerfumeCart");
      setSelectedCustomer(null);
      setUsePoints(false);
      setAppliedVoucher(null);
      setVoucherCode("");
      setIsSheetOpen(false);
      setIsPaymentModalOpen(false);
      setCashPaid("");
      fetchProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Gagal Transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full">
      {/* DESKTOP */}
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
              discountAmount={discountPoints + (appliedVoucher?.discount || 0)}
              cartTotal={cartTotal}
              isSubmitting={isSubmitting}
              onUpdateQuantity={updateQuantity}
              onRemoveFromCart={removeFromCart}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
              paymentMethods={paymentMethods}
              selectedMethodId={selectedMethodId}
              onSelectMethod={setSelectedMethodId}
              onOpenEndShiftModal={() => setIsEndShiftOpen(true)}
              // Props Voucher
              voucherCode={voucherCode}
              onVoucherCodeChange={setVoucherCode}
              onCheckVoucher={handleCheckVoucher}
              onRemoveVoucher={handleRemoveVoucher}
              appliedVoucher={appliedVoucher}
              isCheckingVoucher={isCheckingVoucher}
              // --- PROP BARU: Buka Modal Pelanggan ---
              onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* MOBILE */}
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
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
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
              discountAmount={discountPoints + (appliedVoucher?.discount || 0)}
              cartTotal={cartTotal}
              isSubmitting={isSubmitting}
              onUpdateQuantity={updateQuantity}
              onRemoveFromCart={removeFromCart}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
              paymentMethods={paymentMethods}
              selectedMethodId={selectedMethodId}
              onSelectMethod={setSelectedMethodId}
              onOpenEndShiftModal={() => setIsEndShiftOpen(true)}
              // Props Voucher
              voucherCode={voucherCode}
              onVoucherCodeChange={setVoucherCode}
              onCheckVoucher={handleCheckVoucher}
              onRemoveVoucher={handleRemoveVoucher}
              appliedVoucher={appliedVoucher}
              isCheckingVoucher={isCheckingVoucher}
              // --- PROP BARU ---
              onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* MODAL-MODAL */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        totalAmount={cartTotal}
        cashPaid={cashPaid}
        onCashPaidChange={setCashPaid}
        onSubmit={handleCheckout}
        isSubmitting={isSubmitting}
      />

      {/* --- MODAL TAMBAH PELANGGAN (BARU) --- */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pelanggan Baru</DialogTitle>
            <DialogDescription>Daftarkan pelanggan cepat.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddNewCustomer}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>No HP</Label>
                <Input
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  required
                  placeholder="08..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isAddingCustomer}>
                {isAddingCustomer ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : null}{" "}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* ------------------------------------- */}

      {/* Modal Shift */}
      <Dialog open={isStartShiftOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[400px]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Buka Shift</DialogTitle>
            <DialogDescription>Modal Awal</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStartShift}>
            <Input
              type="number"
              className="mb-4"
              value={startCashInput}
              onChange={(e) => setStartCashInput(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" disabled={isShiftLoading}>
              {isShiftLoading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : null}{" "}
              Buka
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isEndShiftOpen} onOpenChange={setIsEndShiftOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Tutup Shift</DialogTitle>
            <DialogDescription>Uang Fisik</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEndShift}>
            <Input
              type="number"
              className="mb-4"
              value={endCashInput}
              onChange={(e) => setEndCashInput(e.target.value)}
              required
              autoFocus
            />
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
              Tutup
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
