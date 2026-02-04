// frontend/src/app/(dashboard)/reports/page.tsx

"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { format, startOfMonth } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";
import { DateRange } from "react-day-picker";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter, // <-- Tambahan
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Ban,
  Eye,
  MessageCircle,
  UserPlus,
  Download, // <-- Ikon Baru
} from "lucide-react";

// Impor Customer Combobox (Kita pakai ulang komponen yang sudah ada)
import { CustomerCombobox, Customer } from "@/components/pos/customer-combobox";
import { exportToExcel } from "@/lib/export";

// --- Tipe Data ---
interface TransactionDetail {
  id: string;
  quantity: number;
  priceAtTransaction: number;
  subtotal: number;
  product: {
    name: string;
    productCode: string;
  };
}

interface Transaction {
  id: number;
  createdAt: string;
  finalAmount: number;
  totalMargin: number;
  status: "COMPLETED" | "CANCELLED";
  customer: { name: string; phoneNumber: string | null } | null;
  user: { name: string } | null;
  paymentMethod: { name: string } | null;
  details: TransactionDetail[];
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

const API_URL = "/reports/transactions";

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // State Dialog Pembatalan
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<number | null>(
    null
  );

  // State Dialog Detail
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // --- STATE BARU: ASSIGN CUSTOMER ---
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [transactionToAssign, setTransactionToAssign] = useState<number | null>(
    null
  );
  const [customerToAssign, setCustomerToAssign] = useState<Customer | null>(
    null
  );
  const [isAssigning, setIsAssigning] = useState(false);
  // -----------------------------------

  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const [apiQuery, setApiQuery] = useState({
    page: 1,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, { params: apiQuery });
      setTransactions(response.data.data);
      console.log(response.data.data);
      setPaginationInfo(response.data.pagination);
    } catch (error: any) {
      toast.error("Gagal Memuat Laporan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [apiQuery]);

  const handleFilterApply = () => {
    setApiQuery({
      page: 1,
      startDate: date?.from ? format(date.from, "yyyy-MM-dd") : "",
      endDate: date?.to ? format(date.to, "yyyy-MM-dd") : "",
    });
  };

  // --- FUNGSI EXPORT EXCEL ---
  // const handleExport = async () => {
  //   if (transactions.length === 0) {
  //     toast.error("Tidak ada data untuk diekspor");
  //     return;
  //   }

  //   // 1. Format data agar rapi di Excel
  //   // Kita ambil semua data (tanpa pagination) untuk export
  //   // Untuk simplifikasi saat ini, kita export data yang sedang tampil.
  //   // (Idealnya: panggil API lagi tanpa limit untuk download semua)

  //   const exportData = transactions.map((tx) => ({
  //     "ID Transaksi": tx.id,
  //     Tanggal: new Date(tx.createdAt).toLocaleDateString("id-ID"),
  //     Waktu: new Date(tx.createdAt).toLocaleTimeString("id-ID"),
  //     Pelanggan: tx.customer?.name || "Guest",
  //     Kasir: tx.user?.name || "N/A",
  //     "Metode Bayar": tx.paymentMethod?.name || "N/A",
  //     "Total Belanja": tx.finalAmount,
  //     Profit: tx.totalMargin,
  //     Status: tx.status,
  //   }));

  //   // 2. Panggil fungsi download
  //   exportToExcel(
  //     exportData,
  //     `Laporan_Transaksi_${format(new Date(), "yyyy-MM-dd")}`
  //   );
  //   toast.success("Laporan berhasil diunduh");
  // };

const handleExport = async () => {
  // 1. Tampilkan loading toast agar user tahu proses sedang berjalan
  const loadingToast = toast.loading("Menyiapkan data untuk diekspor...");

  try {
    // 2. Panggil API lagi, tapi ambil SEMUA data sesuai filter tanggal
    // Kita kirim parameter limit yang besar (misal 9999) agar semua terambil
    const response = await axios.get(API_URL, { 
      params: { 
        ...apiQuery, 
        limit: 9999, // Ambil semua, bukan hanya 10
        page: 1 
      } 
    });

    const allTransactions = response.data.data;

    if (allTransactions.length === 0) {
      toast.error("Tidak ada data untuk diekspor", { id: loadingToast });
      return;
    }

    // 3. Format data hasil fetch ulang tersebut
    const exportData = allTransactions.map((tx: Transaction) => ({
      "ID Transaksi": tx.id,
      Tanggal: new Date(tx.createdAt).toLocaleDateString("id-ID"),
      Waktu: new Date(tx.createdAt).toLocaleTimeString("id-ID"),
      Pelanggan: tx.customer?.name || "Guest",
      Kasir: tx.user?.name || "N/A",
      "Metode Bayar": tx.paymentMethod?.name || "N/A",
      "Total Belanja": tx.finalAmount,
      Profit: tx.totalMargin,
      Status: tx.status,
    }));

    // 4. Jalankan download
    exportToExcel(
      exportData,
      `Laporan_Transaksi_Lengkap_${format(new Date(), "yyyy-MM-dd")}`
    );

    toast.success("Laporan berhasil diunduh", { id: loadingToast });
  } catch (error) {
    console.error(error);
    toast.error("Gagal mengambil data lengkap untuk ekspor", { id: loadingToast });
  }
};

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;
    setApiQuery((prev) => ({ ...prev, page: newPage }));
  };

  // --- Logic Batal ---
  const onCancelClick = (id: number) => {
    setTransactionToCancel(id);
    setIsCancelDialogOpen(true);
  };

  const confirmCancelTransaction = async () => {
    if (!transactionToCancel) return;
    try {
      await axios.post(`/transactions/${transactionToCancel}/cancel`);
      toast.success("Transaksi dibatalkan");
      fetchTransactions();
    } catch (error: any) {
      toast.error("Gagal membatalkan transaksi");
    } finally {
      setIsCancelDialogOpen(false);
      setTransactionToCancel(null);
    }
  };

  // --- Logic Lihat Detail ---
  const onViewDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };

