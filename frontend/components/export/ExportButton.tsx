"use client";
import { useState } from 'react';

export function ExportButton({ type, label = "Exporter", variant = "primary" }) {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('excel');
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (formatType) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:3001/export/${formatType}?type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let extension = '';
        let mimeType = '';
        
        switch(formatType) {
          case 'excel':
            extension = '.xlsx';
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            break;
          case 'pdf':
            extension = '.pdf';
            mimeType = 'application/pdf';
            break;
          case 'csv':
            extension = '.csv';
            mimeType = 'text/csv';
            break;
          case 'json':
            extension = '.json';
            mimeType = 'application/json';
            break;
        }
        
        const filename = `${type}_${new Date().toISOString().slice(0, 19)}${extension}`;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Erreur lors de l\'exportation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const formats = [
    { id: 'excel', name: '📊 Excel (.xlsx)', icon: '📊' },
    { id: 'pdf', name: '📄 PDF (.pdf)', icon: '📄' },
    { id: 'csv', name: '📋 CSV (.csv)', icon: '📋' },
    { id: 'json', name: '🔧 JSON (.json)', icon: '🔧' }
  ];

  const getButtonStyle = () => {
    switch(variant) {
      case 'primary':
        return { background: '#667eea', color: 'white' };
      case 'secondary':
        return { background: '#1a1a1a', color: '#94a3b8', border: '1px solid #333' };
      case 'success':
        return { background: '#10b981', color: 'white' };
      default:
        return { background: '#667eea', color: 'white' };
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        style={{
          padding: '10px 20px',
          ...getButtonStyle(),
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? '⏳' : '📥'} {label}
      </button>
      
      {showMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
            onClick={() => setShowMenu(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: '#111',
              borderRadius: '12px',
              border: '1px solid #222',
              overflow: 'hidden',
              zIndex: 999,
              minWidth: '180px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            {formats.map(f => (
              <button
                key={f.id}
                onClick={() => handleExport(f.id)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#94a3b8',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span>{f.icon}</span>
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ExportSection({ type, title }) {
  return (
    <div style={{
      background: '#111',
      borderRadius: '20px',
      padding: '20px',
      border: '1px solid #222',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h3 style={{ color: 'white', marginBottom: '4px' }}>{title}</h3>
          <p style={{ color: '#94a3b8', fontSize: '12px' }}>Exportez vos données au format souhaité</p>
        </div>
        <ExportButton type={type} label="Exporter" variant="primary" />
      </div>
    </div>
  );
}
