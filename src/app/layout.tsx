// frontend/src/app/layout.tsx
import type { Metadata } from "next"; // Impor Metadata (opsional)
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

// (Opsional) Tambahkan metadata dasar untuk SEO
export const metadata: Metadata = {
  title: "My Perfume POS",
  description: "Sistem Kasir My Perfume",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Tidak perlu 'useEffect' atau 'useRouter' lagi.
  // Middleware menangani keamanannya.

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}