"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterValues = {
  search: string;
  type?: string;
  sortByStock?: string;
  sortByPrice?: string;
};

interface ProductFilterBarProps {
  onChange: (filters: FilterValues) => void;
}

export function ProductFilterBar({ onChange }: ProductFilterBarProps) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string | undefined>(undefined);
  const [sortByStock, setSortByStock] = useState<string | undefined>(undefined);
  const [sortByPrice, setSortByPrice] = useState<string | undefined>(undefined);

 useEffect(() => {
  onChange({
    search,
    type: type === "ALL" ? undefined : type,
    sortByStock: sortByStock === "DEFAULT" ? undefined : sortByStock,
    sortByPrice: sortByPrice === "DEFAULT" ? undefined : sortByPrice,
  });
}, [search, type, sortByStock, sortByPrice]);

  return (
    <div className="flex flex-row flex-wrap gap-2 mb-4 items-center">
      <Input
        placeholder="Cari produk..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-[280px]"
      />

      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Semua Jenis" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Semua</SelectItem>
          <SelectItem value="PERFUME">Perfume</SelectItem>
          <SelectItem value="BOTTLE">Botol</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortByStock} onValueChange={setSortByStock}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Urutkan Stok" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DEFAULT">Default</SelectItem>
          <SelectItem value="lowest">Stok Terendah</SelectItem>
          <SelectItem value="highest">Stok Tertinggi</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortByPrice} onValueChange={setSortByPrice}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Urutkan Harga" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DEFAULT">Default</SelectItem>
          <SelectItem value="lowest">Harga Terendah</SelectItem>
          <SelectItem value="highest">Harga Tertinggi</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => {
          setSearch("");
          setType(undefined);
          setSortByStock(undefined);
          setSortByPrice(undefined);
        }}
      >
        Reset
      </Button>
    </div>
  );
}
