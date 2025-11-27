import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Sesuaikan path jika berbeda

export default function NotFound() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">
          404
        </h1>
        <p className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
          Halaman Tidak Ditemukan
        </p>
        <p className="mt-4 text-muted-foreground">
          Maaf, kami tidak dapat menemukan halaman yang Anda cari. Mungkin Anda salah mengetik alamat, atau halaman tersebut telah dipindahkan.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}