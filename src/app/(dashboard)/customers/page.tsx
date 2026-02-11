// frontend/src/app/(dashboard)/customers/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "@/lib/axios";
import {
  Pencil,
  Trash2,
  Search,
  Plus,
  History,
  RefreshCcw,
  ArrowUpRight, // Ikon Poin Masuk
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight, // Ikon Poin Keluar
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // <-- IMPORT TABS
import { PaginationBar } from "@/components/products/PaginationBar";

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
  rfmSegment?: string;
  lastAnalysisDate?: string;
}

// Tipe Riwayat Belanja
interface PurchaseHistory {
  id: number;
  createdAt: string;
  finalAmount: number;
  details: { quantity: number; product: { name: string } }[];
}

// --- TIPE BARU: Riwayat Poin ---
interface PointLog {
  id: number;
  createdAt: string;
  pointsChange: number;
  reason: string;
  transactionId: number | null;
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
const API_URL_RFM = "/rfm/analyze";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // --- STATE RIWAYAT ---
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");

  // Data Belanja
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<
    PurchaseHistory[]
  >([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Data Poin (BARU)
  const [pointLogs, setPointLogs] = useState<PointLog[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);

  // CRUD State
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  // Query State
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [apiQuery, setApiQuery] = useState({ page: 1, search: "" });
  const [formState, setFormState] = useState(defaultFormState);

  // --- Fetch Data Utama ---
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: {
          ...apiQuery,
          sort: "createdAt",
          order: "desc",
        },
      });

