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
import { Badge } from "@/components/ui/badge"; // Pastikan install badge: npx shadcn@latest add badge
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Install: npx shadcn@latest add tooltip

// Tipe Data
interface ForecastItem {
  id: number;
  name: string;
  currentStock: number;
  salesHistory: number[]; // Array penjualan 3 bulan
  forecast: number;
  mape: string;
  status: "AMAN" | "WARNING" | "RESTOCK";
}

export default function ForecastPage() {
  const [data, setData] = useState<ForecastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ambil nama 3 bulan terakhir untuk header tabel
  const getLast3Months = () => {
    const months = [];
    for (let i = 3; i >= 1; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString("id-ID", { month: "short" }));
    }
    return months;
  };
  const monthLabels = getLast3Months();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/reports/forecast");
        setData(res.data);
      } catch (error) {
        toast.error("Gagal memuat data peramalan");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="h-full overflow-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-primary" />
          Peramalan Stok (Forecasting)
        </h1>
        <p className="text-muted-foreground">
          Prediksi kebutuhan stok bulan depan menggunakan metode 
          <span className="font-semibold text-foreground"> Simple Moving Average (SMA) 3-Bulan</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hasil Analisis</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead className="text-center">Stok Saat Ini</TableHead>
                    {/* Header Bulan Dinamis */}
                    {monthLabels.map((m, i) => (
                      <TableHead key={i} className="text-center text-muted-foreground text-xs">
                        Jual {m}
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold text-blue-600">
                      Prediksi Bulan Depan
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        MAPE (%)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mean Absolute Percentage Error.</p>
                              <p>Semakin kecil %, semakin akurat.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Status Rekomendasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">{item.currentStock}</TableCell>
                      
                      {/* Riwayat Penjualan */}
                      {item.salesHistory.map((qty, idx) => (
                        <TableCell key={idx} className="text-center text-muted-foreground">
                          {qty}
                        </TableCell>
                      ))}

                      {/* Angka Prediksi */}
                      <TableCell className="text-center font-bold text-lg bg-blue-50">
                        {item.forecast}
                      </TableCell>

                      {/* Error Rate */}
                      <TableCell className="text-center text-xs">
                        {item.mape}%
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="text-right">
                        {item.status === "AMAN" && (
                          <Badge className="bg-green-500 hover:bg-green-600">Aman</Badge>
                        )}
                        {item.status === "WARNING" && (
                          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                            Menipis
                          </Badge>
                        )}
                        {item.status === "RESTOCK" && (
                          <Badge variant="destructive">Restock Segera!</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}