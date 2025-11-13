// frontend/src/app/dashboard/customers/page.tsx

"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "@/lib/axios";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

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

// --- UBAH: Tipe Data ---
interface Customer {
  id: number;
  name: string;
  phoneNumber: string;
  points: number;
}
// ----------------------

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// --- UBAH: State Form ---
const defaultFormState = {
  name: "",
  phoneNumber: "",
};
// -----------------------

// --- UBAH: API URL ---
const API_URL = "http://localhost:5000/api/customers";
// --------------------

export default function CustomersPage() {
  // --- UBAH: State Utama ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  // -------------------------

  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    totalCount: 0, totalPages: 0, currentPage: 1, limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [apiQuery, setApiQuery] = useState({ page: 1, search: "" });

  const [formState, setFormState] = useState(defaultFormState);

  // --- UBAH: Fungsi Fetch ---
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: { page: apiQuery.page, search: apiQuery.search, limit: 10 },
      });
      setCustomers(response.data.data);
      setPaginationInfo(response.data.pagination);
    } catch (error) {
      console.error("Gagal mengambil data pelanggan:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // -------------------------

  useEffect(() => {
    fetchCustomers();
  }, [apiQuery]);

  // --- FUNGSI DIALOG (UBAH NAMA STATE) ---
  const handleOpenCreateDialog = () => {
    setCustomerToEdit(null);
    setFormState(defaultFormState);
    setIsFormOpen(true);
  };

  const handleOpenEditDialog = (customer: Customer) => {
    setCustomerToEdit(customer);
    setFormState({ name: customer.name, phoneNumber: customer.phoneNumber }); // Hanya isi field yang bisa diedit
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteAlertOpen(true);
  };
  // ----------------------------------------

  // Handler form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState((prev) => ({ ...prev, [id]: value }));
  };

  // --- FUNGSI SUBMIT (UBAH LOGIKA) ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (customerToEdit) {
        // --- LOGIKA UPDATE (PUT) ---
        await axios.put(`${API_URL}/${customerToEdit.id}`, formState);
      } else {
        // --- LOGIKA CREATE (POST) ---
        await axios.post(API_URL, formState);
      }
      
      fetchCustomers(); // Refresh data
      setIsFormOpen(false);
      setCustomerToEdit(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Gagal menyimpan pelanggan:", error);
      const errorMessage = error.response?.data?.error || "Gagal menyimpan pelanggan.";
      alert(errorMessage); // Tampilkan error spesifik (cth: "Nomor HP sudah terdaftar")
    }
  };

  // --- FUNGSI HAPUS (UBAH LOGIKA) ---
  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    
    try {
      await axios.delete(`${API_URL}/${customerToDelete.id}`);
      fetchCustomers(); // Refresh data
      setIsDeleteAlertOpen(false);
      setCustomerToDelete(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Gagal menghapus pelanggan:", error);
      const errorMessage = error.response?.data?.error || "Gagal menghapus pelanggan.";
      alert(errorMessage); // Tampilkan error (cth: "Tidak bisa dihapus krn punya transaksi")
    }
  };
  // ------------------------------

  // Handler Search & Pagination (TETAP SAMA)
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setApiQuery({ page: 1, search: searchTerm });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;
    setApiQuery((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        {/* --- UBAH: Judul --- */}
        <h1 className="text-2xl font-bold">Manajemen Pelanggan</h1>
        {/* ----------------- */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto" onClick={handleOpenCreateDialog}>
              {/* --- UBAH: Teks Tombol --- */}
              Tambah Pelanggan Baru
              {/* ----------------------- */}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              {/* --- UBAH: Judul Dialog --- */}
              <DialogTitle>
                {customerToEdit ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
              </DialogTitle>
              <DialogDescription>
                {customerToEdit
                  ? "Edit detail pelanggan. Klik simpan untuk menerapkan perubahan."
                  : "Isi detail pelanggan baru."}
              </DialogDescription>
              {/* --------------------------- */}
            </DialogHeader>

            {/* --- UBAH: Form --- */}
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nama</Label>
                <Input id="name" value={formState.name} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phoneNumber" className="text-right">Nomor HP</Label>
                <Input id="phoneNumber" value={formState.phoneNumber} onChange={handleInputChange} className="col-span-3" required placeholder="0812..." />
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Batal</Button>
                </DialogClose>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
            {/* -------------------- */}
          </DialogContent>
        </Dialog>
      </div>

      {/* --- UBAH: Search Bar Placeholder --- */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <Input
          placeholder="Cari nama atau nomor HP..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Cari</Button>
      </form>
      {/* --------------------------------- */}
      
      {/* Konten List (Loading / Data) */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Tampilan Tabel (Desktop) */}
          <div className="rounded-md border hidden md:block">
            <Table>
              {/* --- UBAH: Table Header --- */}
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>Nomor HP</TableHead>
                  <TableHead className="text-right">Poin</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              {/* -------------------------- */}
              <TableBody>
                {/* --- UBAH: Table Body --- */}
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center"> {/* colSpan 4 */}
                      {apiQuery.search ? `Pelanggan "${apiQuery.search}" tidak ditemukan.` : "Belum ada data pelanggan."}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phoneNumber}</TableCell>
                      <TableCell className="text-right">{customer.points}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(customer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleOpenDeleteDialog(customer)}>
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
            {customers.length === 0 ? (
              <p className="text-center text-muted-foreground">
                {apiQuery.search ? `Pelanggan "${apiQuery.search}" tidak ditemukan.` : "Belum ada data pelanggan."}
              </p>
            ) : (
              customers.map((customer) => (
                <Card key={customer.id}>
                  <CardHeader>
                    <CardTitle>{customer.name}</CardTitle>
                    <CardDescription>{customer.phoneNumber}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Poin</span>
                      <span className="font-medium text-lg">{customer.points}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(customer)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleOpenDeleteDialog(customer)}>
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

      {/* Pagination (TETAP SAMA) */}
      <div className="flex justify-between items-center mt-4">
        {/* --- UBAH: Teks Total --- */}
        <span className="text-sm text-muted-foreground">
          Total {paginationInfo.totalCount} pelanggan
        </span>
        {/* ------------------------ */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
            disabled={paginationInfo.currentPage <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-2">Sebelumnya</span>
          </Button>
          <span className="text-sm font-medium">
            Halaman {paginationInfo.currentPage} dari {paginationInfo.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
            disabled={paginationInfo.currentPage >= paginationInfo.totalPages || isLoading}
          >
            <span className="mr-2">Berikutnya</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* --- UBAH: Dialog Konfirmasi Hapus --- */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus pelanggan
              <span className="font-medium"> {customerToDelete?.name} </span>
              secara permanen. Pelanggan yang memiliki riwayat transaksi mungkin tidak bisa dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* ----------------------------------- */}
    </div>
  );
}