  // --- Logic Resend WA ---
const handleResendWA = (tx: Transaction) => {
  if (!tx.customer?.phoneNumber) {
    toast.error("Transaksi ini tidak memiliki nomor HP pelanggan.");
    return;
  }

  // --- Format Tanggal & Waktu ---
  const createdAt = new Date(tx.createdAt);
  const dateStr = createdAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = createdAt.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // --- Format Item List with Proper Column ---
  const orderDetails = tx.details
    .map(
      (item, i) =>
        `${i + 1}. ${item.product.name} — ${item.quantity}x Rp ${Number(
          item.priceAtTransaction
        ).toLocaleString("id-ID")}`
    )
    .join("\n");

  // --- Normalisasi Nomor WhatsApp ---
  let phone = tx.customer.phoneNumber.replace(/\D/g, ""); // hapus spasi, -, dll
  if (phone.startsWith("0")) phone = "62" + phone.slice(1);
  if (!phone.startsWith("62")) phone = "62" + phone;

  // --- Deteksi device ---
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const baseUrl = isMobile
    ? "https://api.whatsapp.com/send"
    : "https://web.whatsapp.com/send";

  // --- Template WhatsApp Struk ---
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
Simpan nomor ini untuk promo & katalog terbaru.
IG: @Myperfumeee_`;

  // Kirim ke WhatsApp
  window.open(
    `${baseUrl}?phone=${phone}&text=${encodeURIComponent(message)}`,
    "_blank"
  );
};

  // --- FITUR BARU: HANDLER ASSIGN CUSTOMER ---
  const onAssignClick = (id: number) => {
    setTransactionToAssign(id);
    setCustomerToAssign(null);
    setIsAssignDialogOpen(true);
  };

  const confirmAssignCustomer = async () => {
    if (!transactionToAssign || !customerToAssign) return;

    setIsAssigning(true);
    const process = toast.loading("Memproses...");

    try {
      await axios.put(`/transactions/${transactionToAssign}/assign-customer`, {
        customerId: customerToAssign.id,
      });

      toast.success("Pelanggan berhasil ditautkan & poin ditambahkan.", {
        id: process,
      });

      fetchTransactions();
      setIsAssignDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal update transaksi", {
        id: process,
      });
    } finally {
      setIsAssigning(false);
    }
  };
  // ------------------------------------------

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

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <h1 className="text-3xl font-bold mb-4">Riwayat Transaksi</h1>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full md:w-[300px] justify-start text-left font-normal"
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
        <Button onClick={handleFilterApply}>Terapkan Filter</Button>
        <Button variant="outline" onClick={handleExport} className="ml-auto">
          <Download className="mr-2 h-4 w-4" /> Export Excel
        </Button>
      </div>

      {isLoading ? (
        <ReportLoadingSkeleton />
      ) : (
        <>
          <div className="rounded-md border hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Kasir</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Total Profit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className={
                      tx.status === "CANCELLED" ? "bg-muted/50 opacity-60" : ""
                    }
                  >
                    <TableCell>{formatDate(tx.createdAt)}</TableCell>
                    <TableCell className="font-medium">#{tx.id}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === "COMPLETED" ? "default" : "destructive"
                        }
                      >
                        {tx.status === "COMPLETED" ? "Sukses" : "Batal"}
                      </Badge>
                    </TableCell>

                    {/* Kolom Pelanggan */}
                    <TableCell>
                      {tx.customer ? (
                        tx.customer.name
                      ) : // Jika belum ada pelanggan & status sukses, tampilkan tombol tambah
                      tx.status === "COMPLETED" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => onAssignClick(tx.id)}
                        >
                          <UserPlus className="h-3 w-3" /> Tambah
                        </Button>
                      ) : (
                        "Guest"
                      )}
                    </TableCell>

                    <TableCell>{tx.user?.name || "-"}</TableCell>
                    <TableCell>{tx.paymentMethod?.name || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(tx.totalMargin)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(tx.finalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {tx.status === "COMPLETED" && tx.customer && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:bg-green-50"
                            onClick={() => handleResendWA(tx)}
                            title="Kirim WA"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(tx)}
                          title="Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {tx.status === "COMPLETED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => onCancelClick(tx.id)}
                            title="Batalkan"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View (Simplified for brevity) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {transactions.map((tx) => (
              <Card
                key={tx.id}
                className={
                  tx.status === "CANCELLED" ? "opacity-70 bg-muted/20" : ""
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>#{tx.id}</CardTitle>
                      <CardDescription>
                        {formatDate(tx.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        tx.status === "COMPLETED" ? "default" : "destructive"
                      }
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm pb-2">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(tx.finalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pelanggan</span>
                    <span>
                      {tx.customer ? (
                        tx.customer.name
                      ) : tx.status === "COMPLETED" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => onAssignClick(tx.id)}
                        >
                          + Tambah
                        </Button>
                      ) : (
                        "Guest"
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {tx.status === "COMPLETED" && tx.customer && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:bg-green-50"
                        onClick={() => handleResendWA(tx)}
                        title="Kirim WA"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetail(tx)}
                    >
                      Detail
                    </Button>
                    {tx.status === "COMPLETED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200"
                        onClick={() => onCancelClick(tx.id)}
                      >
                        Batal
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-muted-foreground">
              Total {paginationInfo.totalCount} transaksi
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
                disabled={paginationInfo.currentPage <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
                disabled={
                  paginationInfo.currentPage >= paginationInfo.totalPages ||
                  isLoading
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* --- DIALOG ASSIGN CUSTOMER (BARU) --- */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Tambah Pelanggan
            </DialogTitle>
            <DialogDescription>
              Pilih pelanggan yang sesuai. Sistem akan otomatis memberikan poin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Pelanggan</label>
              <CustomerCombobox onSelectCustomer={setCustomerToAssign} />
            </div>

            {customerToAssign && (
              <div className="border rounded-lg p-4 bg-muted shadow-sm text-sm space-y-1">
                <p className="font-semibold">{customerToAssign.name}</p>
                <p className="text-muted-foreground">
                  📞 {customerToAssign.phoneNumber || "Tidak ada nomor"}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Batal
            </Button>

            <Button
              className="gap-2"
              onClick={confirmAssignCustomer}
              disabled={isAssigning || !customerToAssign}
            >
              {isAssigning && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------- */}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Detail Transaksi #{selectedTransaction?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="mt-4 space-y-6">
              {/* ... (Isi Detail Transaksi SAMA SEPERTI SEBELUMNYA) ... */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTransaction.details.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Stok & poin akan dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelTransaction}
              className="bg-red-600"
            >
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReportLoadingSkeleton() {
  return <div>Loading...</div>;
}
