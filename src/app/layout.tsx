// frontend/src/app/layout.tsx
"use client"; // <-- Ubah menjadi Client Component

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner"; // <--- TAMBAHKAN BARIS INI
// --- Impor hook dan cookie ---
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect } from "react";
// ------------------------------

const inter = Inter({ subsets: ["latin"] });

// Daftar rute yang TIDAK perlu login
const PUBLIC_ROUTES = ["/login"];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // Logika 1: Jika tidak ada token DAN mencoba akses rute privat
    if (!token && !isPublicRoute) {
      toast.error("Akses Ditolak", {
        description: "Anda harus login terlebih dahulu.",
      });
      router.push("/login"); // <--- "Usir" ke halaman login
    }

    // Logika 2: Jika ada token DAN mencoba akses halaman login
    if (token && isPublicRoute) {
      router.push("/dashboard"); // <--- Arahkan ke dashboard
    }
  }, [pathname, router]);

  // Sembunyikan layout jika kita di rute publik (login)
  // Atau jika kita sedang di-redirect (untuk menghindari flash)
  const token = Cookies.get("token");
  if (PUBLIC_ROUTES.includes(pathname) || (!token && !PUBLIC_ROUTES.includes(pathname))) {
    return (
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Toaster richColors />
        </body>
      </html>
    );
  }
  
  // Render layout normal jika sudah login
  return (
    <html lang="en">
      <body className={inter.className}>
        {/*
          TODO: Nanti, letakkan Sidebar Navigasi Anda di sini,
          dan 'children' akan ada di dalam konten utama.
        */}
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}