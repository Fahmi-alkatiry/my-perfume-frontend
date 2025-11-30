// frontend/src/app/(dashboard)/vouchers/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";
import {
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Voucher {
  id: number;
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  minPurchase: number;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

const defaultFormState = {
  code: "",
  type: "FIXED",
  value: 0,
  minPurchase: 0,
  maxDiscount: 0,
  startDate: new Date(),
  endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Default 1 bulan
  usageLimit: 100,
  isActive: true
};

const API_URL = "/vouchers";

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  const [voucherToEdit, setVoucherToEdit] = useState<Voucher | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);
  
  const [formState, setFormState] = useState<any>(defaultFormState);

  // Fetch Data
  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(API_URL);
      setVouchers(res.data);
    } catch (error) {
      toast.error("Gagal memuat data voucher");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // Handlers
  const handleOpenCreate = () => {
    setVoucherToEdit(null);
    setFormState(defaultFormState);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: Voucher) => {
    setVoucherToEdit(v);
    setFormState({
      ...v,
      startDate: new Date(v.startDate),
      endDate: new Date(v.endDate),
      maxDiscount: v.maxDiscount || 0
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (v: Voucher) => {
    setVoucherToDelete(v);
    setIsDeleteAlertOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formState };
      if (voucherToEdit) {
        await axios.put(`${API_URL}/${voucherToEdit.id}`, payload);
        toast.success("Voucher diperbarui");
      } else {
        await axios.post(API_URL, payload);
        toast.success("Voucher dibuat");
      }
      fetchVouchers();
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menyimpan");
    }
  };

  const handleDelete = async () => {
    if (!voucherToDelete) return;
    try {
      await axios.delete(`${API_URL}/${voucherToDelete.id}`);
      toast.success("Voucher dihapus");
      fetchVouchers();
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast.error("Gagal menghapus");
    }
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="h-8 w-8 text-primary" /> Manajemen Voucher
          </h1>
          <p className="text-muted-foreground">Buat kode promo untuk pelanggan.</p>
        </div>
        <Button onClick={handleOpenCreate}><Plus className="mr-2 h-4 w-4"/> Buat Voucher</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Nilai</TableHead>
              <TableHead>Masa Berlaku</TableHead>
              <TableHead>Terpakai / Kuota</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
            ) : vouchers.length === 0 ? (
               <TableRow><TableCell colSpan={7} className="h-24 text-center">Belum ada voucher.</TableCell></TableRow>
            ) : (
              vouchers.map((v) => (
                <TableRow key={v.id} className={!v.isActive ? "opacity-50 bg-muted" : ""}>
                  <TableCell className="font-bold font-mono">{v.code}</TableCell>
                  <TableCell>{v.type === "FIXED" ? "Nominal" : "Persen"}</TableCell>
                  <TableCell>
                    {v.type === "FIXED" ? `Rp ${Number(v.value).toLocaleString('id-ID')}` : `${v.value}%`}
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(v.startDate), "dd MMM")} - {format(new Date(v.endDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>{v.usedCount} / {v.usageLimit}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {v.isActive ? "Aktif" : "Non-Aktif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(v)}><Pencil className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleOpenDelete(v)}><Trash2 className="h-4 w-4"/></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{voucherToEdit ? "Edit Voucher" : "Buat Voucher Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Kode Voucher</Label>
                    <Input value={formState.code} onChange={e => setFormState({...formState, code: e.target.value.toUpperCase()})} placeholder="CTH: DISKON10" required />
                </div>
                <div className="space-y-2">
                    <Label>Tipe Diskon</Label>
                    <Select value={formState.type} onValueChange={v => setFormState({...formState, type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="FIXED">Nominal (Rp)</SelectItem>
                            <SelectItem value="PERCENTAGE">Persen (%)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Nilai {formState.type === "FIXED" ? "(Rp)" : "(%)"}</Label>
                    <Input type="number" value={formState.value} onChange={e => setFormState({...formState, value: e.target.value})} required />
                </div>
                <div className="space-y-2">
                    <Label>Min. Belanja (Rp)</Label>
                    <Input type="number" value={formState.minPurchase} onChange={e => setFormState({...formState, minPurchase: e.target.value})} />
                </div>
            </div>

            {formState.type === "PERCENTAGE" && (
                <div className="space-y-2">
                    <Label>Maks. Potongan (Rp) <span className="text-xs text-muted-foreground">(Opsional)</span></Label>
                    <Input type="number" value={formState.maxDiscount} onChange={e => setFormState({...formState, maxDiscount: e.target.value})} placeholder="0 = Tanpa Batas" />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                    <Label>Tanggal Mulai</Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant={"outline"} className="pl-3 text-left font-normal"><CalendarIcon className="ml-auto h-4 w-4 opacity-50" />{format(formState.startDate, "P", { locale: dateFnsLocaleId })}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={formState.startDate} onSelect={d => d && setFormState({...formState, startDate: d})} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2 flex flex-col">
                    <Label>Tanggal Berakhir</Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant={"outline"} className="pl-3 text-left font-normal"><CalendarIcon className="ml-auto h-4 w-4 opacity-50" />{format(formState.endDate, "P", { locale: dateFnsLocaleId })}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={formState.endDate} onSelect={d => d && setFormState({...formState, endDate: d})} initialFocus /></PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
                 <div className="space-y-2">
                    <Label>Kuota (Batas Pakai)</Label>
                    <Input type="number" value={formState.usageLimit} onChange={e => setFormState({...formState, usageLimit: e.target.value})} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                    <Switch checked={formState.isActive} onCheckedChange={c => setFormState({...formState, isActive: c})} />
                    <Label>Status Aktif</Label>
                </div>
            </div>

            <DialogFooter>
                <Button type="submit">Simpan Voucher</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DELETE */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Hapus Voucher?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600">Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}