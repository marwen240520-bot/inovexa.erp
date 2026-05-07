"use client";
import { useState } from 'react';

const ERP_TYPES = [
  { 
    value: 'pme', 
    label: '🏪 PME (Petites et Moyennes Entreprises)', 
    description: 'Finance, Ventes, Stock simple',
    color: '#10b981',
    modules: ['💰 Finance', '👥 Ventes/CRM', '📦 Stock simple', '📊 Dashboard']
  },
  { 
    value: 'commerce', 
    label: '🛍️ Commerce / Magasin', 
    description: 'Stock temps réel, Ventes, Facturation',
    color: '#f59e0b',
    modules: ['📦 Stock temps réel', '💰 Ventes', '🧾 Facturation', '⚠️ Alertes stock']
  },
  { 
    value: 'restaurant', 
    label: '🍽️ Restaurant / Café', 
    description: 'Commandes, Stock ingrédients, RH',
    color: '#ef4444',
    modules: ['📝 Commandes', '📦 Stock ingrédients', '👥 Personnel', '💰 Ventes']
  },
  { 
    value: 'industrie', 
    label: '🏭 Industrie / Production', 
    description: 'Production, Stock avancé, Qualité',
    color: '#8b5cf6',
    modules: ['🏭 Production', '📦 Stock avancé', '💰 Finance', '✅ Qualité']
  },
  { 
    value: 'logistique', 
    label: '🚚 Logistique / Transport', 
    description: 'Suivi livraisons, Tracking',
    color: '#06b6d4',
    modules: ['🚚 Suivi livraisons', '📍 Tracking', '📦 Stock', '🔔 Notifications']
  },
  { 
    value: 'service', 
    label: '🧑‍💼 Société de services', 
    description: 'CRM, Finance, Projets',
    color: '#ec489a',
    modules: ['👥 CRM', '💰 Finance', '📋 Projets', '👥 RH']
  }
];

const DURATION_OPTIONS = [
  { value: 7, label: '7 jours (1 semaine)', price: '50 €' },
  { value: 30, label: '30 jours (1 mois)', price: '150 €' },
  { value: 90, label: '90 jours (3 mois)', price: '400 €' },
  { value: 180, label: '180 jours (6 mois)', price: '700 €' },
  { value: 365, label: '365 jours (1 an)', price: '1200 €' }
];

export default function ClientFormModal({ isOpen, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    erpType: 'pme',
    subscriptionDuration: 30
  });
  const [errors, setErrors] = useState({});
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [selectedErp, setSelectedErp] = useState(ERP_TYPES[0]);

  if (!isOpen) return null;

  const handleErpChange = (value) => {
    setForm({ ...form, erpType: value });
    setSelectedErp(ERP_TYPES.find(e => e.value === value) || ERP_TYPES[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!form.name) newErrors.name = 'Nom requis';
    if (!form.email) newErrors.email = 'Email requis';
    if (!form.password) newErrors.password = 'Mot de passe requis';
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      setPasswordMatch(false);
    } else {
      setPasswordMatch(true);
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit(form);
  };

  const selectedDuration = DURATION_OPTIONS.find(d => d.value === form.subscriptionDuration);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: '#111',
        borderRadius: '32px',
        width: '650px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid #222',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #222',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '4px' }}>➕ Nouveau client</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Créez un compte client avec son type d'ERP</p>
          </div>
          <button onClick={onClose} style={{
            background: '#1a1a1a',
            border: 'none',
            color: '#94a3b8',
            fontSize: '24px',
            cursor: 'pointer',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          {/* Informations personnelles */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '16px' }}>👤 Informations personnelles</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Nom complet *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1a1a1a',
                    border: `1px solid ${errors.name ? '#ef4444' : '#333'}`,
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
                {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.name}</p>}
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Nom de la société</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#1a1a1a',
                  border: `1px solid ${errors.email ? '#ef4444' : '#333'}`,
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Mot de passe *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1a1a1a',
                    border: `1px solid ${errors.password ? '#ef4444' : '#333'}`,
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
                {errors.password && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Confirmer mot de passe *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1a1a1a',
                    border: `1px solid ${!passwordMatch ? '#ef4444' : '#333'}`,
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
                {!passwordMatch && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>Les mots de passe ne correspondent pas</p>}
              </div>
            </div>

            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Type d'ERP */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '16px' }}>🏢 Type d'ERP</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {ERP_TYPES.map(erp => (
                <div
                  key={erp.value}
                  onClick={() => handleErpChange(erp.value)}
                  style={{
                    padding: '16px',
                    background: form.erpType === erp.value ? `rgba(${parseInt(erp.color.slice(1,3), 16)}, ${parseInt(erp.color.slice(3,5), 16)}, ${parseInt(erp.color.slice(5,7), 16)}, 0.1)` : '#1a1a1a',
                    border: `2px solid ${form.erpType === erp.value ? erp.color : '#333'}`,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{erp.label.split(' ')[0]}</div>
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>{erp.label}</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '8px' }}>{erp.description}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {erp.modules.slice(0, 2).map(mod => (
                      <span key={mod} style={{ background: '#333', color: '#94a3b8', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>{mod}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modules détaillés */}
            <div style={{
              background: '#1a1a1a',
              borderRadius: '16px',
              padding: '16px',
              border: `1px solid ${selectedErp.color}`
            }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '12px' }}>📋 Modules inclus :</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedErp.modules.map(mod => (
                  <span key={mod} style={{ background: `rgba(${parseInt(selectedErp.color.slice(1,3), 16)}, ${parseInt(selectedErp.color.slice(3,5), 16)}, ${parseInt(selectedErp.color.slice(5,7), 16)}, 0.2)`, color: selectedErp.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Abonnement */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '16px' }}>📅 Durée d'abonnement</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {DURATION_OPTIONS.map(dur => (
                <div
                  key={dur.value}
                  onClick={() => setForm({ ...form, subscriptionDuration: dur.value })}
                  style={{
                    textAlign: 'center',
                    padding: '12px',
                    background: form.subscriptionDuration === dur.value ? '#667eea' : '#1a1a1a',
                    border: `1px solid ${form.subscriptionDuration === dur.value ? '#667eea' : '#333'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{dur.value}j</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px' }}>{dur.price}</div>
                </div>
              ))}
            </div>

            <div style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Total à payer</span>
                <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{selectedDuration?.price}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Date d'expiration</span>
                <div style={{ color: '#10b981', fontSize: '14px' }}>
                  {new Date(Date.now() + form.subscriptionDuration * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '14px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Création en cours...' : '✅ Créer le client'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                background: '#333',
                color: '#94a3b8',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
