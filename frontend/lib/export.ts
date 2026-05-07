// Fonction d'export simple sans pdfkit
export const exportToJSON = (data: any, filename: string) => {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || "")).join(","))
  ];
  
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToExcel = async (data: any[], filename: string) => {
  // Export CSV comme alternative simple
  exportToCSV(data, filename);
};
