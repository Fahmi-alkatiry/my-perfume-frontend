// frontend/src/app/(dashboard)/broadcast/page.tsx
"use client";

import { useState, FormEvent } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { Send, Megaphone, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_URL = "/broadcast/promo";

export default function BroadcastPage() {
  const [message, setMessage] = useState("");
  const [minPoints, setMinPoints] = useState("0");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const isMessageTooShort = message.trim().length < 5;


  const handleSend = async (e: FormEvent) => {
    e.preventDefault();

    if (message.length > 400) {
      toast.error("Pesan terlalu panjang (maks 500 karakter)");
      return;
    }

    if (!message) {
      toast.error("Pesan tidak boleh kosong");
      return;
    }

    // Konfirmasi keamanan
    const confirm = window.confirm(
      "Apakah Anda yakin ingin mengirim pesan ini ke banyak pelanggan sekaligus?"
    );
    if (!confirm) return;

    setIsSending(true);
    setResult(null);

    try {
      const res = await axios.post(API_URL, {
        message,
        minPoints: minPoints === "" ? 0 : Number(minPoints),
      });

      toast.success("Broadcast berhasil diproses!");
      setResult(res.data.message); // Pesan dari backend (misal: "Memulai broadcast ke 50 kontak...")
      setMessage(""); // Reset form
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.error || "Gagal mengirim broadcast";
      toast.error(errMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Megaphone className="h-8 w-8 text-primary" />
          Broadcast Pesan
        </h1>
        <p className="text-muted-foreground">
          Kirim pesan promosi massal ke WhatsApp pelanggan Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kirim Pesan Baru</CardTitle>
          <CardDescription>
            Gunakan fitur ini dengan bijak untuk menghindari pemblokiran
            WhatsApp.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSend}>
          <CardContent className="space-y-4">
            {/* Filter Target */}
            <div className="space-y-2">
              <Label>Target Pelanggan (Filter Poin)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Kirim ke pelanggan dengan Poin minimal:
                </span>
                <Input
                  type="number"
                  className="w-24"
                  value={minPoints}
                  onChange={(e) => setMinPoints(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Isi 0 untuk mengirim ke <b>SEMUA</b> pelanggan yang punya nomor
                WA.
              </p>
            </div>

            {/* Isi Pesan */}
            <div className="space-y-2">
              <Label>Isi Pesan</Label>
              <Textarea
                placeholder="Halo Kak, My Perfume lagi ada promo diskon 50% lho! Yuk mampir..."
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Tips: Buat pesan singkat, menarik, dan tidak terlihat seperti
                spam.
              </p>
            </div>

            {/* Alert Info */}
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Info Sistem</AlertTitle>
              <AlertDescription className="text-blue-700 text-xs">
                Pesan akan dikirim secara antrian (delay 2-5 detik per pesan)
                untuk keamanan nomor WhatsApp toko.
              </AlertDescription>
            </Alert>

            {/* Result Message */}
            {result && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Berhasil</AlertTitle>
                <AlertDescription className="text-green-700">
                  {result}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={isSending || isMessageTooShort}
              className="w-full md:w-auto"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Kirim Broadcast
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Ikon tambahan lokal
import { CheckCircle } from "lucide-react";
