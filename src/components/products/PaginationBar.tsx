"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationInfo {
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface PaginationBarProps {
  paginationInfo: PaginationInfo;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export function PaginationBar({
  paginationInfo,
  isLoading = false,
  onPageChange,
}: PaginationBarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
      <span className="text-sm text-muted-foreground">
        Total {paginationInfo.totalCount} produk
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(paginationInfo.currentPage - 1)}
          disabled={paginationInfo.currentPage <= 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Sebelumnya</span>
        </Button>

        <span className="text-sm font-medium">
          Halaman {paginationInfo.currentPage} dari {paginationInfo.totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(paginationInfo.currentPage + 1)}
          disabled={
            paginationInfo.currentPage >= paginationInfo.totalPages || isLoading
          }
        >
          <span className="mr-2 hidden sm:inline">Berikutnya</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
