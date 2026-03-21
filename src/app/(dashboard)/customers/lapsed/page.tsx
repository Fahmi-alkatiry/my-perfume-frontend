"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MessageCircle, UserX } from "lucide-react";
import { toast } from "sonner";

export default function LapsedCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLapsed = async () => {
      try {
        const res = await axios.get("/customers/lapsed");
        setCustomers(res.data.data);
      } catch (error) {
        toast.error("Gagal memuat data pelanggan lama");
      } finally {
        setLoading(false);
      }
    };
    fetchLapsed();
  }, []);

  const handleRemind = (customer: any) => {
    const message = `Halo *${customer.name}* 👋%0A%0AKami kangen aromamu di *My Perfume* ✨%0AStok parfum favoritmu sudah menipis? Mumpung ada poin *${customer.points}*, yuk mampir lagi ke toko! 🌸`;
    window.open(`https://wa.me/${customer.phoneNumber}?text=${message}`, "_blank");
  };

  if (loading) return <div className="p-8 text-center">Menghitung pelanggan lama...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <UserX className="h-6 w-6 text-destructive" />
        <h1 className="text-2xl font-bold">Pelanggan Jarang Belanja (30 Hari+)</h1>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>No. WA</TableHead>
              <TableHead>Poin</TableHead>
              <TableHead>Terakhir Belanja</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium uppercase">{c.name}</TableCell>
                <TableCell>{c.phoneNumber}</TableCell>
                <TableCell>{c.points}</TableCell>
                <TableCell>
                  {new Date(c.lastTransactionAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => handleRemind(c)}>
                    <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
                    Ingatkan WA
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}