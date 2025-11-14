// frontend/src/app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios"; // Gunakan instance axios kita
import { toast } from "sonner";
import Link from "next/link"; // Impor Link
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // Impor Button
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Package,
  AlertTriangle, // Ikon peringatan
  PackageCheck, // Ikon stok aman
} from "lucide-react";

// Tipe data untuk summary
interface SummaryData {
  todayRevenue: number;
  todayProfit: number;
  todayTransactions: number;
  todayItemsSold: number;
}

// --- BARU: Tipe data untuk Stok Rendah ---
interface LowStockProduct {
  id: number;
  name: string;
  productCode: string;
  stock: number;
  minimumStock: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi format mata uang
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Panggil kedua API secara bersamaan untuk efisiensi
        const [summaryRes, lowStockRes] = await Promise.all([
          axios.get("/api/reports/summary"),
          axios.get("/api/reports/low-stock"),
        ]);

        setSummary(summaryRes.data);
        setLowStockProducts(lowStockRes.data);
      } catch (error: any) {
        console.error(error);
        const errorMessage =
          error.response?.data?.error || "Gagal mengambil data laporan";
        toast.error("Gagal Memuat Laporan", {
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Tampilkan Skeleton saat loading
  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  // Tampilkan data jika sudah siap
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="mb-6 text-muted-foreground">
        Ringkasan penjualan dan aktivitas toko Anda hari ini.
      </p>

      {/* Grid Kartu Statistik (4 Kartu) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Penjualan Hari Ini */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Penjualan Hari Ini
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.todayRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Profit Hari Ini */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.todayProfit || 0)}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Transaksi Hari Ini */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transaksi Hari Ini
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{summary?.todayTransactions || 0}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Item Terjual */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Item Terjual</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{summary?.todayItemsSold || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- KARTU PERINGATAN STOK RENDAH (BARU) --- */}
      <div className="mt-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">
              Peringatan Stok Rendah
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              // Tampilan jika stok aman
              <div className="flex items-center gap-3 text-green-600">
                <PackageCheck className="h-6 w-6" />
                <p className="font-medium">Kerja bagus! Semua stok aman.</p>
              </div>
            ) : (
              // Tampilan jika ada stok rendah
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Produk berikut perlu segera di-restock.
                </p>
                <div className="space-y-2">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <Link
                          href="/products" // Link ke halaman produk
                          className="font-medium hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {product.productCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg text-destructive">
                          {product.stock}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          (Min: {product.minimumStock})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/products">Lihat Semua Produk</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* ------------------------------------------- */}
    </div>
  );
}

// --- Komponen Skeleton (DI-UPDATE) ---
function DashboardLoadingSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-64 mb-4" />
      <Skeleton className="h-5 w-full max-w-sm mb-6" />

      {/* Skeleton Kartu Statistik */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton Kartu Stok Rendah */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-5" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Skeleton className="h-4 w-full max-w-sm" />
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}