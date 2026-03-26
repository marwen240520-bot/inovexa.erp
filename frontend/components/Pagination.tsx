"use client";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{ padding: '8px 12px', background: currentPage === 1 ? '#334155' : '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
      >
        <FaChevronLeft />
      </button>
      {pages.map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          style={{ padding: '8px 16px', background: currentPage === page ? '#667eea' : '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: typeof page === 'number' ? 'pointer' : 'default' }}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{ padding: '8px 12px', background: currentPage === totalPages ? '#334155' : '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
      >
        <FaChevronRight />
      </button>
    </div>
  );
}
