"use client";
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

export default function SearchBar({ onSearch, placeholder = "Rechercher..." }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 40px 12px 16px',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          color: 'white',
          fontSize: '14px',
          outline: 'none',
          transition: 'all 0.3s'
        }}
      />
      <button type="submit" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
        <FaSearch />
      </button>
    </form>
  );
}
