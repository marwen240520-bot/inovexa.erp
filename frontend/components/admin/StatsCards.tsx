"use client";

const ERP_TYPES = {
  pme: { label: '🏪 PME', color: '#10b981' },
  commerce: { label: '🛍️ Commerce', color: '#f59e0b' },
  restaurant: { label: '🍽️ Restaurant', color: '#ef4444' },
  industrie: { label: '🏭 Industrie', color: '#8b5cf6' },
  logistique: { label: '🚚 Logistique', color: '#06b6d4' },
  service: { label: '🧑‍💼 Services', color: '#ec489a' }
};

export default function StatsCards({ stats }) {
  const totalClients = stats.totalClients || 0;
  const activeClients = stats.activeClients || 0;
  const expiredClients = totalClients - activeClients;
  const activationRate = totalClients > 0 ? (activeClients / totalClients * 100).toFixed(1) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
      <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '32px' }}>👥</span>
          <div>
            <div style={{ fontSize: '28px', color: 'white', fontWeight: 'bold' }}>{totalClients}</div>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>Total clients</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '32px' }}>✅</span>
          <div>
            <div style={{ fontSize: '28px', color: '#10b981', fontWeight: 'bold' }}>{activeClients}</div>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>Clients actifs</div>
          </div>
        </div>
        <div style={{ height: '4px', background: '#222', borderRadius: '2px', marginTop: '8px' }}>
          <div style={{ width: `${activationRate}%`, height: '4px', background: '#10b981', borderRadius: '2px' }}></div>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Taux d'activation: {activationRate}%</div>
      </div>

      <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '32px' }}>⚠️</span>
          <div>
            <div style={{ fontSize: '28px', color: '#f59e0b', fontWeight: 'bold' }}>{expiredClients}</div>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>Abonnements expirés</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' }}>
        <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>📊 Répartition par type</div>
        {stats.clientsByType?.map((type, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: ERP_TYPES[type.type]?.color || '#667eea', fontSize: '12px' }}>
              {ERP_TYPES[type.type]?.label || type.type}
            </span>
            <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>{type.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
