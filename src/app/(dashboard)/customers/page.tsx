// frontend/src/app/(dashboard)/customers/page.tsx

"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "@/lib/axios";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Search,
  Plus,
  History, // <-- IKON BARU
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
import { ScrollArea } from "@/components/ui/scroll-area"; // <-- ScrollArea

// --- Tipe Data ---
interface LoggedInUser {
  id: number;
  name: string;
  role: "ADMIN" | "CASHIER";
}

interface Customer {
  id: number;
  name: string;
  phoneNumber: string;
  points: number;
}

// --- Tipe Data Riwayat Belanja ---
interface PurchaseHistory {
  id: number;
  createdAt: string;
  finalAmount: number;
  details: {
    quantity: number;
    product: {
      name: string;
    };
  }[];
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

const defaultFormState = { name: "", phoneNumber: "", points: 0 };
const API_URL = "/customers";
const API_URL_AUTH_ME = "/auth/me";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // --- STATE BARU: RIWAYAT ---
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<
    PurchaseHistory[]
  >([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  // ---------------------------

  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );

  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [apiQuery, setApiQuery] = useState({ page: 1, search: "" });
  const [formState, setFormState] = useState(defaultFormState);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(API_URL, { params: apiQuery });
        setCustomers(response.data.data);
        setPaginationInfo(response.data.pagination);
      } catch (error) {
        toast.error("Gagal mengambil data pelanggan.");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(API_URL_AUTH_ME);
        setCurrentUser(res.data);
      } catch (error) {}
    };

    fetchCustomers();
    fetchCurrentUser();
  }, [apiQuery]);

  // --- FUNCTION BARU: LIHAT RIWAYAT ---
  const handleOpenHistory = async (customer: Customer) => {
    setSelectedCustomerName(customer.name);
    setIsHistoryOpen(true);
    setIsLoadingHistory(true);
    setSelectedCustomerHistory([]); // Reset dulu

    try {
      const res = await axios.get(`${API_URL}/${customer.id}/history`);
      setSelectedCustomerHistory(res.data);
    } catch (error) {
      toast.error("Gagal memuat riwayat belanja.");
    } finally {
      setIsLoadingHistory(false);
    }
  };
  // ------------------------------------

  const handleOpenCreateDialog = () => {
    setCustomerToEdit(null);
    setFormState(defaultFormState);
    setIsFormOpen(true);
  };

  const handleOpenEditDialog = (customer: Customer) => {
    setCustomerToEdit(customer);
    setFormState({
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      points: customer.points,
    });
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteAlertOpen(true);
  };

  const normalizePhone = (phone: string) => {
  let cleaned = phone.replace(/[^0-9]/g, ""); // hilangkan spasi/tanda + - .

  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }

  if (cleaned.startsWith("62")) {
    return cleaned;
  }

  return "62" + cleaned;
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState((prev) => ({ ...prev, [id]: value }));
  };


  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  const phoneRegex = /^(^\+?62|0)(\d{9,13})$/;


  const normalized = normalizePhone(formState.phoneNumber);

  if (!phoneRegex.test(normalized)) {
    toast.error("Nomor HP tidak valid!");
    return;
  }

  const payload = { ...formState, phoneNumber: normalized };

  try {
    if (customerToEdit) {
      await axios.put(`${API_URL}/${customerToEdit.id}`, payload);
      toast.success("Pelanggan diperbarui.");
    } else {
      await axios.post(API_URL, payload);
      toast.success("Pelanggan ditambahkan.");
    }

      const response = await axios.get(API_URL, { params: apiQuery });
      setCustomers(response.data.data);
      setIsFormOpen(false);
      setCustomerToEdit(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Gagal menyimpan.";
      toast.error(errorMessage);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await axios.delete(`${API_URL}/${customerToDelete.id}`);
      toast.success("Pelanggan dihapus.");
      const response = await axios.get(API_URL, { params: apiQuery });
      setCustomers(response.data.data);
      setIsDeleteAlertOpen(false);
      setCustomerToDelete(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menghapus.");
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

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <h1 className="text-3xl font-bold">Manajemen Pelanggan</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full md:w-auto"
              onClick={handleOpenCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {customerToEdit ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
              </DialogTitle>
              <DialogDescription>Masukkan data pelanggan.</DialogDescription>
            </DialogHeader>
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
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phoneNumber" className="text-right">
                  No. HP
                </Label>
                <Input
                  id="phoneNumber"
                  value={formState.phoneNumber}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  placeholder="08..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="poin" className="text-right">
                  poin
                </Label>
                <Input
                  id="points"
                  type="number"
                  value={formState.points}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      points: Number(e.target.value),
                    }))
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <Input
          placeholder="Cari nama atau nomor HP..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Cari</Button>
      </form>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
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
                      Data tidak ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell>{customer.phoneNumber}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {customer.points}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* --- TOMBOL HISTORY --- */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenHistory(customer)}
                            title="Lihat Riwayat Belanja"
                          >
                            <History className="h-4 w-4 text-green-600" />
                          </Button>
                          {/* --------------------- */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {currentUser?.role === "ADMIN" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              onClick={() => handleOpenDeleteDialog(customer)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-4 md:hidden">
            {customers.map((customer) => (
              <Card key={customer.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{customer.name}</CardTitle>
                  <CardDescription>{customer.phoneNumber}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Poin Loyalitas
                    </span>
                    <span className="font-bold text-lg text-blue-600">
                      {customer.points}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-2">
                  {/* Tombol History Mobile */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenHistory(customer)}
                  >
                    <History className="h-4 w-4 mr-2 text-green-600" /> Riwayat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(customer)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

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
          </Button>
          <span className="text-sm font-medium">
            Halaman {paginationInfo.currentPage}
          </span>
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

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- DIALOG RIWAYAT BELANJA (BARU) --- */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Riwayat Belanja: {selectedCustomerName}</DialogTitle>
            <DialogDescription>Daftar 20 transaksi terakhir.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 -mr-4">
            {isLoadingHistory ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : selectedCustomerHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Belum ada riwayat belanja.
              </p>
            ) : (
              <div className="space-y-4 py-4">
                {selectedCustomerHistory.map((tx) => (
                  <div key={tx.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                          dateStyle: "medium",
                        })}
                      </span>
                      <span className="font-bold">
                        Rp {tx.finalAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <ul className="space-y-1 bg-muted/50 p-2 rounded">
                      {tx.details.map((item, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{item.product.name}</span>
                          <span className="text-muted-foreground">
                            x{item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {/* ------------------------------------- */}
    </div>
  );
}
