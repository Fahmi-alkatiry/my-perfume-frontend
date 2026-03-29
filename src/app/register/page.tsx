"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion"; // Tambahkan framer-motion untuk animasi

// Import Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  UserPlus,
  Sparkles,
  CheckCircle2,
  Flower2,
} from "lucide-react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const phoneFromUrl = searchParams.get("phone");
    if (phoneFromUrl) setPhone(phoneFromUrl);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post("/customers", { name, phoneNumber: phone });
      toast.success("Selamat! Kamu resmi jadi member My Perfume.");
      setIsSuccess(true);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || "Terjadi kesalahan saat pendaftaran.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 p-8 bg-white rounded-3xl shadow-2xl border border-rose-100 max-w-sm mx-auto"
      >
        <div className="flex justify-center">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          Pendaftaran Berhasil!
        </h2>

        {/* Bagian Nama Tebal di sini */}
        <p className="text-slate-600 leading-relaxed">
          Terima kasih Kak{" "}
          <strong className="text-black font-extrabold">{name}</strong>. <br />
          Sekarang Kakak resmi menjadi bagian dari keluarga **My Perfume**.
        </p>

        <Button
          onClick={() => (window.location.href = "whatsapp://")}
          className="mt-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-8"
        >
          Selesai & Kembali
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-50 via-slate-50 to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-sm bg-white/90">
          <CardHeader className="space-y-2 pb-6">
            <div className="flex justify-center mb-2">
              <div className="bg-gradient-to-br from-rose-400 to-pink-500 p-3 rounded-2xl shadow-lg rotate-3">
                <Flower2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 italic">
              My Perfume
            </CardTitle>
            <CardDescription className="text-center text-slate-500 text-base">
              Eksklusif untuk Kakak. Daftar member dan dapatkan poin di setiap
              semprotan keharuman!
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-slate-700 font-medium ml-1"
                >
                  Nomor WhatsApp Terdeteksi
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    value={phone}
                    readOnly
                    className="bg-slate-50/50 border-slate-200 text-slate-500 font-mono h-12 pl-4 focus-visible:ring-0 cursor-not-allowed italic"
                  />
                  <div className="absolute right-3 top-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 opacity-70" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 ml-1 italic">
                  *Nomor ini akan digunakan untuk menyimpan poin Kakak.
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-slate-700 font-medium ml-1"
                >
                  Nama Panggilan / Lengkap
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="Contoh: jokowi, prabowo, atau bahlil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 border-slate-200 focus:border-rose-300 focus:ring-rose-200 transition-all rounded-lg text-lg"
                />
              </div>
            </CardContent>

            <CardFooter className="pt-4 pb-8">
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-200 transition-all active:scale-[0.98] rounded-xl gap-2"
                disabled={isLoading || !name}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Gabung Jadi Member
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center mt-6 text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} My Perfume Store. All rights
          reserved.
        </p>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
          <p className="text-slate-500 font-medium">Menyiapkan halaman...</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
