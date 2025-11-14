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
} from "lucide-react";
import { ReactNode, useState } from "react";

// --- Data Link Navigasi ---
const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Kasir", icon: TabletSmartphone },
  { href: "/reports", label: "Laporan Transaksi", icon: LineChart },
  { href: "/reports/stock", label: "Riwayat Stok", icon: Archive },
  { href: "/products", label: "Produk", icon: Package },
  { href: "/customers", label: "Pelanggan", icon: Users },
  { href: "/payment-methods", label: "Metode Bayar", icon: CreditCard },
];

// --- Komponen NavLinkItems (Di luar render) ---
function NavLinkItems({
  pathname,
  isCollapsed,
}: {
  pathname: string;
  isCollapsed: boolean;
}) {
  return (
    <>
      {navLinks.map((link) => {
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

  const handleLogout = () => {
    Cookies.remove("token");
    toast.success("Anda berhasil logout.");
    router.push("/login");
  };

  return (
    <div
      className={`
        grid h-screen w-full overflow-hidden transition-all
        ${isCollapsed ? "md:grid-cols-[56px_1fr]" : "md:grid-cols-[240px_1fr]"}
      `}
    >
      {/* 1. SIDEBAR (Hanya Desktop) */}
      <div className="hidden border-r bg-background md:block">
        <div className="flex h-full max-h-screen flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold"
            >
              <Store className="h-6 w-6 text-primary" />
              {!isCollapsed && <span>My Perfume POS</span>}
            </Link>
          </div>
          
          <nav className="flex-1 grid items-start px-2 py-4 text-sm font-medium overflow-auto">
            <NavLinkItems pathname={pathname} isCollapsed={isCollapsed} />
          </nav>

          <div className="mt-auto p-4 border-t">
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

      {/* 2. KONTEN UTAMA (dan Header Mobile) */}
      <div className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
          {/* Trigger untuk Mobile (md:hidden) */}
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
                  href="/dashboard"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Store className="h-6 w-6 text-primary" />
                  <span>My Perfume POS</span>
                </Link>
                <NavLinkItems pathname={pathname} isCollapsed={false} />
              </nav>
              <div className="mt-auto">
                <Button size="sm" variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Trigger untuk Desktop (hidden md:flex) */}
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
              {navLinks.find((link) => link.href === pathname)?.label || "Dashboard"}
            </h1>
          </div>
        </header>
        
        {/* KONTEN HALAMAN (INI YANG AKAN SCROLL) */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}