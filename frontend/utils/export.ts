import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, ${fileName}.xlsx);
};
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (data: any[], columns: string[], fileName: string) => {
  const doc = new jsPDF();
  doc.text(fileName, 14, 15);
  autoTable(doc, {
    head: [columns],
    body: data.map(item => columns.map(col => item[col.toLowerCase().replace(/ /g, '_')] || '')),
    startY: 25,
  });
  doc.save(${fileName}.pdf);
};
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (data: any[], columns: string[], fileName: string, title: string) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(Généré le: , 14, 22);
  autoTable(doc, {
    head: [columns],
    body: data.map(item => columns.map(col => item[col.toLowerCase().replace(/ /g, '_')] || '')),
    startY: 30,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [139, 92, 246] },
  });
  doc.save(${fileName}.pdf);
};
