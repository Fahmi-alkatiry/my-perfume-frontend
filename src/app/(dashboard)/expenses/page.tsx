// frontend/src/app/(dashboard)/expenses/page.tsx
"use client";
import { useState, useEffect, FormEvent } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Trash2, Plus, Wallet } from "lucide-react";

const API_URL = "/expenses";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", amount: "", category: "Operasional" });

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(API_URL);
      setExpenses(res.data.data);
    } catch (error) { toast.error("Gagal memuat data"); }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      toast.success("Pengeluaran dicatat");
      setIsDialogOpen(false);
      setFormData({ name: "", amount: "", category: "Operasional" });
      fetchExpenses();
    } catch (error) { toast.error("Gagal menyimpan"); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Hapus data ini?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("Dihapus");
      fetchExpenses();
    } catch (error) { toast.error("Gagal menghapus"); }
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Wallet className="h-8 w-8 text-primary"/> Pengeluaran</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> Catat Pengeluaran</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Pengeluaran</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2"><Label>Keterangan</Label><Input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required placeholder="Cth: Bayar Listrik" /></div>
              <div className="space-y-2"><Label>Jumlah (Rp)</Label><Input type="number" value={formData.amount} onChange={e=>setFormData({...formData, amount: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Kategori</Label><Input value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} /></div>
              <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Keterangan</TableHead><TableHead>Kategori</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
          <TableBody>
            {expenses.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{format(new Date(item.date), "dd/MM/yyyy")}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="text-right text-red-600 font-medium">Rp {Number(item.amount).toLocaleString('id-ID')}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-red-500" onClick={()=>handleDelete(item.id)}><Trash2 className="h-4 w-4"/></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}