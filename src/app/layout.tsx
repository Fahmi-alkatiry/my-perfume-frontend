// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "My Perfume POS",
  description: "Sistem Kasir My Perfume",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased font-sans">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
