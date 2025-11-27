// frontend/src/app/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie"; // <-- Impor js-cookie

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const API_URL_LOGIN = "http://localhost:5000/api/auth/login";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Panggil API login
      const response = await axios.post(API_URL_LOGIN, {
        username,
        password,
      });

      const { token } = response.data;

      // 2. Simpan token ke cookie
      // 'expires: 1' berarti token berlaku selama 1 hari
      Cookies.set("token", token, { expires: 1 });

      toast.success("Login Berhasil!");

      // 3. Arahkan ke halaman dashboard
      // Kita gunakan window.location.href agar me-reload penuh
      // Ini penting agar 'axios interceptor' (di langkah 3) bisa berjalan
      window.location.href = "/pos"; 
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Login gagal";
      toast.error("Login Gagal", { description: errorMessage });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login My Perfume POS</CardTitle>
          <CardDescription>
            Masukkan username dan password Anda di bawah ini.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}