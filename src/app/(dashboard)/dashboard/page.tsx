// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios"; // <-- PENTING: Gunakan instance axios kita
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Package,
} from "lucide-react";

// Tipe data untuk summary
interface SummaryData {
  todayRevenue: number;
  todayProfit: number;
  todayTransactions: number;
  todayItemsSold: number;
  // newCustomersToday: number; // (Jika Anda mengaktifkannya di backend)
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk memformat mata uang
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        // Panggil API yang sudah kita amankan
        const res = await axios.get("http://localhost:5000/api/reports/summary");
        setSummary(res.data);
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

    fetchSummary();
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
            {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
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

      {/* Di sinilah Anda bisa menambahkan komponen lain
        seperti grafik penjualan (Fase 6)
      */}
      {/* <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Grafik Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Grafik akan muncul di sini...</p>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}

// Komponen terpisah untuk UI Skeleton (agar kode utama bersih)
function DashboardLoadingSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-64 mb-4" />
      <Skeleton className="h-5 w-full max-w-sm mb-6" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}