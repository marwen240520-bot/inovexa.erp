"use client";
import { useState } from "react";

export default function DataTable({ 
  columns, 
  data, 
  actions, 
  searchable = true,
  searchPlaceholder = "🔍 Rechercher...",
  itemsPerPage = 10,
  onRowClick
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter(row => 
    searchTerm === "" || columns.some(col => 
      String(row[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid #222" }}>
      {searchable && (
        <div style={{ marginBottom: "20px" }}>
          <input 
            type="text" 
            placeholder={searchPlaceholder} 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }}
          />
        </div>
      )}
      
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #222", color: "#94a3b8" }}>
              {columns.map(col => (
                <th key={col.key} style={{ padding: "12px", textAlign: col.align || "left", width: col.width }}>{col.label}</th>
              ))}
              {actions && <th style={{ padding: "12px", textAlign: "center", width: "100px" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr 
                key={idx} 
                style={{ borderBottom: "1px solid #1a1a1a", cursor: onRowClick ? "pointer" : "default" }}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map(col => (
                  <td key={col.key} style={{ padding: "12px", textAlign: col.align || "left", color: col.color ? row[col.key] > 0 ? "#10b981" : "#94a3b8" : "#fff" }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && <td style={{ padding: "12px", textAlign: "center" }}>{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
            style={{ padding: "8px 12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px", color: "white", cursor: "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            ◀
          </button>
          <span style={{ color: "#94a3b8", padding: "8px 12px" }}>Page {currentPage} / {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages}
            style={{ padding: "8px 12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px", color: "white", cursor: "pointer", opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}
