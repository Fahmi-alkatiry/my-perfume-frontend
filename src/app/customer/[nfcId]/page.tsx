"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  CreditCard,
  ShoppingBag,
  Star,
  Award,
  Calendar,
  Phone,
  User,
  History,
  CheckCircle2,
  Package,
} from "lucide-react";

interface Product {
  name: string;
}

interface TransactionDetail {
  id: number;
  quantity: number;
  priceAtTransaction: number;
  subtotal: number;
  product: Product;
}

interface Transaction {
  id: number;
  createdAt: string;
  finalAmount: number;
  status: string;
  details: TransactionDetail[];
}

interface CustomerData {
  id: number;
  name: string;
  phoneNumber: string;
  points: number;
  nfcCardId: string;
  rfmSegment: string | null;
  createdAt: string;
  transactions: Transaction[];
}

export default function CustomerPublicProfile() {
  const params = useParams();
  const nfcId = params.nfcId as string;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        // decodeURIComponent in case of special characters
        const decodedId = decodeURIComponent(nfcId);
        const res = await axiosInstance.get(`/public/customers/nfc/${decodedId}`);
        setCustomer(res.data);
      } catch (err: any) {
        console.error(err);
        if (err.response && err.response.status === 404) {
          setError("Pelanggan tidak ditemukan. Pastikan kartu NFC yang di-tap benar.");
        } else {
          setError("Gagal memuat data pelanggan. Coba lagi nanti.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (nfcId) {
      fetchCustomerData();
    }
  }, [nfcId]);

  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900">
        <div className="relative flex justify-center items-center h-20 w-20">
          <div className="absolute animate-ping inline-flex h-full w-full rounded-full bg-slate-300 opacity-75"></div>
          <div className="relative inline-flex rounded-full h-10 w-10 bg-slate-800"></div>
        </div>
        <p className="mt-6 text-slate-500 font-medium tracking-wide animate-pulse">
          Membaca Data Kartu...
        </p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-md w-full shadow-lg text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Ditolak</h2>
            <p className="text-slate-500 leading-relaxed text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-slate-200">
      <main className="max-w-3xl mx-auto px-4 py-10 md:py-16 space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-block p-3 rounded-xl bg-white border border-slate-200 shadow-sm mb-2">
            <Star className="w-6 h-6 text-slate-800" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            My Perfume Member
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Detail Membership & Riwayat Belanja
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                  {customer.name}
                </h2>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phoneNumber || "Tidak ada nomor HP"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" /> Total Poin
                  </span>
                  <span className="text-xl font-bold text-slate-900">
                    {customer.points}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Bergabung
                  </span>
                  <span className="text-base font-bold text-slate-900 leading-tight">
                    {format(new Date(customer.createdAt), "MMM yyyy", { locale: id })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Segment / Status Badge (Optional) */}
        {customer.rfmSegment && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-slate-700 text-sm font-medium shadow-sm">
              <Award className="w-4 h-4 text-slate-400" />
              Segment: {customer.rfmSegment}
            </div>
          </div>
        )}

        {/* Transaction History Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3 px-1 mb-2">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-md">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Riwayat Transaksi</h3>
            <span className="ml-auto text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
              {customer.transactions.length} Terakhir
            </span>
          </div>

          {customer.transactions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">Belum ada riwayat belanja.</p>
              <p className="text-sm text-slate-400 mt-1">Ayo mulai belanja dan kumpulkan poinmu!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customer.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                          Sukses
                        </span>
                        <span className="text-slate-300 text-xs">•</span>
                        <span className="text-slate-500 text-xs font-medium">
                          {format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs font-medium">
                        ID Transaksi: <span className="text-slate-800">#{tx.id}</span>
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                        Total Belanja
                      </p>
                      <p className="text-lg font-bold text-slate-900 tracking-tight">
                        {formatRupiah(tx.finalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white">
                    <ul className="space-y-3">
                      {tx.details.map((detail) => (
                        <li key={detail.id} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-800 font-medium text-sm truncate">
                              {detail.product.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs">
                              <span className="text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                                {detail.quantity}x
                              </span>
                              <span className="text-slate-500">
                                @ {formatRupiah(detail.priceAtTransaction)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right pt-1">
                            <span className="text-slate-700 font-semibold text-sm">
                              {formatRupiah(detail.subtotal)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="pt-6 pb-2 text-center">
            <p className="text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5">
                Powered by <span className="text-slate-600 font-bold">My Perfume POS</span>
            </p>
        </div>
      </main>
    </div>
  );
}
