"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Send,
  Loader2,
  ShieldCheck,
  MessageSquare,
  Clock,
  Trash2,
} from "lucide-react";

interface WhatsAppStatus {
  status: "connected" | "qr_ready" | "connecting" | "disconnected";
  isConnected: boolean;
  isConnecting: boolean;
  qrImage: string | null;
  user: {
    id: string;
    name?: string;
  } | null;
}

export default function WhatsAppConnectionPage() {
  const [waData, setWaData] = useState<WhatsAppStatus>({
    status: "connecting",
    isConnected: false,
    isConnecting: true,
    qrImage: null,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Modal Kirim Pesan Tes
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Halo! Ini adalah pesan pengujian koneksi WhatsApp Baileys dari My Perfume POS ✨"
  );
  const [isSendingTest, setIsSendingTest] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get("/whatsapp/status");
      setWaData(res.data);
    } catch (err: any) {
      console.error("Gagal mengambil status WhatsApp:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling status setiap 2.5 detik
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleRestart = async () => {
    setIsActionLoading(true);
    try {
      await axios.post("/whatsapp/restart");
      toast.info("Memulai ulang koneksi WhatsApp...");
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal me-restart WhatsApp");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogoutWA = async () => {
    setIsActionLoading(true);
    try {
      const res = await axios.post("/whatsapp/logout");
      toast.success(res.data.message || "Berhasil logout WhatsApp dan mereset sesi");
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal logout WhatsApp");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.error("Nomor WhatsApp tujuan wajib diisi");
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await axios.post("/whatsapp/test-send", {
        phone: testPhone,
        message: testMessage,
      });
      toast.success(res.data.message || "Pesan tes berhasil dikirim!");
      setIsTestModalOpen(false);
      setTestPhone("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal mengirim pesan tes");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
            <MessageSquare className="h-8 w-8 text-emerald-600" />
            Integrasi WhatsApp Web
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola sesi WhatsApp bot berbasis Baileys Multi-Device untuk nota struk dan broadcast.
          </p>
        </div>

        {/* Action Buttons di Header: Refresh & Tombol Logout WA */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
            disabled={isActionLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isActionLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isActionLoading}
                className="gap-2 font-semibold shadow-sm"
              >
                {isActionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Logout WhatsApp
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Logout WhatsApp Bot?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini akan memutuskan koneksi nomor WhatsApp yang saat ini terhubung dan menghapus file sesi auth di server.
                  Setelah logout, sistem akan membuat sesi baru dan menampilkan QR Code untuk dipindai ulang.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogoutWA}
                  className="bg-destructive hover:bg-destructive/90 text-white"
                >
                  Ya, Logout WhatsApp
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Konten Status Utama */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Kolom Kiri: Status Card / QR Code */}
        <div className="md:col-span-7 space-y-6">
          {isLoading ? (
            <Card className="flex flex-col items-center justify-center min-h-[380px] p-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground font-medium">Memeriksa status soket WhatsApp...</p>
            </Card>
          ) : waData.status === "connected" ? (
            /* TAMPILAN JIKA SUDAH TERHUBUNG */
            <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-background shadow-md">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-emerald-100 text-emerald-700 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-3 shadow-inner">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <CardTitle className="text-2xl font-bold text-emerald-800">
                  WhatsApp Terhubung
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Layanan pengiriman struk nota dan broadcast otomatis aktif.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nomor Perangkat Terhubung:</span>
                    <span className="font-mono font-bold text-slate-800 text-base">
                      +{waData.user?.id || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status Bot:</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                      Aktif (Online)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Engine:</span>
                    <span className="font-semibold text-slate-700">Baileys v7.0.0-rc13 Multi-Device</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Send className="h-4 w-4" />
                        Kirim Pesan Tes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Kirim Pesan Tes WhatsApp</DialogTitle>
                        <DialogDescription>
                          Kirimkan pesan uji coba untuk memastikan soket dapat mengirim pesan dengan lancar.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSendTestMessage} className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="test-phone">Nomor Tujuan (Format: 08xxx atau 628xxx)</Label>
                          <Input
                            id="test-phone"
                            placeholder="Contoh: 081234567890"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="test-msg">Isi Pesan</Label>
                          <Input
                            id="test-msg"
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            required
                          />
                        </div>
                        <DialogFooter className="pt-2">
                          <Button type="submit" disabled={isSendingTest} className="gap-2">
                            {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Kirim Sekarang
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full gap-2 font-semibold">
                        <LogOut className="h-4 w-4" />
                        Logout WhatsApp
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Putuskan & Logout WhatsApp?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini akan memutuskan koneksi nomor <strong>+{waData.user?.id || ""}</strong> dan menghapus sesi di server. Anda dapat menghubungkan nomor lain setelahnya.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleLogoutWA}
                          className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                          Ya, Logout WhatsApp
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ) : waData.status === "qr_ready" && waData.qrImage ? (
            /* TAMPILAN QR CODE SIAP SCAN */
            <Card className="border-primary/20 shadow-lg text-center">
              <CardHeader>
                <div className="inline-flex items-center justify-center gap-2 mx-auto bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                  <QrCode className="h-3.5 w-3.5" /> Scan Untuk Menghubungkan
                </div>
                <CardTitle className="text-2xl font-bold">Pindai Kode QR WhatsApp</CardTitle>
                <CardDescription>
                  Arahkan kamera WhatsApp di ponsel Anda ke kode QR di bawah ini.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                <div className="relative p-4 bg-white rounded-2xl shadow-md border-2 border-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={waData.qrImage}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64 md:w-72 md:h-72 object-contain"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Kode QR diperbarui otomatis. Layar langsung berganti saat scan berhasil.</span>
                </div>
              </CardContent>

              <CardFooter className="justify-center gap-3 border-t py-4 bg-muted/30">
                <Button variant="outline" size="sm" onClick={handleRestart} className="gap-2 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" /> Minta QR Baru
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 text-xs text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" /> Logout / Reset Sesi
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Sesi WhatsApp?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini akan menghapus sisa file sesi dan membuat sesi baru dari awal.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLogoutWA}
                        className="bg-destructive hover:bg-destructive/90 text-white"
                      >
                        Reset Sesi
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ) : (
            /* TAMPILAN CONNECTING / DISCONNECTED */
            <Card className="min-h-[380px] flex flex-col justify-center items-center text-center p-8 space-y-4 border-dashed">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {waData.status === "connecting"
                    ? "Menghubungkan ke WhatsApp..."
                    : "WhatsApp Belum Terhubung"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-1">
                  {waData.status === "connecting"
                    ? "Sistem sedang menginisialisasi soket Baileys. Tunggu beberapa detik hingga QR Code siap."
                    : "Sesi WhatsApp belum aktif. Klik tombol di bawah untuk membuat sesi dan memunculkan QR Code."}
                </p>
              </div>

              <div className="flex gap-2 mt-2">
                <Button
                  onClick={handleRestart}
                  disabled={isActionLoading}
                  className="gap-2"
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Inisialisasi / Buat QR Baru
                </Button>

                <Button
                  variant="outline"
                  onClick={handleLogoutWA}
                  disabled={isActionLoading}
                  className="gap-2 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Reset Sesi
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Kolom Kanan: Panduan Penggunaan & Tips */}
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <Smartphone className="h-5 w-5 text-primary" />
                Cara Menghubungkan WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                  1
                </span>
                <p>
                  Buka aplikasi <strong>WhatsApp</strong> di HP Anda.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                  2
                </span>
                <p>
                  Buka menu <strong>Titik Tiga</strong> (Android) atau <strong>Pengaturan</strong> (iPhone).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                  3
                </span>
                <p>
                  Pilih <strong>Perangkat Tertaut</strong> (<em>Linked Devices</em>).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                  4
                </span>
                <p>
                  Ketuk <strong>Tautkan Perangkat</strong> lalu arahkan kamera ke <strong>QR Code</strong> di layar.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/40 border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Manajemen Nomor & Ganti Nomor
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• Jika ingin mengganti nomor bot WhatsApp, cukup klik tombol <strong>Logout WhatsApp</strong>.</p>
              <p>• Sesi lama di server akan dihapus otomatis dan layar akan langsung memunculkan QR Code baru untuk nomor yang baru.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