      setCustomers(response.data.data);
      setPaginationInfo(response.data.pagination);
    } catch (error) {
      toast.error("Gagal mengambil data pelanggan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(API_URL_AUTH_ME);
        setCurrentUser(res.data);
      } catch {}
    };
    fetchCustomers();
    fetchCurrentUser();
  }, [apiQuery]);

  // --- Handlers ---
  const handleAnalyzeRFM = async () => {
    setIsLoading(true);
    try {
      await axios.post(API_URL_RFM);
      toast.success("Analisis Selesai!");
      fetchCustomers();
    } catch {
      toast.error("Gagal menganalisis.");
      setIsLoading(false);
    }
  };

  // Buka Dialog History (Load data belanja dulu)
  const handleOpenHistory = async (customer: Customer) => {
    setSelectedCustomerName(customer.name);
    setIsHistoryOpen(true);

    // Load Purchase History
    setIsLoadingHistory(true);
    setSelectedCustomerHistory([]);
    try {
      const res = await axios.get(`${API_URL}/${customer.id}/history`);
      setSelectedCustomerHistory(res.data);
    } catch {
      toast.error("Gagal memuat riwayat belanja.");
    } finally {
      setIsLoadingHistory(false);
    }

    // Load Point History (BARU)
    setIsLoadingPoints(true);
    setPointLogs([]);
    try {
      const res = await axios.get(`${API_URL}/${customer.id}/points`);
      setPointLogs(res.data);
    } catch {
      console.error("Gagal load poin");
    } finally {
      setIsLoadingPoints(false);
    }
  };

  // ... (Handler CRUD Lainnya: Create, Edit, Delete sama seperti sebelumnya) ...
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState((prev) => ({ ...prev, [id]: value }));
  };

  const normalizePhone = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) cleaned = "62" + cleaned.substring(1);
    if (cleaned.startsWith("62")) return cleaned;
    return "62" + cleaned;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^(^\+?62|0)(\d{9,13})$/;
    const normalized = normalizePhone(formState.phoneNumber);
    if (!phoneRegex.test(normalized)) {
      toast.error("Nomor HP tidak valid!");
      return;
    }
    try {
      const payload = {
        ...formState,
        phoneNumber: normalized,
        points: Number(formState.points),
      };
      if (customerToEdit) {
        await axios.put(`${API_URL}/${customerToEdit.id}`, payload);
        toast.success("Diperbarui.");
      } else {
        await axios.post(API_URL, payload);
        toast.success("Ditambahkan.");
      }
      fetchCustomers();
      setIsFormOpen(false);
      setCustomerToEdit(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menyimpan.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await axios.delete(`${API_URL}/${customerToDelete.id}`);
      toast.success("Dihapus.");
      fetchCustomers();
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
      {/* Header & Search (Sama) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <h1 className="text-3xl font-bold">Manajemen Pelanggan</h1>
        <div className="flex gap-2">
          {currentUser?.role === "ADMIN" && (
            <Button variant="outline" onClick={handleAnalyzeRFM}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Update Status
            </Button>
          )}
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
          </Button>
        </div>
      </div>
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Cari</Button>
      </form>

      {/* Tabel Pelanggan (Sama) */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="rounded-md border hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>No HP</TableHead>
                  <TableHead className="text-right">Poin</TableHead>
                  <TableHead>Segmen</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Data tidak ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.phoneNumber}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {c.points}
                      </TableCell>
                      <TableCell>
                        {c.rfmSegment ? <Badge>{c.rfmSegment}</Badge> : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenHistory(c)}
                            title="Riwayat"
                          >
                            <History className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {currentUser?.role === "ADMIN" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              onClick={() => handleOpenDeleteDialog(c)}
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
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {customers.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <CardDescription>{c.phoneNumber}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between">
                    <span>Poin</span>
                    <span className="font-bold text-blue-600">{c.points}</span>
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenHistory(c)}
                  >
                    <History className="h-4 w-4 mr-2" /> Riwayat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(c)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => handleOpenDeleteDialog(c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pagination & Dialogs */}
<PaginationBar
  paginationInfo={paginationInfo}
  isLoading={isLoading}
  onPageChange={handlePageChange}
/>

      {/* --- DIALOG FORM CREATE/EDIT --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{customerToEdit ? "Edit" : "Tambah"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nama</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>HP</Label>
              <Input
                id="phoneNumber"
                value={formState.phoneNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Poin</Label>
              <Input
                id="points"
                type="number"
                value={formState.points}
                onChange={handleInputChange}
              />
            </div>

            <DialogFooter>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus?</AlertDialogTitle>
            <AlertDialogDescription>Permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- DIALOG RIWAYAT (TAB) --- */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedCustomerName}</DialogTitle>
            <DialogDescription>Riwayat aktivitas pelanggan.</DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="purchase"
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="purchase">Riwayat Belanja</TabsTrigger>
              <TabsTrigger value="points">Log Poin</TabsTrigger>
            </TabsList>

            {/* TAB 1: BELANJA */}
            <TabsContent
              value="purchase"
              className="flex-1 overflow-auto pr-2 mt-2"
            >
              {isLoadingHistory ? (
                <div className="py-4 space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : selectedCustomerHistory.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Belum ada belanja.
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedCustomerHistory.map((tx) => (
                    <div key={tx.id} className="border rounded-lg p-3 text-sm">
                      <div className="flex justify-between mb-2 border-b pb-2">
                        <span className="text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                            dateStyle: "medium",
                          })}
                        </span>
                        <span className="font-bold">
                          Rp {tx.finalAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <ul className="space-y-1">
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
            </TabsContent>

            {/* TAB 2: LOG POIN */}
            <TabsContent
              value="points"
              className="flex-1 overflow-auto pr-2 mt-2"
            >
              {isLoadingPoints ? (
                <div className="py-4 space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : pointLogs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Belum ada riwayat poin.
                </p>
              ) : (
                <div className="space-y-2">
                  {pointLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0 p-2"
                    >
                      <div>
                        <p className="font-medium text-sm">{log.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div
                        className={`flex items-center font-bold ${
                          log.pointsChange > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {log.pointsChange > 0 ? (
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 mr-1" />
                        )}
                        {log.pointsChange > 0 ? "+" : ""}
                        {log.pointsChange}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
