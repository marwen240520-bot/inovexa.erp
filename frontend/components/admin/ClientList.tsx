"use client";

const ERP_TYPES = {
  pme: { label: '🏪 PME', color: '#10b981' },
  commerce: { label: '🛍️ Commerce', color: '#f59e0b' },
  restaurant: { label: '🍽️ Restaurant', color: '#ef4444' },
  industrie: { label: '🏭 Industrie', color: '#8b5cf6' },
  logistique: { label: '🚚 Logistique', color: '#06b6d4' },
  service: { label: '🧑‍💼 Services', color: '#ec489a' }
};

export default function ClientList({ clients, onExtend, onToggle, onDelete }) {
  const getStatusColor = (status, isActive, subscriptionEnd) => {
    if (!isActive) return { bg: '#333', color: '#94a3b8', text: 'Inactif' };
    if (new Date(subscriptionEnd) < new Date()) return { bg: '#ef444420', color: '#ef4444', text: 'Expiré' };
    return { bg: '#10b98120', color: '#10b981', text: 'Actif' };
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
            <th style={{ padding: '16px 12px', textAlign: 'left' }}>Client</th>
            <th style={{ padding: '16px 12px', textAlign: 'left' }}>Société</th>
            <th style={{ padding: '16px 12px', textAlign: 'left' }}>Type ERP</th>
            <th style={{ padding: '16px 12px', textAlign: 'left' }}>Contact</th>
            <th style={{ padding: '16px 12px', textAlign: 'center' }}>Abonnement</th>
            <th style={{ padding: '16px 12px', textAlign: 'center' }}>Statut</th>
            <th style={{ padding: '16px 12px', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(c => {
            const status = getStatusColor(c.status, c.isActive, c.subscriptionEnd);
            const isExpired = new Date(c.subscriptionEnd) < new Date();
            const daysLeft = Math.ceil((new Date(c.subscriptionEnd) - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px 12px' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: '500' }}>{c.name}</div>
                    <div style={{ color: '#666', fontSize: '12px' }}>ID: {c.id}</div>
                  </div>
                </td>
                <td style={{ padding: '16px 12px', color: '#94a3b8' }}>{c.companyName || '-'}</td>
                <td style={{ padding: '16px 12px' }}>
                  <span style={{
                    background: `${ERP_TYPES[c.erpType]?.color}20`,
                    color: ERP_TYPES[c.erpType]?.color,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {ERP_TYPES[c.erpType]?.label || c.erpType}
                  </span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>{c.email}</div>
                    <div style={{ color: '#666', fontSize: '11px' }}>{c.phone || 'Pas de téléphone'}</div>
                  </div>
                </td>
                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                  <div>
                    <div style={{ color: isExpired ? '#ef4444' : '#10b981', fontSize: '14px', fontWeight: '500' }}>
                      {new Date(c.subscriptionEnd).toLocaleDateString()}
                    </div>
                    {!isExpired && daysLeft > 0 && (
                      <div style={{ color: '#666', fontSize: '11px' }}>{daysLeft} jours restants</div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                  <span style={{
                    background: status.bg,
                    color: status.color,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {status.text}
                  </span>
                </td>
                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => {
                        const days = prompt('Nombre de jours à ajouter:', '30');
                        if (days && !isNaN(parseInt(days))) onExtend(c.id, parseInt(days));
                      }}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Prolonger l'abonnement"
                    >
                      📅 +Jours
                    </button>
                    <button
                      onClick={() => onToggle(c.id)}
                      style={{
                        background: c.isActive ? '#f59e0b' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      title={c.isActive ? "Désactiver" : "Activer"}
                    >
                      {c.isActive ? '🔒 Désactiver' : '🔓 Activer'}
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      title="Supprimer"
                    >
                      🗑️ Suppr
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
