// frontend/src/app/(dashboard)/today-transactions/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";

// Komponen UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Receipt,
  CalendarDays,
  Search,
  RefreshCw,
  Eye,
  MessageCircle,
  Printer,
  ShoppingBag,
  CreditCard,
  User,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from "lucide-react";

// --- Tipe Data ---
interface TransactionDetail {
  id: number;
  quantity: number;
  priceAtTransaction: number;
  discount: number | null;
  subtotal: number;
  product: {
    name: string;
    productCode: string;
  };
}

interface TodayTransaction {
  id: number;
  createdAt: string;
  totalPrice: number;
  totalDiscount: number | null;
  discountByPoints: number | null;
  discountByVoucher: number | null;
  finalAmount: number;
  pointsEarned: number | null;
  pointsUsed: number | null;
  status: "COMPLETED" | "CANCELLED";
  customer: { id: number; name: string; phoneNumber: string | null } | null;
  user: { id: number; name: string } | null;
  paymentMethod: { id: number; name: string } | null;
  details: TransactionDetail[];
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface SummaryInfo {
  todayRevenue: number;
  totalCompletedOrders: number;
  totalOrders: number;
}

const formatCurrency = (val: number | string | null | undefined) => {
  const num = Number(val || 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export default function TodayTransactionsPage() {
  const [transactions, setTransactions] = useState<TodayTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter & Pencarian
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Summary Metrics (Khusus Penjualan, TIDAK ADA PROFIT)
  const [summary, setSummary] = useState<SummaryInfo>({
    todayRevenue: 0,
    totalCompletedOrders: 0,
    totalOrders: 0,
  });

  // Pagination
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  // Modal Detail Transaksi
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TodayTransaction | null>(null);

  // Fetch Transaksi Hari Ini
  const fetchTodayTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/transactions/today", {
        params: {
          page: currentPage,
          limit: 10,
          search: activeSearch,
          status: statusFilter,
        },
      });

      setTransactions(response.data.data || []);
      setPagination(
        response.data.pagination || {
          totalCount: 0,
          totalPages: 1,
          currentPage: 1,
          limit: 10,
        }
      );
      if (response.data.summary) {
        setSummary(response.data.summary);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.error || "Gagal memuat transaksi hari ini"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, activeSearch, statusFilter]);

