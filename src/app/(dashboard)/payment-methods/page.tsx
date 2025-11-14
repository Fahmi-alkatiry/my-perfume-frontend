// frontend/src/app/(dashboard)/payment-methods/page.tsx

"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2 } from "lucide-react";

// Komponen UI
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Gunakan Textarea untuk deskripsi
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// --- UBAH: Tipe Data ---
interface PaymentMethod {
  id: number;
  name: string;
  description: string | null;
}

// --- UBAH: State Form ---
const defaultFormState = {
  name: "",
  description: "",
};

// --- UBAH: API URL ---
const API_URL = "http://localhost:5000/api/payment-methods";

export default function PaymentMethodsPage() {
  // --- UBAH: State Utama ---
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodToEdit, setMethodToEdit] = useState<PaymentMethod | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(
    null
  );
  // -------------------------

  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [formState, setFormState] = useState(defaultFormState);

  // --- UBAH: Fungsi Fetch ---
  const fetchMethods = async () => {
    setIsLoading(true);
    try {
      // Tidak perlu pagination, ambil semua
      const response = await axios.get(API_URL);
      setMethods(response.data);
    } catch (error) {
      toast.error("Gagal mengambil data metode pembayaran.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  // --- FUNGSI DIALOG (UBAH NAMA STATE) ---
  const handleOpenCreateDialog = () => {
    setMethodToEdit(null);
    setFormState(defaultFormState);
    setIsFormOpen(true);
  };

  const handleOpenEditDialog = (method: PaymentMethod) => {
    setMethodToEdit(method);
    setFormState({
      name: method.name,
      description: method.description || "",
    });
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (method: PaymentMethod) => {
    setMethodToDelete(method);
    setIsDeleteAlertOpen(true);
  };
  // ----------------------------------------

  // Handler form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormState((prev) => ({ ...prev, [id]: value }));
  };

  // --- FUNGSI SUBMIT (UBAH LOGIKA) ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (methodToEdit) {
        await axios.put(`${API_URL}/${methodToEdit.id}`, formState);
        toast.success("Metode berhasil diperbarui.");
      } else {
        await axios.post(API_URL, formState);
        toast.success("Metode baru berhasil ditambahkan.");
      }
      fetchMethods(); // Refresh data
      setIsFormOpen(false);
      setMethodToEdit(null);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Gagal menyimpan metode.";
      toast.error("Gagal", { description: errorMessage });
    }
  };

  // --- FUNGSI HAPUS (UBAH LOGIKA) ---
  const handleDeleteConfirm = async () => {
    if (!methodToDelete) return;
    try {
      await axios.delete(`${API_URL}/${methodToDelete.id}`);
      toast.success(`Metode ${methodToDelete.name} berhasil dihapus.`);
      fetchMethods(); // Refresh data
      setIsDeleteAlertOpen(false);
      setMethodToDelete(null);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Gagal menghapus metode.";
      toast.error("Gagal", { description: errorMessage });
    }
  };
  // ------------------------------

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        {/* --- UBAH: Judul --- */}
        <h1 className="text-3xl font-bold">Metode Pembayaran</h1>
        {/* ----------------- */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full md:w-auto"
              onClick={handleOpenCreateDialog}
            >
              {/* --- UBAH: Teks Tombol --- */}
              Tambah Metode Baru
              {/* ----------------------- */}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              {/* --- UBAH: Judul Dialog --- */}
              <DialogTitle>
                {methodToEdit ? "Edit Metode" : "Tambah Metode Baru"}
              </DialogTitle>
              <DialogDescription>
                Atur metode pembayaran yang tersedia di kasir.
              </DialogDescription>
              {/* --------------------------- */}
            </DialogHeader>

            {/* --- UBAH: Form --- */}
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama
                </Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  placeholder="cth: Tunai"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Keterangan
                </Label>
                <Textarea
                  id="description"
                  value={formState.description || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="cth: Pembayaran via QR Code"
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </DialogClose>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
            {/* -------------------- */}
          </DialogContent>
        </Dialog>
      </div>

      {/* Tidak perlu search/pagination */}

      {/* Konten List (Loading / Data) */}
      {isLoading ? (
        <ReportLoadingSkeleton />
      ) : (
        <>
          {/* Tampilan Tabel (Desktop) */}
          <div className="rounded-md border hidden md:block">
            <Table>
              {/* --- UBAH: Table Header --- */}
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Metode</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              {/* -------------------------- */}
              <TableBody>
                {/* --- UBAH: Table Body --- */}
                {methods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Belum ada metode pembayaran.
                    </TableCell>
                  </TableRow>
                ) : (
                  methods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">
                        {method.name}
                      </TableCell>
                      <TableCell>{method.description}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditDialog(method)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => handleOpenDeleteDialog(method)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {/* ------------------------ */}
              </TableBody>
            </Table>
          </div>

          {/* Tampilan Kartu (Mobile) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {/* --- UBAH: Mobile Card --- */}
            {methods.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Belum ada metode pembayaran.
              </p>
            ) : (
              methods.map((method) => (
                <Card key={method.id}>
                  <CardHeader>
                    <CardTitle>{method.name}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditDialog(method)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleOpenDeleteDialog(method)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
            {/* ------------------------- */}
          </div>
        </>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus{" "}
              <span className="font-medium"> {methodToDelete?.name} </span>
              secara permanen. Metode yang memiliki riwayat transaksi mungkin
              tidak bisa dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ====================================================================
// ================= Komponen Skeleton Loading ========================
// ====================================================================
function ReportLoadingSkeleton() {
  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-5 w-32" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-48" />
              </TableHead>
              <TableHead className="text-right">
                <Skeleton className="h-5 w-20 ml-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}