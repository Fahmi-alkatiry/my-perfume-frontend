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
} from "@/components/ui/dialog"; // <-- Dialog Detail
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
import { Loader2, CalendarIcon, ChevronLeft, ChevronRight, Ban, Eye } from "lucide-react";

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
  customer: { name: string } | null;
  user: { name: string } | null;
  paymentMethod: { name: string } | null;
  details: TransactionDetail[]; // <-- BARU: Data detail barang
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

const API_URL = "/reports/transactions";

// ====================================================================
// ================= Halaman Riwayat Transaksi ========================
// ====================================================================
export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Dialog Pembatalan
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<number | null>(null);

  // --- BARU: State Dialog Detail ---
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  // --------------------------------

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

  // --- Fetch Data ---
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, { params: apiQuery });
      setTransactions(response.data.data);
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

  // --- Handlers ---
  const handleFilterApply = () => {
    setApiQuery({
      page: 1,
      startDate: date?.from ? format(date.from, "yyyy-MM-dd") : "",
      endDate: date?.to ? format(date.to, "yyyy-MM-dd") : "",
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;
    setApiQuery((prev) => ({ ...prev, page: newPage }));
  };

  // Handler Batal
  const onCancelClick = (id: number) => {
    setTransactionToCancel(id);
    setIsCancelDialogOpen(true);
  };

  const confirmCancelTransaction = async () => {
    if (!transactionToCancel) return;
    try {
      await axios.post(`g/transactions/${transactionToCancel}/cancel`);
      toast.success("Transaksi berhasil dibatalkan");
      fetchTransactions();
    } catch (error: any) {
      toast.error("Gagal membatalkan transaksi");
    } finally {
      setIsCancelDialogOpen(false);
      setTransactionToCancel(null);
    }
  };

  // --- BARU: Handler Lihat Detail ---
  const onViewDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };
  // ----------------------------------

  // Utility
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
      <p className="mb-6 text-muted-foreground">
        Lihat detail dan kelola riwayat transaksi toko.
      </p>

      {/* Filter Bar (TETAP SAMA) */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className="w-full md:w-[300px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>{format(date.from, "LLL dd, y", { locale: dateFnsLocaleId })} - {format(date.to, "LLL dd, y", { locale: dateFnsLocaleId })}</>
                ) : format(date.from, "LLL dd, y", { locale: dateFnsLocaleId })
              ) : <span>Pilih rentang tanggal</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={dateFnsLocaleId} />
          </PopoverContent>
        </Popover>
        <Button onClick={handleFilterApply}>Terapkan Filter</Button>
      </div>

      {/* Konten */}
      {isLoading ? (
        <ReportLoadingSkeleton />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="rounded-md border hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className={tx.status === 'CANCELLED' ? "bg-muted/50 opacity-60" : ""}>
                    <TableCell>{formatDate(tx.createdAt)}</TableCell>
                    <TableCell className="font-medium">#{tx.id}</TableCell>
                    <TableCell>
                      <Badge variant={tx.status === 'COMPLETED' ? 'default' : 'destructive'}>
                        {tx.status === 'COMPLETED' ? 'Sukses' : 'Dibatalkan'}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.customer?.name || "Guest"}</TableCell>
                    <TableCell>{tx.paymentMethod?.name || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(tx.finalAmount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* --- TOMBOL DETAIL --- */}
                        <Button variant="outline" size="sm" onClick={() => onViewDetail(tx)}>
                          <Eye className="h-4 w-4 mr-1" /> Detail
                        </Button>
                        
                        {/* Tombol Batal */}
                        {tx.status === 'COMPLETED' && (
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => onCancelClick(tx.id)}>
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

          {/* Mobile Cards (Updated) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
             {transactions.map((tx) => (
                <Card key={tx.id} className={tx.status === 'CANCELLED' ? "opacity-70 bg-muted/20" : ""}>
                  {/* ... (Header Card sama) ... */}
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>#{tx.id}</CardTitle>
                            <CardDescription>{formatDate(tx.createdAt)}</CardDescription>
                        </div>
                        <Badge variant={tx.status === 'COMPLETED' ? 'default' : 'destructive'}>
                            {tx.status === 'COMPLETED' ? 'Sukses' : 'Batal'}
                        </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm pb-2">
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(tx.finalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pelanggan</span>
                      <span>{tx.customer?.name || "Guest"}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                       <Button variant="outline" size="sm" onClick={() => onViewDetail(tx)}>
                          <Eye className="h-4 w-4 mr-2" /> Detail
                       </Button>
                       {tx.status === 'COMPLETED' && (
                          <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => onCancelClick(tx.id)}>
                              Batalkan
                          </Button>
                       )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Pagination (TETAP SAMA) */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-muted-foreground">Total {paginationInfo.totalCount} transaksi</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(paginationInfo.currentPage - 1)} disabled={paginationInfo.currentPage <= 1 || isLoading}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Hal {paginationInfo.currentPage}</span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(paginationInfo.currentPage + 1)} disabled={paginationInfo.currentPage >= paginationInfo.totalPages || isLoading}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* --- DIALOG DETAIL TRANSAKSI (BARU) --- */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detail Transaksi #{selectedTransaction?.id}</DialogTitle>
            <DialogDescription>
              Waktu: {selectedTransaction ? formatDate(selectedTransaction.createdAt) : '-'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="mt-4 space-y-6">
              {/* Info Header */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pelanggan</p>
                  <p className="font-medium">{selectedTransaction.customer?.name || "Guest"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kasir</p>
                  <p className="font-medium">{selectedTransaction.user?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Metode Bayar</p>
                  <p className="font-medium">{selectedTransaction.paymentMethod?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedTransaction.status === 'COMPLETED' ? 'default' : 'destructive'}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
              </div>

              {/* Tabel Item */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Harga Satuan</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTransaction.details?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">{item.product.productCode}</p>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(item.priceAtTransaction))}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(Number(item.subtotal))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Footer Total */}
              <div className="flex justify-end text-lg font-bold">
                <span>Total Akhir: {formatCurrency(selectedTransaction.finalAmount)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Pembatalan (Tetap Sama) */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Transaksi Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Stok produk dan poin akan dikembalikan. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelTransaction} className="bg-red-600 hover:bg-red-700">
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

// Skeleton (Tetap Sama)
function ReportLoadingSkeleton() {
  return ( <div>Loading...</div> ); // Bisa gunakan skeleton yang lama
}