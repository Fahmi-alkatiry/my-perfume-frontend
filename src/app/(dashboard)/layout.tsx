// app/(dashboard)/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  TabletSmartphone,
  Package,
  Users,
  LogOut,
  LineChart,
  Store, // Ikon untuk nama toko
  CreditCard,
} from "lucide-react";
import { ReactNode } from "react";

// --- Data Link Navigasi (Tetap di luar) ---
const navLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/pos",
    label: "Kasir",
    icon: TabletSmartphone,
  },
  // --- 2. TAMBAHKAN LINK BARU DI SINI ---
  {
    href: "/reports",
    label: "Laporan",
    icon: LineChart,
  },
  // ------------------------------------
  {
    href: "/products",
    label: "Produk",
    icon: Package,
  },
  {
    href: "/customers",
    label: "Pelanggan",
    icon: Users,
  },
  {
    href: "/payment-methods",
    label: "Metode Bayar",
    icon: CreditCard,
  },
];

// --- 1. PINDAHKAN NavLinkItems KE LUAR ---
// Komponen ini sekarang didefinisikan di luar 'DashboardLayout'
// dan menerima 'pathname' sebagai prop.
function NavLinkItems({ pathname }: { pathname: string }) {
  return (
    <>
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`
              flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
              transition-all hover:bg-muted
              ${isActive ? "bg-muted text-primary" : "text-muted-foreground"}
            `}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

// --- Komponen Layout Utama (Induk) ---
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname(); // Dapatkan pathname di sini
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("token"); // Hapus token
    toast.success("Anda berhasil logout.");
    router.push("/login"); // Arahkan ke login
  };

  // --- 2. HAPUS 'const NavLinkItems = ...' DARI SINI ---

  // --- 3. RENDER ---
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      
      {/* 1. SIDEBAR (Hanya Desktop) */}
      <div className="hidden border-r bg-background md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold"
            >
              <Store className="h-6 w-6 text-primary" />
              <span className="">My Perfume POS</span>
            </Link>
          </div>
          <nav className="flex-1 grid items-start p-2 text-sm font-medium lg:p-4">
            {/* --- 4. KIRIM 'pathname' SEBAGAI PROP --- */}
            <NavLinkItems pathname={pathname} />
          </nav>
          <div className="mt-auto p-4">
            <Button size="sm" variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </div>

      {/* 2. KONTEN UTAMA (dan Header Mobile) */}
      <div className="flex flex-col">
        {/* Header (Hanya Mobile) */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Store className="h-6 w-6 text-primary" />
                  <span className="">My Perfume POS</span>
                </Link>
                {/* --- 4. KIRIM 'pathname' SEBAGAI PROP --- */}
                <NavLinkItems pathname={pathname} />
              </nav>
              <div className="mt-auto">
                <Button size="sm" variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-lg md:hidden">My Perfume POS</span>
        </header>
        
        {/* Konten Halaman */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}