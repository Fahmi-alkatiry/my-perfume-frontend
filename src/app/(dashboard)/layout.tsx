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
  Store,
  LineChart,
  CreditCard,
  Archive,
  ChevronLeft,
  BrainCircuit,
  Clock,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import axios from "@/lib/axios";

// --- Tipe Data User ---
interface LoggedInUser {
  id: number;
  name: string;
  role: "ADMIN" | "CASHIER";
}


// --- KONFIGURASI MENU & HAK AKSES ---
const navLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    adminOnly: true, // <-- SEMBUNYIKAN DARI KASIR
  },
  {
    href: "/pos",
    label: "Kasir",
    icon: TabletSmartphone,
    adminOnly: false, // Semua boleh akses
  },
  {
    href: "/reports",
    label: "Laporan Transaksi",
    icon: LineChart,
    adminOnly: true, // <-- SEMBUNYIKAN DARI KASIR
  },
  {
    href: "/reports/stock",
    label: "Riwayat Stok",
    icon: Archive,
    adminOnly: true, // <-- SEMBUNYIKAN DARI KASIR
  },
  {
    href: "/reports/forecast",
    label: "Peramalan Stok", // Atau "Analisis Stok"
    icon: BrainCircuit,
    adminOnly: true,
  },
  {
    href: "/reports/shifts",
    label: "Laporan Shift",
    icon: Clock,
    adminOnly: true, // Hanya admin yang perlu lihat ini
  },
  {
    href: "/products",
    label: "Produk",
    icon: Package,
    adminOnly: false, // Kasir boleh lihat (tapi terbatas, diatur di halaman produk)
  },
  {
    href: "/customers",
    label: "Pelanggan",
    icon: Users,
    adminOnly: false, // Kasir boleh akses
  },
  {
    href: "/payment-methods",
    label: "Metode Bayar",
    icon: CreditCard,
    adminOnly: true, // <-- SEMBUNYIKAN DARI KASIR
  },
];
// --- Komponen NavLinkItems (Di luar render) ---
function NavLinkItems({
  pathname,
  isCollapsed,
  links,
}: {
  pathname: string;
  isCollapsed: boolean;
  links: typeof navLinks;
}) {
  return (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`
              flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-muted
              ${isActive ? "bg-muted text-primary" : "text-muted-foreground"}
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <link.icon className="h-4 w-4" />
            {!isCollapsed && <span className="truncate">{link.label}</span>}
          </Link>
        );
      })}
    </>
  );
}

// --- Komponen Layout Utama (Induk) ---
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State User & Menu
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const [filteredNavLinks, setFilteredNavLinks] = useState<typeof navLinks>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Loading state agar tidak flashing

  // --- FUNGSI DIALOG (UBAH NAMA STATE) ---

  const handleLogout = () => {
    Cookies.remove("token");
    localStorage.clear();
    toast.success("Anda berhasil logout.");
    router.push("/login");
  };

  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        setIsCheckingAuth(true);
        const res = await axios.get("/auth/me");
        const user: LoggedInUser = res.data;
        setCurrentUser(user);

        // 1. Filter Menu Sidebar
        if (user.role === "ADMIN") {
          setFilteredNavLinks(navLinks); // Admin lihat semua
        } else {
          // Kasir hanya lihat yang adminOnly: false
          setFilteredNavLinks(navLinks.filter((link) => !link.adminOnly));
        }

        // 2. MIDDLEWARE LOGIC (Redirect Paksa)
        // Cek apakah halaman yang sedang dibuka adalah halaman khusus Admin
        // Kita cek apakah pathname saat ini cocok dengan salah satu link yang adminOnly: true
        const currentRouteConfig = navLinks.find((link) => link.href === pathname);
        
        // Jika user KASIR mencoba akses halaman ADMIN
        if (user.role !== "ADMIN" && currentRouteConfig?.adminOnly) {
          toast.error("Akses Ditolak", {
            description: "Halaman ini khusus untuk Admin.",
          });
          router.replace("/pos"); // Lempar paksa ke halaman Kasir
        }

        // Tambahan: Jika Kasir mencoba akses root dashboard, lempar ke POS
        if (user.role !== "ADMIN" && pathname === "/dashboard") {
            router.replace("/pos");
        }

      } catch (error) {
        console.error("Gagal memuat user", error);
        // Jika token tidak valid/session habis, middleware.ts akan menangani redirect ke login
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndRole();
  }, [pathname, router]); // Jalankan setiap kali URL berubah

  // Tampilkan loading kosong sampai cek role selesai (mencegah konten admin terlihat sekilas)
  if (isCheckingAuth) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"></div>;
  }

return (
    <div
      className={`
        grid h-screen w-full overflow-hidden transition-all
        ${isCollapsed ? "md:grid-cols-[56px_1fr]" : "md:grid-cols-[240px_1fr]"}
      `}
    >
      {/* 1. SIDEBAR (Desktop) */}
      <div className="hidden border-r bg-background md:block">
        <div className="flex h-full max-h-screen flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <Link
              href={currentUser?.role === "ADMIN" ? "/dashboard" : "/pos"}
              className="flex items-center gap-2 font-semibold"
            >
              <Store className="h-6 w-6 text-primary" />
              {!isCollapsed && <span>My Perfume POS</span>}
            </Link>
          </div>
          
          <nav className="flex-1  items-start px-2 py-4 text-sm font-medium overflow-auto">
            {/* Render Menu yang sudah difilter */}
            <NavLinkItems pathname={pathname} isCollapsed={isCollapsed} links={filteredNavLinks} />
          </nav>

          <div className="mt-auto p-4 border-t">
            {/* Info User Sedang Login */}
            {!isCollapsed && currentUser && (
                <div className="mb-4 px-2 text-xs text-muted-foreground">
                    Login sebagai: <span className="font-bold text-foreground">{currentUser.name}</span> ({currentUser.role})
                </div>
            )}
            <Button
              size={isCollapsed ? "icon" : "sm"}
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className={`h-4 w-4 ${!isCollapsed ? "mr-2" : ""}`} />
              {!isCollapsed && <span>Keluar</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. KONTEN UTAMA (Header Mobile & Main) */}
      <div className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href={currentUser?.role === "ADMIN" ? "/dashboard" : "/pos"}
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Store className="h-6 w-6 text-primary" />
                  <span>My Perfume POS</span>
                </Link>
                <NavLinkItems pathname={pathname} isCollapsed={false} links={filteredNavLinks} />
              </nav>
              <div className="mt-auto">
                <Button size="sm" variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
          </Button>

          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold md:text-xl">
              {navLinks.find((link) => link.href === pathname)?.label || "My Perfume"}
            </h1>
          </div>
        </header>
        
        {/* KONTEN */}
        <main className="flex flex-1 flex-col overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}