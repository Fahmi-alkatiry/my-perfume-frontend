"use client";

import { useState, FormEvent, useMemo } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { Send, Megaphone, Loader2, Users } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_URL = "/broadcast/promo";

export default function BroadcastPage() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [filterType, setFilterType] = useState("ALL");
  const [filterValue, setFilterValue] = useState("");

  // Preview personalisasi
  const previewText = useMemo(() => {
    return message.replace(/{{nama}}/gi, "Budi");
  }, [message]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Pesan tidak boleh kosong");
      return;
    }

    if (filterType === "SEGMENT" && !filterValue) {
      toast.error("Pilih segmen pelanggan dulu");
      return;
    }

    if (filterType === "POINTS" && (!filterValue || Number(filterValue) < 0)) {
      toast.error("Masukkan nilai poin yang valid");
      return;
    }

    const confirm = window.confirm(
      `Yakin ingin mengirim broadcast?\n\nFilter: ${filterType}\nPesan:\n${previewText}`
    );
    if (!confirm) return;

    setIsSending(true);

    try {
      const res = await axios.post(API_URL, {
        message,
        filterType,
        filterValue: filterType === "POINTS" ? Number(filterValue) : filterValue,
      });

      toast.success("Broadcast dimulai 🚀", {
        description: res.data.message,
      });

      setMessage("");
      setFilterValue("");

    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal mengirim broadcast");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Megaphone className="h-8 w-8 text-primary" />
          Broadcast Pesan
        </h1>
        <p className="text-muted-foreground">
          Kirim promo ke pelanggan berdasarkan segmentasi atau poin.
        </p>
      </div>

      {/* FILTER CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Target Audiens</CardTitle>
          <CardDescription>Pilih siapa yang akan menerima pesan.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label>Jenis Target</Label>
            <Select
              disabled={isSending}
              value={filterType}
              onValueChange={(v) => {
                setFilterType(v);
                setFilterValue("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih target..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Pelanggan</SelectItem>
                <SelectItem value="SEGMENT">Segmentasi Loyalitas (RFM)</SelectItem>
                <SelectItem value="POINTS">Minimal Poin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterType === "SEGMENT" && (
            <div className="p-4 bg-muted rounded-lg space-y-2 animate-in fade-in">
              <Label>Pilih Segmen</Label>
              <Select value={filterValue} onValueChange={setFilterValue} disabled={isSending}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Champions">🏆 Champions</SelectItem>
                  <SelectItem value="Loyal">💚 Loyal</SelectItem>
                  <SelectItem value="Potential">🌱 Potential</SelectItem>
                  <SelectItem value="At Risk">⚠️ At Risk</SelectItem>
                  <SelectItem value="Lost">💤 Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {filterType === "POINTS" && (
            <div className="p-4 bg-muted rounded-lg space-y-2 animate-in fade-in">
              <Label>Minimal Poin</Label>
              <Input
                disabled={isSending}
                type="number"
                className="w-32 bg-white"
                value={filterValue}
                placeholder="0"
                onChange={(e) => setFilterValue(e.target.value)}
              />
            </div>
          )}

        </CardContent>
      </Card>

      {/* MESSAGE CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Isi Pesan</CardTitle>
        </CardHeader>

        <form onSubmit={handleSend}>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label>Template Pesan WhatsApp</Label>
              <Textarea
                disabled={isSending}
                placeholder="Contoh: Hai {{nama}}, ada promo spesial untuk kamu!"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-none"
              />
              <small className="text-muted-foreground text-xs">
                  Variabel tersedia: <b>{"{{nama}}"}</b>  

                <span className="ml-2 text-gray-500">({message.length} karakter)</span>
              </small>
            </div>

            {message && (
              <Alert className="bg-green-50 border-green-300">
                <Users className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 font-semibold">Preview</AlertTitle>
                <AlertDescription className="text-sm text-green-700">
                  {previewText}
                </AlertDescription>
              </Alert>
            )}

          </CardContent>

          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSending} className="w-full md:w-auto">
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
