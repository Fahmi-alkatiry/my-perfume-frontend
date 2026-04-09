// frontend/src/components/pos/customer-combobox.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "@/lib/axios";
import { Check, ChevronsUpDown, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Kita export interface ini agar bisa dipakai di parent juga
export interface Customer {
  id: number;
  name: string;
  phoneNumber: string;
  points: number;
  nfcCardId?: string;
  rfmSegment?: string;
}

interface CustomerComboboxProps {
  onSelectCustomer: (customer: Customer) => void;
}

const API_URL_CUSTOMERS = "/customers";

export function CustomerCombobox({ onSelectCustomer }: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Definisikan fetchCustomers di luar useEffect agar bisa dipanggil handleKeyDown
  const fetchCustomers = useCallback(async (currentSearch: string) => {
    if (!currentSearch.trim()) {
      setCustomers([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL_CUSTOMERS, {
        params: {
          search: currentSearch.trim(),
          limit: 3,
          sort: "createdAt",
          order: "desc",
        },
      });
      
      const foundData = response.data.data;
      setCustomers(foundData);

      // AUTO-SELECT JIKA SCAN NFC:
      // Jika hasil API cuma 1 dan inputnya panjang (NFC), langsung pilih Fahmi!
      if (foundData.length === 1 && currentSearch.trim().length > 5) {
        onSelectCustomer(foundData[0]);
        setOpen(false);
        setSearch("");
      }
    } catch (error) {
      console.error("Gagal mencari pelanggan:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onSelectCustomer]);

  // 2. Debounce untuk pengetikan manual nama/HP
  useEffect(() => {
    const timer = setTimeout(() => {
      // Hanya fetch otomatis jika bukan hasil dari Enter (NFC)
      fetchCustomers(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchCustomers]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // STOP! Jangan biarkan Command memilih "Salsa" (item pertama) secara otomatis
      e.preventDefault();
      e.stopPropagation();

      if (search.trim().length > 5) {
        // Langsung tembak API sekarang juga (bypass debounce)
        fetchCustomers(search);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <User className="mr-2 h-4 w-4" />
          Pilih Pelanggan...
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          {" "}
          {/* WAJIB: Matikan filter bawaan */}
          <CommandInput
            placeholder="Cari nama, HP, atau scan kartu..."
            value={search}
            onValueChange={setSearch}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            {isLoading && (
              <div className="p-4 text-center text-sm">Mencari...</div>
            )}

            {/* Ganti CommandEmpty bawaan dengan logika manual */}
            {customers.length === 0 && !isLoading && search.length > 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Pelanggan tidak ditemukan.
              </div>
            )}

            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  // Gunakan ID sebagai value agar tidak bentrok dengan teks pencarian
                  value={customer.id.toString()}
                  onSelect={() => {
                    onSelectCustomer(customer);
                    setOpen(false);
                    setSearch(""); // Reset pencarian setelah terpilih
                  }}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {customer.phoneNumber}{" "}
                      {customer.nfcCardId && `• Card: ${customer.nfcCardId}`}
                    </span>
                    {/* Tambahkan Badge Segment (Loyal/Sering) jika perlu */}
                    {customer.rfmSegment && (
                      <span className="text-[10px] bg-primary/10 text-primary w-fit px-1 rounded mt-1">
                        {customer.rfmSegment}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
