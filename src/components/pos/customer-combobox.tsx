// frontend/src/components/pos/customer-combobox.tsx
"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(API_URL_CUSTOMERS, {
          params: {
            search,
            limit: 3,
            sort: "createdAt",
            order: "desc",
          },
        });
        setCustomers(response.data.data);
      } catch (error) {
        console.error("Gagal mencari pelanggan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce 300ms
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

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
        <Command>
          <CommandInput
            placeholder="Cari nama atau nomor HP..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="p-4 text-center text-sm">Mencari...</div>
            )}
            <CommandEmpty>
              {isLoading ? "Mencari..." : "Pelanggan tidak ditemukan."}
            </CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.name} - ${customer.phoneNumber}`}
                  onSelect={() => {
                    onSelectCustomer(customer);
                    setOpen(false);
                  }}
                >
                  <Check className={"mr-2 h-4 w-4 opacity-0"} />
                  <div>
                    <p>{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.phoneNumber} (Poin: {customer.points})
                    </p>
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
