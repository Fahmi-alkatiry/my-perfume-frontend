"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { format, subDays } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function AdvancedReportPage() {
  // Default 7 hari terakhir
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdvancedData = async () => {
    if (!date?.from || !date?.to) {
      return toast.error("Pilih rentang tanggal terlebih dahulu");
    }

    setLoading(true);
    try {
      const start = format(date.from, "yyyy-MM-dd");
      const end = format(date.to, "yyyy-MM-dd");
      const res = await axios.get(
        `/reports/advanced?startDate=${start}&endDate=${end}`,
      );
      setData(res.data);
    } catch (error) {
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvancedData();
  }, []);

  const handleFilterApply = () => fetchAdvancedData();

  const handleExport = () => {
    if (!data || !data.flatData) {
      return toast.error("Data tidak ditemukan");
    }

    try {
      // Data sudah flat dari backend, tinggal convert ke sheet
      const ws = XLSX.utils.json_to_sheet(data.flatData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data_Mendalam");

      // Nama file unik
      const fileName = `FlatData_MyPerfume_${format(new Date(), "ddMMyy_HHmm")}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Flat Data siap di-copy ke Google Sheets!");
    } catch (error) {
      toast.error("Gagal export flat data");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analisis Laporan Mendalam</h1>

      {/* --- Filter Bar --- */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full md:w-[300px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd/MM/yy")} -{" "}
                    {format(date.to, "dd/MM/yy")}
                  </>
                ) : (
                  format(date.from, "dd/MM/yy")
                )
              ) : (
                <span>Pilih rentang tanggal</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              locale={dateFnsLocaleId}
            />
          </PopoverContent>
        </Popover>
        <Button onClick={handleFilterApply} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Terapkan Filter
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          className="ml-auto"
          disabled={!data || loading}
        >
          <Download className="mr-2 h-4 w-4" /> Export Excel
        </Button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Omzet"
              value={data.summary.totalRevenue}
              icon={<DollarSign className="text-green-500" />}
            />
            <SummaryCard
              title="Profit Kotor"
              value={data.summary.totalGrossProfit ?? data.summary.totalProfit}
              icon={<TrendingUp className="text-blue-500" />}
            />
            <SummaryCard
              title="Pengeluaran"
              value={data.summary.totalExpenses ?? 0}
              icon={<TrendingDown className="text-red-500" />}
            />
            <SummaryCard
              title="Laba Bersih"
              value={data.summary.totalNetProfit ?? data.summary.totalProfit}
              icon={<TrendingUp className="text-green-600" />}
            />
          </div>
          <div className="grid grid-cols-1 mt-4">
            <SummaryCard
              title="Total Transaksi"
              value={`${data.summary.totalOrders} Order`}
              icon={<ShoppingBag className="text-orange-500" />}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Laporan Penjualan Per Produk</CardTitle>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                Total: {data.products.length} Produk
              </span>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">No</TableHead>
                      <TableHead>Nama Produk</TableHead>
                      <TableHead className="text-center">Qty Terjual</TableHead>
                      <TableHead className="text-right">Total Omzet</TableHead>
                      <TableHead className="text-right">Kontribusi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.products.map((p: any, index: number) => {
                      const contribution =
                        data.summary.totalRevenue > 0
                          ? (
                              (p._sum.subtotal / data.summary.totalRevenue) *
                              100
                            ).toFixed(1)
                          : "0";

                      return (
                        <TableRow
                          key={p.productId}
                          className="hover:bg-muted/30"
                        >
                          <TableCell className="text-center text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium uppercase">
                            {p.name || "Produk Terhapus"}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {p._sum.quantity} unit
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            Rp {p._sum.subtotal.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {contribution}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <tfoot className="bg-muted/50 font-bold border-t">
                    <TableRow>
                      <TableCell colSpan={2} className="text-right">
                        TOTAL
                      </TableCell>
                      <TableCell className="text-center">
                        {data.products.reduce(
                          (acc: number, curr: any) => acc + curr._sum.quantity,
                          0,
                        )}
                      </TableCell>
                      <TableCell className="text-right text-primary">
                        Rp {data.summary.totalRevenue.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon }: any) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === "number"
            ? `Rp ${value.toLocaleString("id-ID")}`
            : value}
        </div>
      </CardContent>
    </Card>
  );
}
