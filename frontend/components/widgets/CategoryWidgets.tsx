"use client";
import { useCategory } from '@/contexts/CategoryContext';

export function CategoryWidgets() {
  const { category, getCategoryInfo } = useCategory();
  const categoryInfo = getCategoryInfo();

  const widgets = {
    restaurant: [
      { icon: '🪑', label: 'Tables occupées', value: '3/10', color: '#ef4444' },
      { icon: '🍽️', label: 'Commandes en cours', value: '5', color: '#f59e0b' },
      { icon: '💰', label: 'CA du jour', value: '1,250€', color: '#10b981' }
    ],
    services: [
      { icon: '📁', label: 'Projets actifs', value: '4', color: '#667eea' },
      { icon: '✅', label: 'Tâches en cours', value: '12', color: '#f59e0b' },
      { icon: '⏱️', label: 'Heures facturables', value: '156h', color: '#10b981' }
    ],
    logistique: [
      { icon: '🚚', label: 'Livraisons en cours', value: '8', color: '#667eea' },
      { icon: '📍', label: 'Colis en transit', value: '23', color: '#f59e0b' },
      { icon: '✅', label: 'Livraisons du jour', value: '12/15', color: '#10b981' }
    ],
    sante: [
      { icon: '👨‍⚕️', label: 'Patients aujourd\'hui', value: '15', color: '#667eea' },
      { icon: '📅', label: 'Rendez-vous', value: '8', color: '#f59e0b' },
      { icon: '🏥', label: 'Lits occupés', value: '12/20', color: '#10b981' }
    ],
    education: [
      { icon: '👨‍🎓', label: 'Étudiants', value: '156', color: '#667eea' },
      { icon: '📚', label: 'Cours actifs', value: '8', color: '#f59e0b' },
      { icon: '📝', label: 'Examens cette semaine', value: '3', color: '#10b981' }
    ],
    commerce: [
      { icon: '🏷️', label: 'Promotions actives', value: '5', color: '#667eea' },
      { icon: '📦', label: 'Stock faible', value: '3', color: '#f59e0b' },
      { icon: '💰', label: 'Ventes aujourd\'hui', value: '2,450€', color: '#10b981' ]
    ]
  };

  const categoryWidgets = widgets[category] || widgets.commerce;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
      {categoryWidgets.map((widget, idx) => (
        <div key={idx} style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '32px' }}>{widget.icon}</div>
            <div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>{widget.label}</div>
              <div style={{ fontSize: '28px', color: widget.color, fontWeight: 'bold' }}>{widget.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
