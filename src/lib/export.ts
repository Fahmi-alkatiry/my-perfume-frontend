// frontend/src/lib/export.ts
import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
  // 1. Buat Worksheet dari data JSON
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 2. Buat Workbook baru dan tambahkan worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  // 3. Download file Excel
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};