// frontend/src/app/pos/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner"; // Untuk notifikasi
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch"; // Untuk toggle poin
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Untuk Combobox
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"; // Untuk Combobox
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"; // Untuk UI Mobile
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
  ShoppingCart, // Ikon keranjang mobile
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

// --- Konstanta API ---
const API_URL_PRODUCTS = "http://localhost:5000/api/products";
const API_URL_CUSTOMERS = "http://localhost:5000/api/customers";
const API_URL_TRANSACTIONS = "http://localhost:5000/api/transactions";

// ====================================================================
// ================= Halaman Utama POS (Induk) ========================
// ====================================================================
export default function PosPage() {
  // --- State Utama ---
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [usePoints, setUsePoints] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State untuk sheet mobile

  // --- LOGIKA FETCH PRODUK ---
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await axios.get(API_URL_PRODUCTS, {
        params: { limit: 1000 }, // Ambil semua produk
      });
      setProducts(response.data.data);
    } catch (error) {
      toast.error("Error", { description: "Gagal mengambil data produk." });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      
      // Ambil stok terbaru dari state 'products'
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
        // Update quantity
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Tambah item baru
        return [...prevCart, { ...product, stock: currentStock, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    setCart((prevCart) => {
      // Hapus jika kuantitas <= 0
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== productId);
      }

      const itemToUpdate = prevCart.find((item) => item.id === productId);
      // Cek stok terbaru
      const freshProduct = products.find((p) => p.id === productId);
      const currentStock = freshProduct ? freshProduct.stock : 0;

      if (itemToUpdate && newQuantity > currentStock) {
        toast.error("Stok Tidak Cukup", {
          description: `Stok ${itemToUpdate.name} hanya tersisa ${currentStock}.`,
        });
        return prevCart; // Kembalikan keranjang tanpa perubahan
      }

      // Update kuantitas
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

  // Efek untuk mematikan 'usePoints'
  useEffect(() => {
    if (!selectedCustomer || selectedCustomer.points < 10) {
      setUsePoints(false);
    }
  }, [selectedCustomer]);

  // --- LOGIKA TRANSAKSI (CHECKOUT) ---
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.warning("Keranjang kosong");
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
      // Nanti bisa ditambahkan:
      // userId: 1, (jika sudah ada login)
      // paymentMethodId: 1 (jika ada pilihan metode bayar)
    };

    try {
      await axios.post(API_URL_TRANSACTIONS, transactionData);

      toast.success("Transaksi Berhasil", {
        description: `Total: Rp ${cartTotal.toLocaleString(
          "id-ID"
        )}. Stok telah diperbarui.`,
      });

      // Reset state
      setCart([]);
      setSelectedCustomer(null);
      setUsePoints(false);
      setIsSheetOpen(false); // Tutup sheet mobile
      
      // Refresh stok produk di UI
      fetchProducts();
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Terjadi kesalahan";
      toast.error("Transaksi Gagal", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER UTAMA ---
  return (
    <div className="h-screen w-screen">
      {/* 1. TAMPILAN DESKTOP (md:block) */}
      <div className="hidden h-full md:block">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Panel Kiri: Daftar Produk */}
          <ResizablePanel defaultSize={60} minSize={40}>
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
          <ResizablePanel defaultSize={40} minSize={30}>
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
              onCheckout={handleCheckout}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* 2. TAMPILAN MOBILE (md:hidden) */}
      <div className="h-full md:hidden">
        {/* Daftar produk full screen */}
        <ProductListView
          products={filteredProducts}
          isLoading={isLoadingProducts}
          searchTerm={productSearchTerm}
          onSearchChange={setProductSearchTerm}
          onAddToCart={addToCart}
        />

        {/* Tombol Keranjang Mengambang (Floating Button) */}
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
          <SheetContent className="flex flex-col p-0">
            {/* Tampilkan UI Keranjang di dalam Sheet */}
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
              onCheckout={handleCheckout}
            />
          </SheetContent>
        </Sheet>
      </div>
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
    <div className="flex h-full flex-col p-4">
      <h2 className="text-2xl font-bold mb-4">Daftar Produk</h2>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Cari produk (nama atau kode)..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
// Komponen ini digunakan oleh Desktop Panel dan Mobile Sheet
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
  onCheckout,
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
  onCheckout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
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

      <ScrollArea className="flex-1 px-4">
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
      <div className="p-4 mt-auto border-t">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          
          {/* Switch Diskon Poin */}
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
          
          {/* Tampilan Diskon */}
          {discountAmount > 0 && (
            <div className="flex justify-between text-destructive">
              <span className="font-medium">Diskon Poin</span>
              <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
            </div>
          )}

          {/* Total Akhir */}
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>Rp {cartTotal.toLocaleString("id-ID")}</span>
          </div>
          
          {/* Tombol Bayar */}
          <Button
            size="lg"
            className="w-full text-lg"
            onClick={onCheckout}
            disabled={isSubmitting || cart.length === 0}
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

  // Efek untuk mencari pelanggan (dengan debounce)
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(API_URL_CUSTOMERS, {
          params: { search: search, limit: 10 }, // Ambil 10 hasil
        });
        setCustomers(response.data.data);
      } catch (error) {
        console.error("Gagal mencari pelanggan:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Timer debounce 300ms
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(timer); // Bersihkan timer
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
                    className={"mr-2 h-4 w-4 opacity-0"} // Diberi opacity 0 agar layout rapi
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