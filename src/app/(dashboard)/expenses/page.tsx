// frontend/src/app/(dashboard)/expenses/page.tsx
"use client";
import { useState, useEffect, FormEvent } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { format, startOfMonth } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Trash2, Plus, Wallet, Edit, CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const API_URL = "/expenses";

interface Expense {
  id: number;
  name: string;
  amount: string;
  category: string;
  date: string;
  user?: { name: string };
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Filtering state
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [apiQuery, setApiQuery] = useState({
    page: 1,
    limit: 10,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    totalCount: 0, totalPages: 0, currentPage: 1, limit: 10
  });

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", amount: "", category: "Operasional" });

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(API_URL, { params: apiQuery });
      setExpenses(res.data.data);
      if (res.data.pagination) setPaginationInfo(res.data.pagination);
    } catch (error) { toast.error("Gagal memuat data pengeluaran"); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, [apiQuery]);

  const handleFilterApply = () => {
    setApiQuery(prev => ({
      ...prev,
      page: 1,
      startDate: date?.from ? format(date.from, "yyyy-MM-dd") : "",
      endDate: date?.to ? format(date.to, "yyyy-MM-dd") : "",
    }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;
    setApiQuery(prev => ({ ...prev, page: newPage }));
  };

  const openAddModal = () => {
    setSelectedExpense(null);
    setFormData({ name: "", amount: "", category: "Operasional" });
    setIsDialogOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({ 
      name: expense.name, 
      amount: expense.amount.toString(), 
      category: expense.category || "Operasional" 
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return toast.error("Mohon lengkapi data wajib");

    try {
      setIsSubmitting(true);
      if (selectedExpense) {
        // Edit mode
        await axios.put(`${API_URL}/${selectedExpense.id}`, formData);
        toast.success("Pengeluaran berhasil diperbarui");
      } else {
        // Create mode
        await axios.post(API_URL, formData);
        toast.success("Pengeluaran baru dicatat");
      }
      setIsDialogOpen(false);
      fetchExpenses();
    } catch (error) { toast.error("Gagal menyimpan data pengeluaran"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("Data berhasil dihapus");
      fetchExpenses();
    } catch (error) { toast.error("Gagal menghapus data"); }
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary"/> Pengeluaran Terjadwal
          </h1>
          <p className="text-muted-foreground mt-1">Kelola dan lacak riwayat pengeluaran operasional toko Anda.</p>
        </div>
        <Button onClick={openAddModal} className="flex gap-2">
          <Plus className="h-4 w-4"/> Catat Pengeluaran
        </Button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-2 mb-4 bg-muted/30 p-3 rounded-lg border">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full md:w-[300px] justify-start text-left font-normal bg-background hover:bg-muted"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd MMM yy", { locale: dateFnsLocaleId })} -{" "}
                    {format(date.to, "dd MMM yy", { locale: dateFnsLocaleId })}
                  </>
                ) : (
                  format(date.from, "dd MMM yy", { locale: dateFnsLocaleId })
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
        <Button onClick={handleFilterApply} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
          Terapkan Filter
        </Button>
      </div>

      {/* DATA TABLE */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Masa Transaksi</TableHead>
              <TableHead>Keterangan Pengeluaran</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Kasir/Admin</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="text-center w-[120px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/> Memuat data...</TableCell></TableRow>
            ) : expenses.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Tidak ada pengeluaran di dalam rentang waktu ini.</TableCell></TableRow>
            ) : (
              expenses.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">{format(new Date(item.date), "dd MMM yyyy", { locale: dateFnsLocaleId })}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                      {item.category}
                    </span>
                  </TableCell>
                  <TableCell>{item.user?.name || "Sistem"}</TableCell>
                  <TableCell className="text-right text-red-600 font-bold">Rp {Number(item.amount).toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50" onClick={()=>openEditModal(item)} title="Ubah">
                        <Edit className="h-4 w-4"/>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50" onClick={()=>handleDelete(item.id)} title="Hapus">
                        <Trash2 className="h-4 w-4"/>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      {paginationInfo.totalPages > 1 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 p-2 bg-muted/20 border rounded-lg gap-4">
          <span className="text-sm text-muted-foreground ml-2">
            Halaman {paginationInfo.currentPage} dari {paginationInfo.totalPages} (Total {paginationInfo.totalCount} entri)
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(paginationInfo.currentPage - 1)} disabled={paginationInfo.currentPage <= 1 || isLoading}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(paginationInfo.currentPage + 1)} disabled={paginationInfo.currentPage >= paginationInfo.totalPages || isLoading}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* MODAL FORM */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedExpense ? "Ubah Pengeluaran" : "Tambah Pengeluaran Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Keterangan Singkat</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
                placeholder="Cth: Tagihan Listrik PLN" 
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Jumlah Nominal (Rp)</Label>
              <Input 
                type="number" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})} 
                required 
                placeholder="0"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori Pembayaran</Label>
              <Input 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
                required
                className="w-full"
                placeholder="Operasional, Gaji, dll"
              />
            </div>
            <DialogFooter className="pt-4 mt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {selectedExpense ? "Simpan Perubahan" : "Konfirmasi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}