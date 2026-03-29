// frontend/src/app/(dashboard)/reports/stock/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/export";
import { format, startOfMonth } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";
import { DateRange } from "react-day-picker";

// Komponen UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  // Loader2,
  Download,
  Search,
  CalendarIcon,
} from "lucide-react";
import { PaginationBar } from "@/components/products/PaginationBar";

// --- Tipe Data ---
interface StockHistoryItem {
  id: number;
  createdAt: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  notes: string | null;
  product: {
    name: string;
    productCode: string;
  };
  user: {
    name: string;
  } | null;
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// --- API URL ---
const API_URL = "/reports/stock-history";

// ====================================================================
// ================= Halaman Riwayat Stok =============================
// ====================================================================
export default function StockHistoryPage() {
  const [history, setHistory] = useState<StockHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk query
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 15, // Tampilkan 15 item per halaman
  });

  // State untuk UI Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all', 'IN', 'OUT'
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // State yang dikirim ke API
  const [apiQuery, setApiQuery] = useState({
    page: 1,
    limit: 15,
    search: "",
    type: "",
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  // --- Fungsi Fetch Data ---
  useEffect(() => {
    const fetchStockHistory = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(API_URL, {
          params: apiQuery,
        });
        setHistory(response.data.data);
        setPaginationInfo(response.data.pagination);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error || "Gagal mengambil riwayat stok";
        toast.error("Gagal Memuat Laporan", { description: errorMessage });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockHistory();
  }, [apiQuery]); // Dipicu setiap kali apiQuery berubah

  // --- Handler ---
  const handleFilterApply = () => {
    setApiQuery({
      page: 1, // Reset ke halaman 1
      limit: 15,
      search: searchTerm,
      type: typeFilter === "all" ? "" : typeFilter, // Kirim string kosong jika 'all'
      startDate: date?.from ? format(date.from, "yyyy-MM-dd") : "",
      endDate: date?.to ? format(date.to, "yyyy-MM-dd") : "",
    });
  };

  const handleExport = async () => {
    const loadingToast = toast.loading("Menyiapkan data untuk diekspor...");

    try {
      // Panggil API lagi dengan limit besar untuk mengambil semua data sesuai filter
      const response = await axios.get(API_URL, {
        params: {
          ...apiQuery,
          limit: 9999, // Ambil semua
          page: 1,
        },
      });

      const allHistory = response.data.data;

      if (allHistory.length === 0) {
        toast.error("Tidak ada data untuk diekspor", { id: loadingToast });
        return;
      }

      const exportData = allHistory.map((item: StockHistoryItem) => ({
        "Tanggal": new Date(item.createdAt).toLocaleDateString("id-ID"),
        "Waktu": new Date(item.createdAt).toLocaleTimeString("id-ID"),
        "Nama Produk": item.product.name,
        "Kode Produk": item.product.productCode,
        "Tipe": item.type, // IN / OUT
        "Jumlah": item.quantity,
        "Keterangan": item.notes || "-",
        "Admin": item.user?.name || "N/A"
      }));

      exportToExcel(
        exportData, 
        `Riwayat_Stok_Lengkap_${new Date().toISOString().split('T')[0]}`
      );
      toast.success("Riwayat stok diunduh", { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data lengkap untuk ekspor", { id: loadingToast });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;
    setApiQuery((prev) => ({ ...prev, page: newPage }));
  };

  // --- Utility ---
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // --- RENDER (JSX) ---
  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <h1 className="text-3xl font-bold mb-4">Riwayat Stok</h1>
      <p className="mb-6 text-muted-foreground">
        Lacak semua perubahan stok masuk (IN) dan keluar (OUT) untuk audit.
      </p>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        {/* Filter Range Tanggal */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full md:w-[260px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd/MM/yy")} -{" "}
                    {format(date.to, "dd/MM/yy")}
                  </>
                ) : (
                  format(date.from, "dd/MM/yy")
                )
              ) : (
                <span>Pilih rentang tanggal</span>
              )}
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

        {/* Filter Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau kode produk..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilterApply()}
          />
        </div>
        
        {/* Filter Tipe */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="IN">Stok Masuk (IN)</SelectItem>
            <SelectItem value="OUT">Stok Keluar (OUT)</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleFilterApply} className="w-full md:w-auto">
          Terapkan Filter
        </Button>
        <Button variant="outline" size="icon" onClick={handleExport} title="Download Excel">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Konten (Loading / Data) */}
      {isLoading ? (
        <StockHistoryLoadingSkeleton />
      ) : (
        <>
          {/* --- 1. TAMPILAN TABEL (Hanya Desktop) --- */}
          <div className="rounded-md border hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-center">Jumlah</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Dicatat Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Tidak ada data riwayat stok untuk filter ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="font-medium">
                        <div>{item.product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.product.productCode}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            item.type === "IN"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {item.type}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-center font-bold ${
                          item.type === "IN"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.type === "IN" ? "+" : "-"}
                        {item.quantity}
                      </TableCell>
                      <TableCell>{item.notes || "-"}</TableCell>
                      <TableCell>{item.user?.name || "N/A"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* --- 2. TAMPILAN KARTU (Hanya Mobile) --- */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                Tidak ada data riwayat stok untuk filter ini.
              </p>
            ) : (
              history.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{item.product.name}</CardTitle>
                        <CardDescription>
                          {formatDate(item.createdAt)}
                        </CardDescription>
                      </div>
                      <span
                        className={`text-xl font-bold ${
                          item.type === "IN"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.type === "IN" ? "+" : "-"}
                        {item.quantity}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipe</span>
                      <span
                        className={`font-medium ${
                          item.type === "IN"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Keterangan</span>
                      <span className="font-medium">{item.notes || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dicatat Oleh</span>
                      <span className="font-medium">
                        {item.user?.name || "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          {/* ------------------------------------- */}

          {/* Pagination */}
          <PaginationBar
            paginationInfo={paginationInfo}
            isLoading={isLoading}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

// ====================================================================
// ================= Komponen Skeleton Loading ========================
// ====================================================================
function StockHistoryLoadingSkeleton() {
  return (
    <div>
      {/* Filter Bar Skeleton */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full md:w-[180px]" />
        <Skeleton className="h-10 w-full md:w-32" />
      </div>
      {/* Tabel Skeleton */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton className="h-5 w-32" /></TableHead>
              <TableHead><Skeleton className="h-5 w-40" /></TableHead>
              <TableHead><Skeleton className="h-5 w-16" /></TableHead>
              <TableHead className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
              <TableHead><Skeleton className="h-5 w-24" /></TableHead>
              <TableHead><Skeleton className="h-5 w-24" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}