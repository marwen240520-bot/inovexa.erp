"use client";
import { useState } from 'react';
import { FaFilter, FaTimes } from 'react-icons/fa';

export default function Filters({ onFilter, onReset }) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '' });

  const applyFilters = () => { onFilter(filters); setOpen(false); };
  const resetFilters = () => { setFilters({ status: '', dateFrom: '', dateTo: '' }); onReset(); };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ background: '#1e293b', color: '#94a3b8', padding: '10px 16px', border: '1px solid #334155', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FaFilter /> Filtres
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '20px', width: '280px', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ color: 'white' }}>Filtres</h4>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
          </div>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: 'white' }}>
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="paid">Payé</option>
            <option value="delivered">Livré</option>
          </select>
          <input type="date" placeholder="Date début" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: 'white' }} />
          <input type="date" placeholder="Date fin" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: 'white' }} />
          <button onClick={applyFilters} style={{ width: '100%', padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px' }}>Appliquer</button>
          <button onClick={resetFilters} style={{ width: '100%', padding: '10px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Réinitialiser</button>
        </div>
      )}
    </div>
  );
}
