// frontend/src/app/(dashboard)/users/page.tsx
"use client";
import { useState, useEffect, FormEvent } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { UserCog, Plus, Edit, Trash2, Loader2, KeyRound } from "lucide-react";

interface User {
  id: number;
  name: string;
  username: string;
  role: "ADMIN" | "CASHIER";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "CASHIER" as "ADMIN" | "CASHIER"
  });

  // Fetch Current Logged In User and All Users
  const initializePage = async () => {
    try {
      setIsLoading(true);
      // Fetch me
      const meRes = await axios.get("/auth/me");
      setCurrentUser(meRes.data);

      // Fetch all users
      const usersRes = await axios.get("/users");
      setUsers(usersRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal memuat data pengguna");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializePage();
  }, []);

  const openAddModal = () => {
    setSelectedUser(null);
    setFormData({ name: "", username: "", password: "", role: "CASHIER" });
    setIsDialogOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: "", // Kosongkan, diisi hanya jika ingin diubah
      role: user.role
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.role) {
      return toast.error("Nama, username, dan role wajib diisi");
    }
    if (!selectedUser && !formData.password) {
      return toast.error("Password wajib diisi untuk pengguna baru");
    }

    try {
      setIsSubmitting(true);
      if (selectedUser) {
        // Edit mode
        await axios.put(`/users/${selectedUser.id}`, formData);
        toast.success("Data pengguna berhasil diperbarui");
      } else {
        // Create mode
        await axios.post("/users", formData);
        toast.success("Pengguna baru berhasil didaftarkan");
      }
      setIsDialogOpen(false);
      // Refresh list
      const usersRes = await axios.get("/users");
      setUsers(usersRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menyimpan data pengguna");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (currentUser && currentUser.id === user.id) {
      return toast.error("Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif");
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.name}"?`)) return;

    try {
      await axios.delete(`/users/${user.id}`);
      toast.success("Pengguna berhasil dihapus");
      // Refresh list
      const usersRes = await axios.get("/users");
      setUsers(usersRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menghapus pengguna");
    }
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCog className="h-8 w-8 text-primary"/> Kelola Pengguna
          </h1>
          <p className="text-muted-foreground mt-1">
            Tambahkan, perbarui informasi, atau atur peran akses (Admin/Kasir) pengguna POS.
          </p>
        </div>
        <Button onClick={openAddModal} className="flex gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4"/> Tambah Pengguna
        </Button>
      </div>

      {/* DATA TABLE */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px] text-center">No</TableHead>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Hak Akses / Peran</TableHead>
              <TableHead className="text-center w-[120px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/> Memuat data pengguna...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Tidak ada pengguna ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow key={user.id} className="hover:bg-muted/20">
                  <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-semibold">{user.name} {currentUser?.id === user.id && <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded ml-1">(Anda)</span>}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "ADMIN" 
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}>
                      {user.role === "ADMIN" ? "Administrator" : "Kasir"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50" 
                        onClick={() => openEditModal(user)} 
                        title="Ubah"
                      >
                        <Edit className="h-4 w-4"/>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50" 
                        onClick={() => handleDelete(user)} 
                        title="Hapus"
                        disabled={currentUser?.id === user.id}
                      >
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

      {/* MODAL FORM */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary"/>
              {selectedUser ? "Ubah Informasi Pengguna" : "Tambah Pengguna Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input 
                id="name"
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
                placeholder="Cth: Ahmad Fauzi" 
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username"
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s+/g, "")})} 
                required 
                placeholder="Cth: fauzi123" 
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password"
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  required={!selectedUser} 
                  placeholder={selectedUser ? "Biarkan kosong jika tidak diubah" : "Masukkan password baru"}
                  className="w-full pl-9"
                />
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Hak Akses / Peran</Label>
              <select
                id="role"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as "ADMIN" | "CASHIER"})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="CASHIER">Kasir (CASHIER)</option>
                <option value="ADMIN">Administrator (ADMIN)</option>
              </select>
            </div>
            <DialogFooter className="pt-4 mt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {selectedUser ? "Simpan Perubahan" : "Daftarkan Pengguna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
