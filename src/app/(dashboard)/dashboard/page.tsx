// frontend/src/app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Package,
  AlertTriangle,
  PackageCheck,
} from "lucide-react";
// --- IMPOR RECHARTS ---
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- Tipe Data ---
interface SummaryData {
  todayRevenue: number;
  todayProfit: number;
  todayNetProfit: number; // <-- TAMBAHKAN INI
  todayExpenses: number;  // <-- TAMBAHKAN INI
  todayTransactions: number;
  todayItemsSold: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  productCode: string;
  stock: number;
  minimumStock: number;
}

// Tipe Data Grafik
interface SalesTrendData {
  date: string;
  total: number;
}
interface TopProductData {
  name: string;
  sales: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>(
    []
  );

  // State untuk Grafik
  const [salesTrend, setSalesTrend] = useState<SalesTrendData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);

  const [isLoading, setIsLoading] = useState(true);

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
        // Panggil 3 API sekaligus
        const [summaryRes, lowStockRes, chartsRes] = await Promise.all([
          axios.get("/reports/summary"),
          axios.get("/reports/low-stock"),
          axios.get("/reports/charts"), // <-- Panggil API Grafik
        ]);

        setSummary(summaryRes.data);
        setLowStockProducts(lowStockRes.data);

        // Set Data Grafik
        setSalesTrend(chartsRes.data.salesTrend);
        setTopProducts(chartsRes.data.topProducts);
      } catch (error: any) {
        console.error(error);
        // Jangan tampilkan toast error jika hanya masalah permission (biar user experience kasir tetap ok)
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan penjualan dan aktivitas toko Anda.
        </p>
      </div>

      {/* --- BAGIAN 1: KARTU STATISTIK --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profit Hari Ini
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.todayProfit || 0)}
            </div>
          </CardContent>
        </Card>

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

        {/* Card Tambahan: Pengeluaran */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengeluaran</CardTitle>
            <div className="h-4 w-4 text-red-500">💸</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              - {formatCurrency(summary?.todayExpenses || 0)}
            </div>
          </CardContent>
        </Card>

        {/* Card Tambahan: Net Profit (UANG BERSIH) */}
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-primary">PROFIT BERSIH</CardTitle>
            <div className="h-4 w-4 text-primary">💰</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(summary?.todayNetProfit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Gross Profit - Pengeluaran</p>
          </CardContent>
        </Card>
      </div>

      {/* --- BAGIAN 2: GRAFIK (BARU) --- */}
      <div className="grid gap-4 my-2 md:grid-cols-2 lg:grid-cols-7">
        {/* Grafik Garis: Tren Penjualan (Lebar: 4 kolom) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tren Penjualan</CardTitle>
            <p className="text-sm text-muted-foreground">7 Hari Terakhir</p>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `Rp${value / 1000}k`}
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8884d8"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grafik Batang: Produk Terlaris (Lebar: 3 kolom) */}
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
            <p className="text-sm text-muted-foreground">Bulan Ini (Top 5)</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar
                      dataKey="sales"
                      fill="#82ca9d"
                      radius={[0, 4, 4, 0]}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Belum ada data penjualan bulan ini.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- BAGIAN 3: PERINGATAN STOK --- */}
      <div className="">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">
              Peringatan Stok Rendah
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="flex items-center gap-3 text-green-600 py-4">
                <PackageCheck className="h-6 w-6" />
                <p className="font-medium">Kerja bagus! Semua stok aman.</p>
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center border-b pb-2 last:border-0"
                    >
                      <div>
                        <Link
                          href="/products"
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
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/products">Lihat Semua Produk</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Komponen Skeleton ---
function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64 mb-4" />

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="col-span-4 h-[350px] rounded-xl" />
        <Skeleton className="col-span-4 lg:col-span-3 h-[350px] rounded-xl" />
      </div>

      {/* Low Stock Skeleton */}
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  );
}
