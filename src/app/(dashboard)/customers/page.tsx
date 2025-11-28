// frontend/src/app/(dashboard)/customers/page.tsx

"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "@/lib/axios"; // Pastikan import dari @/lib/axios
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Search,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

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
import { Skeleton } from "@/components/ui/skeleton";

// --- Tipe Data User ---
interface LoggedInUser {
  id: number;
  name: string;
  role: "ADMIN" | "CASHIER";
}

// --- Tipe Data Customer ---
interface Customer {
  id: number;
  name: string;
  phoneNumber: string;
  points: number;
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// --- State Form default ---
const defaultFormState = {
  name: "",
  phoneNumber: "",
};

// --- KONSTANTA API (Relative Path) ---
const API_URL = "/api/customers"; // <-- PERBAIKAN PENTING
const API_URL_AUTH_ME = "/api/auth/me";

export default function CustomersPage() {
  // State Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);

  // State Dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // State Aksi
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // State Query
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [apiQuery, setApiQuery] = useState({ page: 1, search: "" });

  // State Form
  const [formState, setFormState] = useState(defaultFormState);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(API_URL, {
          params: apiQuery,
        });
        setCustomers(response.data.data);
        setPaginationInfo(response.data.pagination);
      } catch (error) {
        console.error("Gagal mengambil data pelanggan:", error);
        toast.error("Gagal mengambil data pelanggan.");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(API_URL_AUTH_ME);
        setCurrentUser(res.data);
      } catch (error) {
        // Silent error atau toast kecil
      }
    };

    fetchCustomers();
    fetchCurrentUser();
  }, [apiQuery]);

  // --- HANDLERS ---
  const handleOpenCreateDialog = () => {
    setCustomerToEdit(null);
    setFormState(defaultFormState);
    setIsFormOpen(true);
  };

  const handleOpenEditDialog = (customer: Customer) => {
    setCustomerToEdit(customer);
    setFormState({ name: customer.name, phoneNumber: customer.phoneNumber });
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteAlertOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (customerToEdit) {
        await axios.put(`${API_URL}/${customerToEdit.id}`, formState);
        toast.success("Pelanggan berhasil diperbarui.");
      } else {
        await axios.post(API_URL, formState);
        toast.success("Pelanggan baru berhasil ditambahkan.");
      }
      
      // Refresh logic
      const response = await axios.get(API_URL, { params: apiQuery });
      setCustomers(response.data.data);
      setPaginationInfo(response.data.pagination);
      
      setIsFormOpen(false);
      setCustomerToEdit(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Gagal menyimpan pelanggan.";
      toast.error(errorMessage);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await axios.delete(`${API_URL}/${customerToDelete.id}`);
      toast.success("Pelanggan berhasil dihapus.");
      
      // Refresh logic
      const response = await axios.get(API_URL, { params: apiQuery });
      setCustomers(response.data.data);
      setPaginationInfo(response.data.pagination);

      setIsDeleteAlertOpen(false);
      setCustomerToDelete(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Gagal menghapus pelanggan.";
      toast.error(errorMessage);
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setApiQuery({ page: 1, search: searchTerm });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;
    setApiQuery((prev) => ({ ...prev, page: newPage }));
  };

  // --- RENDER ---
  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <h1 className="text-3xl font-bold">Manajemen Pelanggan</h1>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto" onClick={handleOpenCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {customerToEdit ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
              </DialogTitle>
              <DialogDescription>
                {customerToEdit
                  ? "Perbarui data pelanggan di bawah ini."
                  : "Masukkan data pelanggan baru untuk loyalitas poin."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nama</Label>
                <Input 
                  id="name" 
                  value={formState.name} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phoneNumber" className="text-right">No. HP</Label>
                <Input 
                  id="phoneNumber" 
                  value={formState.phoneNumber} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                  required 
                  placeholder="08..." 
                />
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Batal</Button>
                </DialogClose>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="Cari nama atau nomor HP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            />
        </div>
        <Button type="submit">Cari</Button>
      </form>
      
      {/* Konten */}
      {isLoading ? (
        <DashboardLoadingSkeleton isAdmin={currentUser?.role === 'ADMIN'} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="rounded-md border hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>Nomor HP</TableHead>
                  <TableHead className="text-right">Poin</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      {apiQuery.search ? `Pelanggan "${apiQuery.search}" tidak ditemukan.` : "Belum ada data pelanggan."}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phoneNumber}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{customer.points}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(customer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {currentUser?.role === "ADMIN" && (
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleOpenDeleteDialog(customer)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {customers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {apiQuery.search ? "Tidak ditemukan." : "Belum ada pelanggan."}
              </p>
            ) : (
              customers.map((customer) => (
                <Card key={customer.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{customer.name}</CardTitle>
                    <CardDescription>{customer.phoneNumber}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Poin Loyalitas</span>
                      <span className="font-bold text-lg text-blue-600">{customer.points}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(customer)}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    {currentUser?.role === "ADMIN" && (
                      <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleOpenDeleteDialog(customer)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Hapus
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-muted-foreground">
          Total {paginationInfo.totalCount} pelanggan
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
            disabled={paginationInfo.currentPage <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Sebelumnya</span>
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
            <span className="hidden sm:inline mr-2">Berikutnya</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pelanggan <span className="font-bold">{customerToDelete?.name}</span> akan dihapus permanen.
              <br /><br />
              <span className="text-red-500 text-xs">Catatan: Pelanggan yang sudah memiliki riwayat transaksi mungkin tidak dapat dihapus demi integritas data.</span>
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
    </div>
  );
}

// --- Skeleton Component ---
function DashboardLoadingSkeleton({ isAdmin }: { isAdmin: boolean | undefined }) {
    return (
      <div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-full md:w-40" />
        </div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="rounded-md border hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Mobile Skeleton */}
        <div className="md:hidden space-y-4">
            {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
        </div>
      </div>
    );
  }