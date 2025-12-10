"use client";

import { useState, useMemo } from "react";
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
  const [templates, setTemplates] = useState<string[]>([""]);
  const [isSending, setIsSending] = useState(false);

  const [filterType, setFilterType] = useState("ALL");
  const [filterValue, setFilterValue] = useState("");

  // Preview: pakai template pertama yang diisi
  const previewText = useMemo(() => {
    const first = templates.find((t) => t.trim().length > 0);
    return first ? first.replace(/{{nama}}/gi, "Budi") : "";
  }, [templates]);

  const handleTemplateChange = (index: number, value: string) => {
    const newTemplates = [...templates];
    newTemplates[index] = value;
    setTemplates(newTemplates);
  };

  const handleAddTemplate = () => {
    if (templates.length < 4) setTemplates([...templates, ""]);
  };

  const handleRemoveTemplate = (index: number) => {
    if (templates.length > 1) {
      const newTemplates = templates.filter((_, i) => i !== index);
      setTemplates(newTemplates);
    }
  };

 const handleSend = async (e: React.FormEvent) => {
  e.preventDefault();

  const filledTemplates = templates.filter((t) => t.trim().length > 0);

  // Validasi panjang setiap template
  for (const t of filledTemplates) {
    const plainLength = t.replace(/{{nama}}/gi, "").trim().length;
    if (plainLength < 5) {
      return toast.error(
        "Template terlalu pendek, minimal 5 karakter selain {{nama}}"
      );
    }
  }
  if (filledTemplates.length === 0) {
    return toast.error("Isi minimal 1 template pesan.");
  }

  if (filterType === "SEGMENT" && !filterValue) {
    return toast.error("Pilih segmen pelanggan dulu");
  }

  if (filterType === "POINTS" && (!filterValue || Number(filterValue) < 0)) {
    return toast.error("Masukkan nilai poin yang valid");
  }

  const confirm = window.confirm(
    `Yakin ingin mengirim broadcast?\n\nFilter: ${filterType}\nJumlah template: ${filledTemplates.length}\nPreview:\n${previewText}`
  );
  if (!confirm) return;

  setIsSending(true);

  try {
    const res = await axios.post(API_URL, {
      templates: filledTemplates,
      filterType,
      filterValue: filterType === "POINTS" ? Number(filterValue) : filterValue,
    });

    toast.success("Broadcast dimulai 🚀", {
      description: res.data.message,
    });

    // Reset
    setTemplates([""]);
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Megaphone className="h-8 w-8 text-primary" /> Broadcast Pesan
        </h1>
        <p className="text-muted-foreground">
          Kirim promo ke pelanggan berdasarkan segmentasi atau poin.
        </p>
      </div>

      {/* FILTER CARD */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Target Audiens</CardTitle>
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
                <SelectItem value="SEGMENT">
                  Segmentasi Loyalitas (RFM)
                </SelectItem>
                <SelectItem value="POINTS">Minimal Poin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterType === "SEGMENT" && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <Label>Pilih Segmen</Label>
              <Select
                value={filterValue}
                onValueChange={setFilterValue}
                disabled={isSending}
              >
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
            <div className="p-4 bg-muted rounded-lg space-y-2">
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
          <CardTitle>Template Pesan WhatsApp</CardTitle>
        </CardHeader>
        <form onSubmit={handleSend}>
          <CardContent className="space-y-4">
            {templates.map((t, i) => (
              <div key={i} className="space-y-1">
                <Textarea
                  disabled={isSending}
                  placeholder={`Template ${i + 1}`}
                  rows={4}
                  value={t}
                  onChange={(e) => handleTemplateChange(i, e.target.value)}
                  className="resize-none"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Variabel tersedia: <b>{"{{nama}}"}</b>
                  </span>
                  {templates.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500"
                      onClick={() => handleRemoveTemplate(i)}
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}

            {templates.length < 4 && (
              <Button
                type="button"
                disabled={isSending}
                onClick={handleAddTemplate}
              >
                + Tambah Template
              </Button>
            )}

            {previewText && (
              <Alert className="bg-green-50 border-green-300 mt-4">
                <Users className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 font-semibold">
                  Preview
                </AlertTitle>
                <AlertDescription className="text-sm text-green-700">
                  {previewText}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={isSending}
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
