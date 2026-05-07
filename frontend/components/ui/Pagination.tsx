"use client";

export default function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage = 10 }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "24px", flexWrap: "wrap" }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: "8px 12px",
          background: currentPage === 1 ? "#1a1a1a" : "#667eea",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          opacity: currentPage === 1 ? 0.5 : 1
        }}
      >
        ◀ Précédent
      </button>
      
      {getPageNumbers().map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            padding: "8px 12px",
            minWidth: "36px",
            background: currentPage === page ? "#667eea" : "#1a1a1a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: "8px 12px",
          background: currentPage === totalPages ? "#1a1a1a" : "#667eea",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          opacity: currentPage === totalPages ? 0.5 : 1
        }}
      >
        Suivant ▶
      </button>
    </div>
  );
}
