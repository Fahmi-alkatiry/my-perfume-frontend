// frontend/src/app/(dashboard)/products/stock-opname/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, ClipboardList, Loader2, ArrowRightLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: number;
  name: string;
  productCode: string;
  stock: number; // Stok Sistem
}

export default function StockOpnamePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State untuk Dialog Penyesuaian
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [physicalStock, setPhysicalStock] = useState(""); // Input user
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Ambil semua produk (limit besar)
      const res = await axios.get("/products", { params: { limit: 1000, search: searchTerm } });
      setProducts(res.data.data);
    } catch (error) {
      toast.error("Gagal memuat data produk");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Buka Dialog
  const handleOpenAdjust = (product: Product) => {
    setSelectedProduct(product);
    setPhysicalStock(product.stock.toString()); // Default isi dengan stok sistem
    setNotes("");
    setIsDialogOpen(true);
  };

  // Submit Penyesuaian
  const handleAdjustSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const actualStock = Number(physicalStock);
    if (isNaN(actualStock) || actualStock < 0) {
      toast.error("Stok fisik tidak valid");
      return;
    }

    // Cek jika tidak ada perubahan
    if (actualStock === selectedProduct.stock) {
      toast.info("Stok fisik sama dengan sistem. Tidak ada perubahan.");
      setIsDialogOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`/products/${selectedProduct.id}/adjust-stock`, {
        actualStock,
        notes: notes || "Stok Opname Harian",
      });

      toast.success(`Stok ${selectedProduct.name} berhasil disesuaikan.`);
      
      // Update UI lokal (biar gak perlu fetch ulang berat-berat)
      setProducts(products.map(p => 
        p.id === selectedProduct.id ? { ...p, stock: actualStock } : p
      ));
      
      setIsDialogOpen(false);
    } catch (error: any) {
      const msg = error.response?.data?.error || "Gagal menyesuaikan stok";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-primary" />
          Stok Opname
        </h1>
        <p className="text-muted-foreground">
          Sesuaikan jumlah stok di sistem dengan kondisi fisik sebenarnya di toko.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Cari produk untuk di-opname..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabel Produk */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Produk</TableHead>
              <TableHead className="text-center bg-gray-50 w-[150px]">Stok Sistem</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               [...Array(5)].map((_, i) => (
                <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center h-24">Produk tidak ditemukan.</TableCell></TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="text-muted-foreground">{product.productCode}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-center font-bold text-lg bg-gray-50">
                    {product.stock}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleOpenAdjust(product)}>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Sesuaikan
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Penyesuaian */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Penyesuaian Stok</DialogTitle>
            <DialogDescription>
              Masukkan jumlah <b>fisik real</b> yang ada di rak saat ini.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <form onSubmit={handleAdjustSubmit} className="grid gap-4 py-4">
              <div className="p-3 bg-muted rounded-md text-sm">
                <div className="flex justify-between mb-1">
                    <span>Produk:</span>
                    <span className="font-bold">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between">
                    <span>Stok Sistem:</span>
                    <span className="font-bold">{selectedProduct.stock}</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="physical">Stok Fisik (Real)</Label>
                <Input
                  id="physical"
                  type="number"
                  value={physicalStock}
                  onChange={(e) => setPhysicalStock(e.target.value)}
                  className="text-lg font-bold"
                  autoFocus
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Keterangan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Cth: Botol pecah, barang hilang, bonus..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}