  useEffect(() => {
    fetchTodayTransactions();
  }, [fetchTodayTransactions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTodayTransactions();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearch(searchInput.trim());
  };

  const handleResetFilter = () => {
    setSearchInput("");
    setActiveSearch("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  // Kirim Struk WhatsApp ke Pelanggan
  const handleSendWA = (tx: TodayTransaction) => {
    if (!tx.customer?.phoneNumber) {
      toast.error("Pelanggan tidak memiliki nomor WhatsApp.");
      return;
    }

    const createdAt = new Date(tx.createdAt);
    const dateStr = format(createdAt, "dd MMMM yyyy", {
      locale: dateFnsLocaleId,
    });
    const timeStr = createdAt.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const orderDetails = tx.details
      .map(
        (item, i) =>
          `${i + 1}. ${item.product.name} — ${item.quantity}x Rp ${Number(
            item.priceAtTransaction
          ).toLocaleString("id-ID")}`
      )
      .join("\n");

    let phone = tx.customer.phoneNumber.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    if (!phone.startsWith("62")) phone = "62" + phone;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const baseUrl = isMobile
      ? "https://api.whatsapp.com/send"
      : "https://web.whatsapp.com/send";

    const message = `🧾 *My Perfume - Struk Belanja*

📍 Jl. Raya Panglegur, Kota Pamekasan
🗓 ${dateStr} | ${timeStr}
👤 Pelanggan: ${tx.customer.name}
🔖 ID Transaksi: #${tx.id}

━━━━━━━━━━━━━━━━
   *Detail Pesanan*
━━━━━━━━━━━━━━━━
${orderDetails}

💳 *Total:* Rp ${Number(tx.finalAmount).toLocaleString("id-ID")}
💰 Pembayaran: ${tx.paymentMethod?.name || "-"}

━━━━━━━━━━━━━━━━
🙏 Terima kasih telah berbelanja di My Perfume!
Simpan nomor ini untuk update katalog & promo terbaru.
IG: @Myperfumeee_`;

    window.open(
      `${baseUrl}?phone=${phone}&text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  // Cetak Nota Sederhana
  const handlePrintReceipt = (tx: TodayTransaction) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak");
      return;
    }

    const itemsHtml = tx.details
      .map(
        (item) => `
        <div style="display:flex; justify-content:space-between; margin:4px 0; font-size:12px;">
          <span>${item.product.name} (${item.quantity}x)</span>
          <span>${formatCurrency(item.subtotal)}</span>
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk #${tx.id} - My Perfume</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 20px; line-height: 1.4; }
            .text-center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .flex-between { display: flex; justify-content: space-between; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold" style="font-size:14px;">MY PERFUME</div>
          <div class="text-center">Jl. Raya Panglegur, Pamekasan</div>
          <div class="divider"></div>
          <div class="flex-between"><span>No. Nota:</span><span>#${tx.id}</span></div>
          <div class="flex-between"><span>Waktu:</span><span>${format(
            new Date(tx.createdAt),
            "dd/MM/yyyy HH:mm"
          )}</span></div>
          <div class="flex-between"><span>Kasir:</span><span>${
            tx.user?.name || "-"
          }</span></div>
          <div class="flex-between"><span>Pelanggan:</span><span>${
            tx.customer?.name || "Guest"
          }</span></div>
          <div class="divider"></div>
          ${itemsHtml}
          <div class="divider"></div>
          <div class="flex-between"><span>Subtotal:</span><span>${formatCurrency(
            tx.totalPrice
          )}</span></div>
          ${
            Number(tx.discountByPoints || 0) > 0
              ? `<div class="flex-between"><span>Diskon Poin:</span><span>-${formatCurrency(
                  tx.discountByPoints
                )}</span></div>`
              : ""
          }
          ${
            Number(tx.discountByVoucher || 0) > 0
              ? `<div class="flex-between"><span>Diskon Voucher:</span><span>-${formatCurrency(
                  tx.discountByVoucher
                )}</span></div>`
              : ""
          }
          <div class="flex-between font-bold" style="font-size:13px; margin-top:4px;">
            <span>TOTAL:</span><span>${formatCurrency(tx.finalAmount)}</span>
          </div>
          <div class="flex-between"><span>Metode:</span><span>${
            tx.paymentMethod?.name || "Tunai"
          }</span></div>
          <div class="divider"></div>
          <div class="text-center" style="margin-top:12px;">Terima Kasih Atas Kunjungan Anda</div>
          <div class="text-center">Barang yang sudah dibeli tidak dapat ditukar</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const todayFormatted = format(new Date(), "EEEE, dd MMMM yyyy", {
    locale: dateFnsLocaleId,
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Transaksi Hari Ini
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>{todayFormatted}</span>
            <span className="text-muted-foreground/60">•</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Akses Kasir
            </span>
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span>Perbarui Data</span>
        </Button>
      </div>

      {/* KARTU RINGKASAN PENJUALAN (TANPA INFORMASI PROFIT/MARGIN) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-l-4 border-l-primary shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Omzet Hari Ini
            </CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(summary.todayRevenue)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari seluruh transaksi sukses hari ini
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transaksi Sukses
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                `${summary.totalCompletedOrders} Nota`
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nota penjualan berhasil diproses
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Seluruh Nota
            </CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                `${summary.totalOrders} Transaksi`
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Termasuk transaksi selesai & batal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & PENCARIAN */}
      <Card className="shadow-xs">
        <CardContent className="pt-6">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between"
          >
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari ID Nota atau Nama Pelanggan..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="w-full sm:w-[180px]">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="COMPLETED">Sukses</SelectItem>
                    <SelectItem value="CANCELLED">Batal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" variant="default" className="gap-2">
                <Search className="h-4 w-4" />
                <span>Cari</span>
              </Button>

              {(activeSearch || statusFilter !== "ALL") && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetFilter}
                  className="gap-1.5 text-muted-foreground"
                >
                  <FilterX className="h-4 w-4" />
                  <span>Reset</span>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* TABEL TRANSAKSI HARI INI */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-muted/30">
          <CardTitle className="text-base font-semibold">
            Daftar Transaksi ({todayFormatted})
          </CardTitle>
          <CardDescription>
            Menampilkan transaksi yang dibuat sepanjang hari ini.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[80px]">ID Nota</TableHead>
                  <TableHead className="w-[100px]">Waktu</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Kasir</TableHead>
                  <TableHead>Metode Bayar</TableHead>
                  <TableHead className="text-right">Total Belanja</TableHead>
                  <TableHead className="text-center w-[110px]">Status</TableHead>
                  <TableHead className="text-right w-[140px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <Receipt className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-medium text-base">Belum Ada Transaksi Hari Ini</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        {activeSearch || statusFilter !== "ALL"
                          ? "Tidak ditemukan transaksi sesuai kriteria pencarian."
                          : "Transaksi baru yang dibuat di kasir akan otomatis tampil di sini."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => {
                    const time = format(new Date(tx.createdAt), "HH:mm");
                    return (
                      <TableRow
                        key={tx.id}
                        className={
                          tx.status === "CANCELLED"
                            ? "opacity-60 bg-muted/20"
                            : ""
                        }
                      >
                        <TableCell className="font-mono font-medium">
                          #{tx.id}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-medium">
                          {time}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {tx.customer?.name || "Guest"}
                            </span>
                            {tx.customer?.phoneNumber && (
                              <span className="text-[11px] text-muted-foreground">
                                {tx.customer.phoneNumber}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {tx.user?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {tx.paymentMethod?.name || "CASH"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {formatCurrency(tx.finalAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              tx.status === "COMPLETED"
                                ? "default"
                                : "destructive"
                            }
                            className={
                              tx.status === "COMPLETED"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : ""
                            }
                          >
                            {tx.status === "COMPLETED" ? "Sukses" : "Batal"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {tx.status === "COMPLETED" &&
                              tx.customer?.phoneNumber && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleSendWA(tx)}
                                  title="Kirim Struk WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              )}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              onClick={() => {
                                setSelectedTx(tx);
                                setIsDetailOpen(true);
                              }}
                              title="Lihat Detail Transaksi"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-xs text-muted-foreground">
                Halaman {pagination.currentPage} dari {pagination.totalPages} (Total {pagination.totalCount} transaksi)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={pagination.currentPage <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, pagination.totalPages)
                    )
                  }
                  disabled={
                    pagination.currentPage >= pagination.totalPages || isLoading
                  }
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG DETAIL TRANSAKSI (TANPA INFORMASI HPP / PROFIT) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detail Nota #{selectedTx?.id}</span>
              {selectedTx && (
                <Badge
                  variant={
                    selectedTx.status === "COMPLETED"
                      ? "default"
                      : "destructive"
                  }
                  className={
                    selectedTx.status === "COMPLETED"
                      ? "bg-emerald-600 text-white"
                      : ""
                  }
                >
                  {selectedTx.status === "COMPLETED" ? "Sukses" : "Batal"}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Waktu Transaksi:{" "}
              {selectedTx &&
                format(new Date(selectedTx.createdAt), "dd MMMM yyyy HH:mm", {
                  locale: dateFnsLocaleId,
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-4 text-sm">
              {/* Info Kasir, Pelanggan, Metode Bayar */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground">Kasir:</span>
                  <p className="font-semibold">{selectedTx.user?.name || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pelanggan:</span>
                  <p className="font-semibold">
                    {selectedTx.customer?.name || "Guest"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Metode Pembayaran:</span>
                  <p className="font-semibold">
                    {selectedTx.paymentMethod?.name || "CASH"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Poin Didapat:</span>
                  <p className="font-semibold">
                    {selectedTx.pointsEarned || 0} Poin
                  </p>
                </div>
              </div>

              {/* Rincian Produk */}
              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Daftar Produk
                </h4>
                <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
                  {selectedTx.details.map((detail) => (
                    <div
                      key={detail.id}
                      className="flex items-center justify-between p-2.5 text-xs"
                    >
                      <div>
                        <p className="font-medium">{detail.product.name}</p>
                        <p className="text-muted-foreground text-[11px]">
                          {detail.quantity} x{" "}
                          {formatCurrency(detail.priceAtTransaction)}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(detail.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rincian Pembayaran */}
              <div className="border-t pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Belanja:</span>
                  <span>{formatCurrency(selectedTx.totalPrice)}</span>
                </div>
                {Number(selectedTx.discountByPoints || 0) > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Diskon Poin:</span>
                    <span>
                      -{formatCurrency(selectedTx.discountByPoints)}
                    </span>
                  </div>
                )}
                {Number(selectedTx.discountByVoucher || 0) > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Diskon Voucher:</span>
                    <span>
                      -{formatCurrency(selectedTx.discountByVoucher)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t text-foreground">
                  <span>Total Akhir:</span>
                  <span className="text-primary">
                    {formatCurrency(selectedTx.finalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
            {selectedTx && selectedTx.customer?.phoneNumber && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => handleSendWA(selectedTx)}
              >
                <MessageCircle className="h-4 w-4" />
                <span>Kirim WhatsApp</span>
              </Button>
            )}
            {selectedTx && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handlePrintReceipt(selectedTx)}
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Nota</span>
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsDetailOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
