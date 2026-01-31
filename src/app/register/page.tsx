"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";

// Import Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const phoneFromUrl = searchParams.get("phone");
    if (phoneFromUrl) setPhone(phoneFromUrl);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post("/customers", { name, phoneNumber: phone });
      toast.success("Pendaftaran berhasil! Selamat bergabung di My Perfume.");
      // Opsional: Redirect ke halaman sukses
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Terjadi kesalahan saat pendaftaran.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-t-4 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-slate-800">
            My Perfume Member
          </CardTitle>
          <CardDescription className="text-center">
            Lengkapi data diri untuk mulai mengumpulkan poin belanja.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor WhatsApp</Label>
              <Input
                id="phone"
                type="text"
                value={phone}
                readOnly
                className="bg-slate-100 font-mono focus-visible:ring-0 cursor-not-allowed"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                type="text"
                required
                placeholder="Masukkan nama lengkap Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="focus-visible:ring-gray-400"
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full  transition-all gap-2"
              disabled={isLoading || !name}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Daftar Member Sekarang
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Next.js mewajibkan useSearchParams berada di dalam Suspense
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}