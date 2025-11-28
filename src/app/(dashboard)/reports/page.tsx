// frontend/src/app/(dashboard)/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios"; // Pastikan dari /lib/axios
import { toast } from "sonner";
import { format, addDays, startOfMonth } from "date-fns"; // Untuk tanggal
import { id as dateFnsLocaleId } from "date-fns/locale"; // Bahasa Indonesia
import { DateRange } from "react-day-picker"; // Tipe untuk rentang tanggal

// Komponen UI
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

// --- Tipe Data ---
interface Transaction {
  id: number;
  createdAt: string;
  finalAmount: number;
  totalMargin: number;
  customer: { name: string } | null;
  user: { name: string } | null; // Kasir
  paymentMethod: { name: string } | null; // <-- BARU
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// --- API URL ---
const API_URL = "/reports/transactions";

// ====================================================================
// ================= Halaman Riwayat Transaksi ========================
// ====================================================================
export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk query (filter & pagination)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });

  // State untuk Date Picker
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()), // Awal bulan ini
    to: new Date(), // Hari ini
  });

  // State yang dikirim ke API
  const [apiQuery, setApiQuery] = useState({
    page: 1,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  // --- Fungsi Fetch Data ---
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(API_URL, {
          params: apiQuery, // Kirim query (page, startDate, endDate)
        });
        setTransactions(response.data.data);
        setPaginationInfo(response.data.pagination);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error || "Gagal mengambil riwayat transaksi";
        toast.error("Gagal Memuat Laporan", { description: errorMessage });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [apiQuery]); // <--- Dipicu setiap kali apiQuery berubah

  // --- Handler ---
  const handleFilterApply = () => {
    // Saat tombol "Terapkan" diklik, update apiQuery
    setApiQuery({
      page: 1, // Reset ke halaman 1
      startDate: date?.from ? format(date.from, "yyyy-MM-dd") : "",
      endDate: date?.to ? format(date.to, "yyyy-MM-dd") : "",
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;
    // Update apiQuery hanya di bagian 'page'
    setApiQuery((prev) => ({ ...prev, page: newPage }));
  };

  // --- Utility ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // --- RENDER (JSX) ---
  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <h1 className="text-3xl font-bold mb-4">Riwayat Transaksi</h1>
      <p className="mb-6 text-muted-foreground">
        Lihat semua transaksi yang telah selesai.
      </p>

      {/* Filter Bar (TETAP SAMA) */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className="w-full md:w-[300px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {/* ... (Isi Tombol Tanggal) ... */}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              locale={dateFnsLocaleId}
            />
          </PopoverContent>
        </Popover>
        <Button onClick={handleFilterApply}>Terapkan Filter</Button>
      </div>

      {/* Konten (Loading / Data) */}
      {isLoading ? (
        // --- Panggil Skeleton (Sekarang sudah responsif) ---
        <ReportLoadingSkeleton />
      ) : (
        <>
          {/* --- 1. TAMPILAN TABEL (Hanya Desktop) --- */}
          <div className="rounded-md border hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>ID Transaksi</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Kasir</TableHead>
                  <TableHead>Metode Bayar</TableHead>
                  <TableHead className="text-right">Total Profit</TableHead>
                  <TableHead className="text-right">Total Penjualan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Tidak ada transaksi pada rentang tanggal ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.createdAt)}</TableCell>
                      <TableCell className="font-medium">TRX-{tx.id}</TableCell>
                      <TableCell>{tx.customer?.name || "Guest"}</TableCell>
                      <TableCell>{tx.user?.name || "N/A"}</TableCell>
                      <TableCell>{tx.paymentMethod?.name || "N/A"}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(tx.totalMargin)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(tx.finalAmount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* --- 2. TAMPILAN KARTU (Hanya Mobile) --- */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                Tidak ada transaksi pada rentang tanggal ini.
              </p>
            ) : (
              transactions.map((tx) => (
                <Card key={tx.id}>
                  <CardHeader>
                    <CardTitle>TRX-{tx.id}</CardTitle>
                    <CardDescription>
                      {formatDate(tx.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Total
                      </span>
                      <span className="font-medium">
                        {formatCurrency(tx.finalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Profit
                      </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(tx.totalMargin)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Pelanggan
                      </span>
                      <span className="font-medium text-sm">
                        {tx.customer?.name || "Guest"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Kasir
                      </span>
                      <span className="font-medium text-sm">
                        {tx.user?.name || "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          {/* ------------------------------------- */}

          {/* Pagination (TETAP SAMA) */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-muted-foreground">
              Total {paginationInfo.totalCount} transaksi
            </span>
            <div className="flex items-center gap-2">
              {/* ... (Tombol Pagination) ... */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ====================================================================
// ================= Komponen Skeleton Loading ========================
// ====================================================================
function ReportLoadingSkeleton() {
  return (
    <div>
      {/* Filter Bar Skeleton */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-10 w-full md:w-[300px]" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* --- 1. Skeleton Tabel (Desktop) --- */}
      <div className="rounded-md border hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-5 w-32" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-24" />
              </TableHead>
              <TableHead className="text-right">
                <Skeleton className="h-5 w-28 ml-auto" />
              </TableHead>
              <TableHead className="text-right">
                <Skeleton className="h-5 w-28 ml-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-28 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-28 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* --- 2. Skeleton Kartu (Mobile) --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-40 mt-1" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
