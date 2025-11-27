import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rute yang dianggap sebagai rute "privat"
const protectedRoutes = [
  '/dashboard',
  '/pos',
  '/products',
  '/customers',
  '/reports',
  '/payment-methods',
];

// Fungsi untuk mengecek apakah path adalah rute privat
function isProtectedRoute(pathname: string) {
  // Cek apakah pathname dimulai dengan salah satu rute di atas
  // (misal: /reports/stock juga akan cocok)
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

export function middleware(request: NextRequest) {
  // Ambil token dari cookie
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Jika pengguna MEMILIKI TOKEN
  if (token) {
    // Jika mereka mencoba mengakses /login atau halaman root (/)
    if (pathname === '/login' || pathname === '/') {
      // Arahkan mereka ke dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. Jika pengguna TIDAK MEMILIKI TOKEN
  if (!token) {
    // Dan mereka mencoba mengakses halaman root (/)
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Dan mereka mencoba mengakses rute privat
    if (isProtectedRoute(pathname)) {
      // Arahkan mereka ke /login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Jika tidak ada kondisi di atas, lanjutkan seperti biasa
  return NextResponse.next();
}

// Tentukan rute mana saja yang akan menjalankan middleware ini
export const config = {
  matcher: [
    /*
     * Cocokkan semua rute KECUALI yang ada di bawah:
     * - _next/static (file statis)
     * - _next/image (optimasi gambar)
     * - favicon.ico (ikon favorit)
     * Ini penting agar middleware tidak berjalan pada file aset.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};