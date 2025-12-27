"use client";

import { useRef, useEffect, useState } from "react"; // <-- 1. Import useRef & useEffect
import { Search, Loader2, ScanBarcode } from "lucide-react"; // Tambah ikon Scan
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Html5QrcodeScanner } from "html5-qrcode";

interface Product {
  id: number;
  name: string;
  type: "PERFUME" | "BOTTLE"; // <-- Tambahkan ini
  stock: number;
  purchasePrice: number; // <-- Tambahkan ini
  sellingPrice: number;
  productCode: string;
}
interface ProductListViewProps {
  products: Product[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;

  onAddToCart: (product: Product) => void;
}

export function ProductListView({
  products,
  isLoading,
  searchTerm,
  onSearchChange,
  onAddToCart,
}: ProductListViewProps) {
  const [showScanner, setShowScanner] = useState(false);

  // 2. Buat referensi untuk input
  const inputRef = useRef<HTMLInputElement>(null);

  // 3. Auto-focus saat komponen dimuat
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 4. Fungsi untuk menangani Scan (Tombol Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Mencegah submit form jika ada

      if (products.length === 0) return;

      // Cari produk yang Kode-nya SAMA PERSIS (Prioritas Scanner)
      const exactMatch = products.find(
        (p) => p.productCode.toLowerCase() === searchTerm.toLowerCase()
      );

      // Jika tidak ada kode persis, ambil hasil pencarian teratas (jika cuma 1)
      const targetProduct =
        exactMatch || (products.length === 1 ? products[0] : null);

      if (targetProduct) {
        if (targetProduct.stock > 0) {
          onAddToCart(targetProduct); // Tambah ke keranjang
          onSearchChange(""); // Kosongkan input untuk scan berikutnya
        } else {
          // Opsional: Toast "Stok Habis" (tapi biasanya sudah di handle di parent)
        }
      }
    }
  };

  const handleScanResult = (code: string) => {
  const product = products.find(
    (p) => p.productCode.toLowerCase() === code.toLowerCase()
  );

  if (product && product.stock > 0) {
    onAddToCart(product);
  }

  setShowScanner(false);
};


  // Fungsi helper untuk fokus manual
  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">

      {showScanner && (
  <BarcodeScanner
    onScan={handleScanResult}
    onClose={() => setShowScanner(false)}
  />
)}
      <div className="p-4 pb-0 flex justify-between items-center">
        <h2 className="text-2xl font-bold mb-4">Daftar Produk</h2>
        {/* Tombol kecil untuk re-focus jika kasir tidak sengaja klik luar */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowScanner(true)}
          title="Scan Kamera"
        >
          <ScanBarcode className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 mb-4 relative">
        <Search className="absolute left-7 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef} // <-- Pasang ref di sini
          placeholder="Scan barcode atau cari nama..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown} // <-- Pasang handler Enter
          autoFocus // Tambahan HTML standard
        />
      </div>

      <ScrollArea className="flex-1 min-h-0 px-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {products.map((p) => (
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
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Stok: {p.stock}</span>
                    <span>{p.productCode}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {products.length === 0 && searchTerm !== "" && (
              <div className="col-span-full text-center text-muted-foreground py-10">
                Produk tidak ditemukan.
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function BarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (code: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center">
      <div className="bg-white p-4 rounded-lg w-full max-w-sm">
        <div id="reader" />
        <Button className="w-full mt-3" variant="destructive" onClick={onClose}>
          Tutup Scanner
        </Button>
      </div>
    </div>
  );
}
