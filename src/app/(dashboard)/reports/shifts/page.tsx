// frontend/src/app/(dashboard)/reports/shifts/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, History } from "lucide-react";

interface Shift {
  id: number;
  startTime: string;
  endTime: string | null;
  startCash: number;
  endCash: number | null;
  expectedCash: number | null;
  difference: number | null;
  status: "OPEN" | "CLOSED";
  user: { name: string };
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export default function ShiftReportPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalCount: 0, totalPages: 0, currentPage: 1, limit: 10,
  });

  const fetchShifts = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await axios.get("/reports/shifts", { params: { page } });
      setShifts(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error("Gagal memuat laporan shift");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  // Utility Format
  const formatRp = (val: number | null) => 
    val ? `Rp ${Number(val).toLocaleString("id-ID")}` : "-";
  
  const formatDate = (dateStr: string | null) => 
    dateStr ? new Date(dateStr).toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' }) : "Sedang Aktif";

  return (
    <div className="h-full overflow-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <History className="h-8 w-8 text-primary" />
          Laporan Shift Kasir
        </h1>
        <p className="text-muted-foreground">
          Audit pembukaan dan penutupan kasir serta selisih uang tunai.
        </p>
      </div>

      <Card className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kasir</TableHead>
              <TableHead>Mulai</TableHead>
              <TableHead>Selesai</TableHead>
              <TableHead className="text-right">Modal Awal</TableHead>
              <TableHead className="text-right">Uang Fisik</TableHead>
              <TableHead className="text-right">Selisih</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : shifts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">Belum ada data shift.</TableCell>
              </TableRow>
            ) : (
              shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.user.name}</TableCell>
                  <TableCell>{formatDate(shift.startTime)}</TableCell>
                  <TableCell>{formatDate(shift.endTime)}</TableCell>
                  <TableCell className="text-right">{formatRp(shift.startCash)}</TableCell>
                  <TableCell className="text-right">{formatRp(shift.endCash)}</TableCell>
                  <TableCell className="text-right">
                    {shift.difference !== null ? (
                       <span className={shift.difference < 0 ? "text-red-600 font-bold" : shift.difference > 0 ? "text-green-600 font-bold" : ""}>
                         {formatRp(shift.difference)}
                       </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={shift.status === "OPEN" ? "outline" : "default"} className={shift.status === "OPEN" ? "text-green-600 border-green-600" : ""}>
                        {shift.status === "OPEN" ? "Aktif" : "Tutup"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination Simple */}
      <div className="flex justify-end gap-2">
        <Button 
            variant="outline" 
            disabled={pagination.currentPage === 1}
            onClick={() => fetchShifts(pagination.currentPage - 1)}
        >
            <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button 
            variant="outline" 
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => fetchShifts(pagination.currentPage + 1)}
        >
            Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}