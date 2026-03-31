// frontend/src/app/(dashboard)/store-cash/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Store, Banknote, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface StoreCashHistory {
  id: number;
  amount: string; // Prisma Decimal returns as string
  type: "IN" | "OUT";
  description: string;
  transactionId: number | null;
  createdAt: string;
}

interface StoreCashData {
  balance: number;
  history: StoreCashHistory[];
}

export default function StoreCashPage() {
  const [storeCash, setStoreCash] = useState<StoreCashData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States untuk form penarikan
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const fetchStoreCash = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/store-cash");
      setStoreCash(res.data);
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal memuat data Dana Cadangan Toko.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreCash();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !withdrawReason) {
      toast.error("Harap isi nominal dan keterangan");
      return;
    }

    try {
      setIsWithdrawing(true);
      await axios.post("/store-cash/use", {
        amount: Number(withdrawAmount),
        description: withdrawReason,
      });

      toast.success("Berhasil menarik dana cadangan!");
      setIsWithdrawOpen(false);
      setWithdrawAmount("");
      setWithdrawReason("");
      
      // Refresh list
      fetchStoreCash();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menarik dana");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-[200px] w-full max-w-md rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Banknote className="h-8 w-8 text-blue-600" />
            Dana Cadangan Toko
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola saldo keamanan kas yang disisihkan 20% dari total keuntungan tiap transaksi sukses.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {/* Card Total Saldo */}
        <Card className="bg-blue-50/80 border-blue-200 md:col-span-1 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-blue-800 flex justify-between items-center">
              Total Dana Tersedia
              <Store className="h-5 w-5 text-blue-700" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-blue-900 mb-4 tracking-tight">
              {formatCurrency(storeCash?.balance || 0)}
            </div>

            <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white shadow-md">
                  Tarik Dana / Gunakan Modal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tarik Dana Cadangan Toko</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleWithdraw} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Nominal Penarikan</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Contoh: 50000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Keterangan / Tujuan</Label>
                    <Input
                      id="reason"
                      placeholder="Contoh: Beli bibit parfum, Biaya listrik, dll"
                      value={withdrawReason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                      required
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsWithdrawOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isWithdrawing} className="bg-blue-700 hover:bg-blue-800">
                      {isWithdrawing ? "Memproses..." : "Tarik Sekarang"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Info Card Tambahan */}
        <Card className="md:col-span-2 shadow-sm flex items-center p-6 bg-slate-50 border-dashed">
          <div className="text-sm text-slate-600 space-y-2">
            <p><strong>Kenapa menggunakan dana cadangan?</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Membangun *safety net* operasional secara otomatis untuk menghindari kehabisan kas.</li>
              <li>20% dari total margin bersih penjualan disisihkan secara sistem setiap transaksi selesai.</li>
              <li>Dana disarankan hanya ditarik untuk keperluan darurat inflasi, beli suplai tambahan, atau investasi barang lambat terjual.</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Tabel Riwayat */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Riwayat Mutasi Saldo (10 Terakhir)</CardTitle>
          <CardDescription>
            Menampilkan aktivitas Pemasukan (dari 20% order) dan Pengeluaran (Tarik Manual).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {storeCash?.history && storeCash.history.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead># Trx Referensi</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storeCash.history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(record.createdAt), "dd MMM yyyy, HH:mm", {
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell>
                        {record.type === "IN" ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <ArrowDownCircle className="h-4 w-4" /> Masuk
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <ArrowUpCircle className="h-4 w-4" /> Keluar
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>
                        {record.transactionId ? `TRX-${record.transactionId}` : "-"}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${record.type === "IN" ? "text-green-600" : "text-red-600"}`}>
                        {record.type === "IN" ? "+" : "-"} {formatCurrency(record.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
              Belum ada riwayat pergerakan dana cadangan toko.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
