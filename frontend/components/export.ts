"use client";
import * as XLSX from 'xlsx';
import { showToast } from './ToastProvider';

export const exportToExcel = (data, filename) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    showToast.success('Export réussi !');
  } catch (err) {
    showToast.error('Erreur lors de l\'export');
  }
};

export const exportToPDF = async (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf().from(element).set({ filename: `${filename}.pdf`, margin: 1 }).save();
    showToast.success('PDF généré !');
  } catch (err) {
    showToast.error('Erreur PDF');
  }
};
