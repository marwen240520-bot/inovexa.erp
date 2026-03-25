import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};

export const exportToPDF = (data: any[], fileName: string, columns: string[]) => {
  const doc = new jsPDF();
  doc.text(fileName, 14, 10);
  autoTable(doc, {
    head: [columns],
    body: data.map(item => columns.map(col => item[col.toLowerCase()] || '')),
    startY: 20,
  });
  doc.save(`${fileName}.pdf`);
};