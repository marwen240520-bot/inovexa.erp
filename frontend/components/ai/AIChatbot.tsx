"use client";
import { useState, useEffect } from 'react';
import { useCategory } from '@/contexts/CategoryContext';

// Configuration IA par catégorie
const aiConfig = {
  pme: {
    name: 'Assistant PME',
    icon: '🏪',
    color: '#667eea',
    suggestions: [
      'Quel est mon chiffre d\'affaires ?',
      'Quels sont mes produits les plus vendus ?',
      'Analyse mes performances financières',
      'Prévisions pour le mois prochain'
    ],
    actions: {
      sales: 'Analyser les ventes',
      finance: 'Rapport financier',
      forecast: 'Prévisions',
      optimization: 'Optimisation des coûts'
    }
  },
  commerce: {
    name: 'Assistant Commerce',
    icon: '🛍️',
    color: '#10b981',
    suggestions: [
      'Quel est le stock le plus bas ?',
      'Quelles sont mes meilleures ventes ?',
      'Suggestions de réapprovisionnement',
      'Analyse des promotions'
    ],
    actions: {
      stock: 'Alertes stock',
      sales: 'Top produits',
      reorder: 'Réapprovisionnement',
      promotions: 'Analyse promotions'
    }
  },
  restaurant: {
    name: 'Assistant Restaurant',
    icon: '🍽️',
    color: '#f59e0b',
    suggestions: [
      'Quels sont les plats les plus commandés ?',
      'Analyse du chiffre d\'affaires par jour',
      'Gestion des tables',
      'Prévisions d\'affluence'
    ],
    actions: {
      menu: 'Plats populaires',
      tables: 'Occupation tables',
      revenue: 'CA journalier',
      forecast: 'Prévisions affluence'
    }
  },
  industrie: {
    name: 'Assistant Industrie',
    icon: '🏭',
    color: '#ef4444',
    suggestions: [
      'État de la production',
      'Alertes maintenance',
      'Contrôle qualité',
      'Performance des machines'
    ],
    actions: {
      production: 'Suivi production',
      maintenance: 'Maintenance préventive',
      quality: 'Contrôle qualité',
      performance: 'Indicateurs performance'
    }
  },
  logistique: {
    name: 'Assistant Logistique',
    icon: '🚚',
    color: '#3b82f6',
    suggestions: [
      'Suivi des livraisons en cours',
      'Optimisation des tournées',
      'Retards potentiels',
      'Performance des chauffeurs'
    ],
    actions: {
      tracking: 'Tracking en direct',
      routes: 'Optimisation tournées',
      delays: 'Alertes retards',
      drivers: 'Performance chauffeurs'
    }
  },
  services: {
    name: 'Assistant Services',
    icon: '🧑‍💼',
    color: '#8b5cf6',
    suggestions: [
      'Avancement des projets',
      'Charge de travail',
      'Satisfaction client',
      'Facturation en attente'
    ],
    actions: {
      projects: 'Projets en cours',
      workload: 'Charge de travail',
      satisfaction: 'Satisfaction client',
      billing: 'Facturation'
    }
  },
  ecommerce: {
    name: 'Assistant E-commerce',
    icon: '🛒',
    color: '#ec489a',
    suggestions: [
      'Taux de conversion',
      'Produits populaires',
      'Panier moyen',
      'Analyse des abandons'
    ],
    actions: {
      conversion: 'Taux conversion',
      topProducts: 'Top produits',
      cart: 'Panier moyen',
      abandonment: 'Abandons panier'
    }
  },
  btp: {
    name: 'Assistant BTP',
    icon: '🏗️',
    color: '#f97316',
    suggestions: [
      'Avancement des chantiers',
      'Consommation matériaux',
      'Respect des délais',
      'Budget par chantier'
    ],
    actions: {
      sites: 'Avancement chantiers',
      materials: 'Consommation',
      deadlines: 'Respect délais',
      budget: 'Suivi budget'
    }
  },
  sante: {
    name: 'Assistant Santé',
    icon: '🏥',
    color: '#14b8a6',
    suggestions: [
      'Rendez-vous du jour',
      'Patients à risque',
      'Temps d\'attente',
      'Rappels médicaments'
    ],
    actions: {
      appointments: 'Rendez-vous',
      patients: 'Patients à risque',
      waiting: 'Temps attente',
      reminders: 'Rappels'
    }
  },
  education: {
    name: 'Assistant Éducation',
    icon: '🎓',
    color: '#a855f7',
    suggestions: [
      'Notes des étudiants',
      'Présences',
      'Résultats par classe',
      'Alertes difficultés'
    ],
    actions: {
      grades: 'Moyennes',
      attendance: 'Présences',
      results: 'Résultats',
      alerts: 'Alertes'
    }
  }
};

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const { category, getCategoryInfo } = useCategory();
  const categoryInfo = getCategoryInfo();
  const config = aiConfig[category] || aiConfig.pme;

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `👋 Bonjour ! Je suis ${config.name}, votre assistant IA. Comment puis-je vous aider aujourd'hui ?`,
          timestamp: new Date()
        }
      ]);
      setSuggestions(config.suggestions);
    }
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: input,
          category: category 
        })
      });

      const data = await res.json();
      const botMessage = { 
        role: 'assistant', 
        content: data.response || getFallbackResponse(input, category),
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: getFallbackResponse(input, category),
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackResponse = (query, cat) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('vente') || lowerQuery.includes('chiffre')) {
      return `📊 Pour analyser vos ventes, allez dans le module Ventes. Vous y trouverez le détail de votre chiffre d'affaires.`;
    }
    if (lowerQuery.includes('stock') || lowerQuery.includes('produit')) {
      return `📦 Pour gérer votre stock, consultez le module Stock. Vous pourrez voir les niveaux et recevoir des alertes.`;
    }
    if (lowerQuery.includes('client')) {
      return `👥 Pour gérer vos clients, utilisez le module Clients. Vous pouvez ajouter, modifier et suivre vos relations clients.`;
    }
    if (lowerQuery.includes('facture')) {
      return `🧾 Pour vos factures, allez dans le module Factures. Vous pouvez les créer, les payer et les exporter en PDF.`;
    }
    
    return `Je peux vous aider avec les ${config.name === 'Assistant Restaurant' ? 'commandes, tables, menu' : 
            config.name === 'Assistant Commerce' ? 'stocks, ventes, promotions' :
            config.name === 'Assistant Industrie' ? 'production, maintenance, qualité' :
            config.name === 'Assistant Logistique' ? 'livraisons, tracking, tournées' :
            config.name === 'Assistant Services' ? 'projets, tâches, clients' :
            config.name === 'Assistant E-commerce' ? 'ventes, conversion, marketing' :
            config.name === 'Assistant BTP' ? 'chantiers, matériaux, planning' :
            config.name === 'Assistant Santé' ? 'patients, rendez-vous, dossiers' :
            config.name === 'Assistant Éducation' ? 'étudiants, cours, notes' :
            'finance, CRM, stock'}. Que voulez-vous savoir ?`;
  };

  const handleSuggestion = (suggestion) => {
    setInput(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          background: `linear-gradient(135deg, ${config.color}, ${config.color}80)`,
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🤖
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '400px',
            height: '600px',
            background: '#111',
            borderRadius: '16px',
            border: `1px solid ${config.color}`,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '16px',
              background: `linear-gradient(135deg, ${config.color}, ${config.color}80)`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>{config.icon}</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{config.name}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? config.color : '#1a1a1a',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  maxWidth: '80%',
                  color: 'white'
                }}
              >
                <div style={{ wordBreak: 'break-word' }}>{msg.content}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#1a1a1a', padding: '10px 14px', borderRadius: '16px', color: '#94a3b8' }}>
                <span style={{ animation: 'pulse 1s infinite' }}>🤔 Réflexion...</span>
              </div>
            )}
          </div>

          {suggestions.length > 0 && (
            <div style={{ padding: '12px', borderTop: '1px solid #222', background: '#1a1a1a' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Suggestions :</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestion(s)}
                    style={{
                      background: '#2a2a2a',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = config.color}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '16px', borderTop: '1px solid #222', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Posez votre question..."
              style={{
                flex: 1,
                padding: '12px',
                background: '#1a1a1a',
                border: `1px solid ${config.color}`,
                borderRadius: '24px',
                color: 'white',
                outline: 'none'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                padding: '12px 20px',
                background: config.color,
                border: 'none',
                borderRadius: '24px',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
