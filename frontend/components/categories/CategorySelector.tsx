"use client";
import { useState } from 'react';
import { categoriesConfig } from '@/config/categories';

export function CategorySelector({ selected, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = Object.values(categoriesConfig).filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Rechercher une catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--theme-surface-hover)',
            border: '1px solid var(--theme-border)',
            borderRadius: '10px',
            color: 'var(--theme-text)'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
        {filteredCategories.map(cat => (
          <div
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            style={{
              padding: '16px',
              background: selected === cat.id ? `linear-gradient(135deg, ${cat.color}20 0%, var(--theme-surface-hover) 100%)` : 'var(--theme-surface-hover)',
              border: selected === cat.id ? `2px solid ${cat.color}` : '1px solid var(--theme-border)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '32px' }}>{cat.icon}</div>
              <div>
                <div style={{ color: 'var(--theme-text)', fontWeight: 'bold' }}>{cat.name}</div>
                <div style={{ color: 'var(--theme-text-secondary)', fontSize: '12px' }}>{cat.description}</div>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: '#667eea', marginBottom: '4px' }}>📦 Modules principaux</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {cat.modules.main.slice(0, 3).map(m => (
                  <span key={m.id} style={{ background: 'var(--theme-surface-hover)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', color: 'var(--theme-text-secondary)' }}>
                    {m.icon} {m.name}
                  </span>
                ))}
                {cat.modules.main.length > 3 && (
                  <span style={{ background: 'var(--theme-surface-hover)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', color: 'var(--theme-text-secondary)' }}>
                    +{cat.modules.main.length - 3}
                  </span>
                )}
              </div>

              <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '8px', marginBottom: '4px' }}>🚀 Modules avancés</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {cat.modules.advanced.slice(0, 2).map(m => (
                  <span key={m.id} style={{ background: 'var(--theme-surface-hover)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', color: '#f59e0b' }}>
                    {m.icon} {m.name}
                  </span>
                ))}
                {cat.modules.advanced.length > 2 && (
                  <span style={{ background: 'var(--theme-surface-hover)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', color: '#f59e0b' }}>
                    +{cat.modules.advanced.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
