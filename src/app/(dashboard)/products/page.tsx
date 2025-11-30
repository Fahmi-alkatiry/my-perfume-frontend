// frontend/src/app/(dashboard)/products/page.tsx

"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "@/lib/axios"; // Pastikan ini dari /lib/axios
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  PlusSquare,
} from "lucide-react";

// Komponen UI
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// --- Tipe Data Produk ---
interface Product {
  id: number;
  name: string;
  type: "PERFUME" | "BOTTLE";
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  productCode: string;
  description?: string;
  minimumStock?: number;
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
  type: "PERFUME" as "PERFUME" | "BOTTLE",
  stock: 0,
  purchasePrice: 0,
  sellingPrice: 0,
  productCode: "",
  description: "",
  minimumStock: 5,
};

const API_URL = "/products"; // Path relatif
const API_URL_AUTH_ME = "/auth/me";

// ====================================================================
// ================= Halaman Utama Produk =============================
// ====================================================================
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);

  // State untuk data aksi
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToRestock, setProductToRestock] = useState<Product | null>(
    null
  );
  const [stockToAdd, setStockToAdd] = useState<number>(0);

  // State untuk user
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);

  // State untuk query
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [apiQuery, setApiQuery] = useState({ page: 1, search: "" });

  // State untuk form Create/Edit
  const [formState, setFormState] = useState(defaultFormState);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: apiQuery,
      });
      setProducts(response.data.data);
      setPaginationInfo(response.data.pagination);
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
      toast.error("Gagal mengambil data produk.");
    } finally {
      setIsLoading(false);
    }
  };

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(API_URL_AUTH_ME);
        setCurrentUser(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data user");
      }
    };

  // --- Fungsi Fetch Data ---
  useEffect(() => {
  
    fetchProducts();
    fetchCurrentUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiQuery]);

  // --- Handler Pembuka Dialog ---
  const handleOpenCreateDialog = () => {
    setProductToEdit(null);
    setFormState(defaultFormState);
    setIsFormOpen(true);
  };

  const handleOpenEditDialog = (product: Product) => {
    setProductToEdit(product);
   setFormState({
      name: product.name,
      type: product.type,
      stock: product.stock,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      productCode: product.productCode,
      description: product.description || "", // Jaga-jaga jika undefined
      minimumStock: product.minimumStock || 0, // Jaga-jaga jika undefined
    });
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteAlertOpen(true);
  };

  const handleOpenStockDialog = (product: Product) => {
    setProductToRestock(product);
    setStockToAdd(0);
    setIsStockDialogOpen(true);
  };

  // --- Handler Input Form ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    const isNumberField = [
      "stock",
      "purchasePrice",
      "sellingPrice",
      "minimumStock",
    ].includes(id);
    setFormState((prev) => ({
      ...prev,
      [id]: isNumberField ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (value: "PERFUME" | "BOTTLE") => {
    setFormState((prev) => ({ ...prev, type: value }));
  };

  // --- Handler Aksi (Submit) ---
  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  try {
    if (productToEdit) {
      await axios.put(`${API_URL}/${productToEdit.id}`, formState);
      toast.success("Produk berhasil diperbarui.");
    } else {
      await axios.post(API_URL, formState);
      toast.success("Produk baru berhasil ditambahkan.");
    }

    setIsFormOpen(false);
    setProductToEdit(null);
    fetchProducts();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    toast.error("Gagal", {
      description: error.response?.data?.error || "Gagal menyimpan produk.",
    });
  }
};


const handleDeleteConfirm = async () => {
  if (!productToDelete) return;

  try {
    await axios.delete(`${API_URL}/${productToDelete.id}`);
    toast.success(`Produk ${productToDelete.name} berhasil dihapus.`);
    setIsDeleteAlertOpen(false);
    fetchProducts();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    toast.error("Gagal", {
      description: error.response?.data?.error || "Gagal menghapus produk.",
    });
  }
};
const handleStockSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!productToRestock || stockToAdd <= 0) {
    toast.error("Jumlah stok tidak valid.");
    return;
  }

  try {
    await axios.post(`${API_URL}/${productToRestock.id}/add-stock`, {
      quantity: stockToAdd,
    });

    toast.success(`Stok ${productToRestock.name} berhasil ditambah.`);
    setIsStockDialogOpen(false);
    fetchProducts();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    toast.error("Gagal", {
      description: error.response?.data?.error || "Gagal menambah stok.",
    });
  }
};

  // --- Handler Query ---
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setApiQuery({ ...apiQuery, page: 1, search: searchTerm });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paginationInfo.totalPages) return;
    setApiQuery((prev) => ({ ...prev, page: newPage }));
  };

  // --- RENDER (JSX) ---
  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <h1 className="text-3xl font-bold">Manajemen Produk</h1>
        {/* Hanya Admin yang bisa menambah produk baru */}
        {currentUser?.role === "ADMIN" && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full md:w-auto"
                onClick={handleOpenCreateDialog}
              >
                Tambah Produk Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {productToEdit ? "Edit Produk" : "Tambah Produk Baru"}
                </DialogTitle>
                <DialogDescription>
                  {productToEdit
                    ? "Edit detail produk. Klik simpan untuk menerapkan perubahan."
                    : "Isi detail produk yang akan dijual."}
                </DialogDescription>
              </DialogHeader>

              {/* Form Create/Edit */}
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
                  <Label htmlFor="productCode" className="text-right">
                    Kode Produk
                  </Label>
                  <Input
                    id="productCode"
                    value={formState.productCode}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Deskripsi
                  </Label>
                  <Textarea
                    id="description"
                    value={formState.description || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="Catatan atau detail produk..."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Jenis
                  </Label>
                  <Select
                    onValueChange={handleSelectChange}
                    value={formState.type}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih jenis produk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERFUME">Perfume</SelectItem>
                      <SelectItem value="BOTTLE">Botol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">
                    Stok
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formState.stock}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div> */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="minimumStock" className="text-right">
                    Stok Min.
                  </Label>
                  <Input
                    id="minimumStock"
                    type="number"
                    value={formState.minimumStock || 0}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>

                {/* --- SEMBUNYIKAN FORM HARGA BELI --- */}
                {currentUser?.role === "ADMIN" && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="purchasePrice" className="text-right">
                      Harga Beli
                    </Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      value={formState.purchasePrice}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sellingPrice" className="text-right">
                    Harga Jual
                  </Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    value={formState.sellingPrice}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
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
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
  <Input
    placeholder="Cari nama atau kode produk..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="flex-1"
  />
  <Button type="submit">Cari</Button>
</form>

      {/* Konten List (Loading / Data) */}
      {isLoading ? (
        <DashboardLoadingSkeleton isAdmin={currentUser?.role === "ADMIN"} />
      ) : (
        <>
          {/* --- SEMBUNYIKAN KOLOM HARGA BELI --- */}
          <div className="rounded-md border hidden md:block">
            <Table>
              <TableHeader>
  <TableRow>
    <TableHead>Kode</TableHead>
    <TableHead>Nama Produk</TableHead>
    <TableHead>Jenis</TableHead>
    <TableHead>Stok</TableHead>
    
    {/* Benar */}
    {currentUser?.role === "ADMIN" && (
      <TableHead className="text-right">Harga Beli</TableHead>
    )}
    
    <TableHead className="text-right">Harga Jual</TableHead>
    
    {/* --- PERBAIKAN DI SINI --- */}
    {/* Jangan bungkus dengan TableHead lagi, langsung render kondisional */}
    {currentUser?.role === "ADMIN" && (
      <TableHead className="text-right">Aksi</TableHead>
    )}
    {/* ------------------------- */}
  </TableRow>
</TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={currentUser?.role === "ADMIN" ? 7 : 6}
                      className="text-center"
                    >
                      {apiQuery.search
                        ? `Produk "${apiQuery.search}" tidak ditemukan.`
                        : "Belum ada data produk."}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.productCode}</TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>{product.stock}</TableCell>

                      {currentUser?.role === "ADMIN" && (
                        <TableCell className="text-right">
                          Rp {product.purchasePrice.toLocaleString("id-ID")}
                        </TableCell>
                      )}

                      <TableCell className="text-right">
                        Rp {product.sellingPrice.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        {currentUser?.role === "ADMIN" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenStockDialog(product)}
                            >
                              <PlusSquare className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditDialog(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              onClick={() => handleOpenDeleteDialog(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Tampilan Kartu (Mobile) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {products.length === 0 ? (
              <p className="text-center text-muted-foreground">
                {apiQuery.search
                  ? `Produk "${apiQuery.search}" tidak ditemukan.`
                  : "Belum ada data produk."}
              </p>
            ) : (
              products.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.productCode}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Stok
                        </span>
                        <span className="font-medium text-sm">
                          {product.stock}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Harga Jual
                        </span>
                        <span className="font-medium text-sm">
                          Rp {product.sellingPrice.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  {currentUser?.role === "ADMIN" && (
                    <CardFooter className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenStockDialog(product)}
                      >
                        <PlusSquare className="h-4 w-4 mr-2" />
                        Stok
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditDialog(product)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500"
                        onClick={() => handleOpenDeleteDialog(product)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-muted-foreground">
          Total {paginationInfo.totalCount} produk
        </span>
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
            Halaman {paginationInfo.currentPage} dari{" "}
            {paginationInfo.totalPages}
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
            <span className="mr-2">Berikutnya</span>
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
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus produk
              <span className="font-medium"> {productToDelete?.name} </span>
              secara permanen.
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

      {/* Dialog Tambah Stok */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Stok: {productToRestock?.name}</DialogTitle>
            <DialogDescription>
              Masukkan jumlah stok baru yang masuk. Stok saat ini:{" "}
              {productToRestock?.stock}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStockSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Jumlah
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={stockToAdd}
                  onChange={(e) => setStockToAdd(Number(e.target.value))}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </DialogClose>
              <Button type="submit">Simpan Stok</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====================================================================
// ================= Komponen Skeleton Loading ========================
// ====================================================================
function DashboardLoadingSkeleton({
  isAdmin,
}: {
  isAdmin: boolean | undefined;
}) {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <Skeleton className="h-9 w-64" />
        {isAdmin && <Skeleton className="h-10 w-full md:w-40" />}
      </div>
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-5 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-40" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-12" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-12" />
              </TableHead>
              {isAdmin && (
                <TableHead className="text-right">
                  <Skeleton className="h-5 w-24 ml-auto" />
                </TableHead>
              )}
              <TableHead className="text-right">
                <Skeleton className="h-5 w-24 ml-auto" />
              </TableHead>
              <TableHead className="text-right">
                <Skeleton className="h-5 w-20 ml-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-12" />
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Skeleton className="h-5 w-24 ml-auto" />
                  </TableCell>
                )}
                <TableCell>
                  <Skeleton className="h-5 w-24 ml-auto" />
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
