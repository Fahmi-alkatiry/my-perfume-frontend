// frontend/src/app/(dashboard)/reports/forecast/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, Info, Search, SlidersHorizontal, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Tipe Data
interface ForecastItem {
  id: number;
  name: string;
  currentStock: number;
  salesHistory: number[]; // Array penjualan dinamis (3 atau 6 bulan)
  forecast: number;
  mape: string;
  status: "AMAN" | "WARNING" | "RESTOCK";
}

export default function ForecastPage() {
  const [data, setData] = useState<ForecastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"3" | "6">("6");

  // State Filter & Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("status-priority");

  // Ambil nama bulan terakhir untuk header tabel berdasarkan periode terpilih
  const getLastMonthsLabels = () => {
    const months = [];
    const limit = parseInt(period);
    for (let i = limit; i >= 1; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString("id-ID", { month: "short" }));
    }
    return months;
  };
  const monthLabels = getLastMonthsLabels();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/reports/forecast?period=${period}`);
        setData(res.data);
      } catch (error) {
        toast.error("Gagal memuat data peramalan");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [period]);

  // Filter & Sort Data
  const filteredAndSortedData = (() => {
    let result = [...data];

    // 1. Search Filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) =>
        item.name.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (statusFilter !== "ALL") {
      result = result.filter((item) => item.status === statusFilter);
    }

    // 3. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "stock-asc":
          return a.currentStock - b.currentStock;
        case "stock-desc":
          return b.currentStock - a.currentStock;
        case "forecast-asc":
          return a.forecast - b.forecast;
        case "forecast-desc":
          return b.forecast - a.forecast;
        case "mape-asc":
          return parseFloat(a.mape) - parseFloat(b.mape);
        case "mape-desc":
          return parseFloat(b.mape) - parseFloat(a.mape);
        case "status-priority":
        default: {
          const priority = { RESTOCK: 1, WARNING: 2, AMAN: 3 };
          const pA = priority[a.status] || 99;
          const pB = priority[b.status] || 99;
          if (pA !== pB) return pA - pB;
          // Jika status sama, urutkan berdasarkan stok terendah
          return a.currentStock - b.currentStock;
        }
      }
    });

    return result;
  })();

  return (
    <div className="h-full overflow-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-primary" />
            Peramalan Stok (Forecasting)
          </h1>
          <p className="text-muted-foreground">
            Prediksi kebutuhan stok bulan depan menggunakan metode{" "}
            <span className="font-semibold text-foreground">
              Simple Moving Average (SMA) {period}-Bulan
            </span>.
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-muted/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Hasil Analisis & Prediksi</CardTitle>
          <CardDescription>
            Riwayat penjualan {period} bulan terakhir, prediksi, tingkat akurasi (MAPE), dan status rekomendasi restok.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter & Sort Bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-muted/30 p-3 rounded-lg border border-muted/50">
            <div className="relative w-full lg:w-[280px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background w-full"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Dropdown Periode */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <CalendarDays className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <Select value={period} onValueChange={(val: "3" | "6") => setPeriod(val)}>
                  <SelectTrigger className="w-full sm:w-[130px] bg-background font-medium">
                    <SelectValue placeholder="Periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Bulan</SelectItem>
                    <SelectItem value="6">6 Bulan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown Status */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-background">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="AMAN">Aman</SelectItem>
                    <SelectItem value="WARNING">Menipis (Warning)</SelectItem>
                    <SelectItem value="RESTOCK">Restock Segera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown Sorting */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[200px] bg-background">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status-priority">Rekomendasi (Restock Dulu)</SelectItem>
                  <SelectItem value="name-asc">Nama Produk (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nama Produk (Z-A)</SelectItem>
                  <SelectItem value="stock-asc">Stok Terendah</SelectItem>
                  <SelectItem value="stock-desc">Stok Tertinggi</SelectItem>
                  <SelectItem value="forecast-asc">Prediksi Terendah</SelectItem>
                  <SelectItem value="forecast-desc">Prediksi Tertinggi</SelectItem>
                  <SelectItem value="mape-asc">Akurasi (MAPE Terendah)</SelectItem>
                  <SelectItem value="mape-desc">Akurasi (MAPE Tertinggi)</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || statusFilter !== "ALL" || sortBy !== "status-priority" || period !== "6") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setSortBy("status-priority");
                    setPeriod("6");
                  }}
                  className="w-full sm:w-auto text-sm text-muted-foreground hover:text-foreground"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-[400px] w-full rounded-md" />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Nama Produk</TableHead>
                    <TableHead className="text-center font-semibold">Stok Saat Ini</TableHead>
                    
                    {/* Header Bulan Dinamis */}
                    {monthLabels.map((m, i) => (
                      <TableHead key={i} className="text-center text-muted-foreground text-xs font-normal">
                        Jual {m}
                      </TableHead>
                    ))}
                    
                    <TableHead className="text-center font-bold text-blue-600 bg-blue-50/50">
                      Prediksi Bulan Depan
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        MAPE (%)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-semibold mb-1">Mean Absolute Percentage Error</p>
                              <p className="text-xs">Mengukur seberapa jauh persentase prediksi meleset.</p>
                              <p className="text-xs text-green-600 font-medium mt-1">Nilai lebih kecil = lebih akurat.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableHead className="text-right pr-4">Rekomendasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5 + parseInt(period)} className="text-center py-10 text-muted-foreground">
                        Tidak ada data produk yang sesuai dengan filter pencarian.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center font-medium">{item.currentStock}</TableCell>
                        
                        {/* Riwayat Penjualan */}
                        {item.salesHistory.map((qty, idx) => (
                          <TableCell key={idx} className="text-center text-muted-foreground text-sm">
                            {qty}
                          </TableCell>
                        ))}

                        {/* Angka Prediksi */}
                        <TableCell className="text-center font-bold text-lg bg-blue-50/30 text-blue-700">
                          {item.forecast}
                        </TableCell>

                        {/* Error Rate */}
                        <TableCell className="text-center text-xs font-mono">
                          {item.mape}%
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="text-right pr-4">
                          {item.status === "AMAN" && (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none px-2.5 py-0.5 text-white">
                              Aman
                            </Badge>
                          )}
                          {item.status === "WARNING" && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none px-2.5 py-0.5">
                              Menipis
                            </Badge>
                          )}
                          {item.status === "RESTOCK" && (
                            <Badge variant="destructive" className="border-none px-2.5 py-0.5">
                              Restock!
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}