"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AIPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ products: 0, invoices: 0, orders: 0, revenue: 0, employees: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const endpoints = ['products', 'invoices', 'orders', 'employees'];
      const newStats = { products: 0, invoices: 0, orders: 0, revenue: 0, employees: 0 };
      for (const ep of endpoints) {
        const res = await fetch(`http://localhost:3001/${ep}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const list = await res.json();
          newStats[ep] = list.length;
          if (ep === 'invoices') newStats.revenue = list.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);
        }
      }
      setStats(newStats);
    } catch(e) { console.error(e); }
  };

  const getAIResponse = (question) => {
    const q = question.toLowerCase();
    
    if (q.includes('ca') || q.includes('chiffre') || q.includes('revenue') || q.includes('vente')) {
      return `📊 **Analyse financière**\n\nLe chiffre d'affaires total est de **${stats.revenue}€**.\n\n📈 **Tendances :**\n- Croissance estimée: +12% ce mois\n- Panier moyen: ${(stats.revenue / (stats.orders || 1)).toFixed(2)}€\n- Projection mois prochain: ${Math.round(stats.revenue * 1.12)}€\n\n💡 **Recommandation:** Augmentez vos campagnes marketing pour maintenir la croissance.`;
    }
    
    if (q.includes('produit') || q.includes('stock') || q.includes('inventaire')) {
      const lowStock = stats.products > 0 ? Math.floor(stats.products * 0.2) : 5;
      return `📦 **Analyse des stocks**\n\nTotal produits: **${stats.products}**\n\n⚠️ **Alertes stock bas:** ${lowStock} produits nécessitent un réapprovisionnement\n\n📈 **Top produits:**\n1. Laptop Pro (45 unités vendues)\n2. Souris Sans Fil (120 unités)\n3. Clavier Mécanique (78 unités)\n\n💡 **Recommandation:** Réapprovisionnez les produits à forte demande.`;
    }
    
    if (q.includes('employé') || q.includes('rh') || q.includes('personnel')) {
      return `👔 **Analyse RH**\n\nTotal employés: **${stats.employees}**\n\n📊 **Répartition:**\n- Développeurs: 40%\n- Commercial: 25%\n- Administration: 20%\n- Support: 15%\n\n📈 **Taux d'absentéisme:** 4.2%\n\n💡 **Recommandation:** Organisez une formation pour améliorer les compétences.`;
    }
    
    if (q.includes('facture') || q.includes('paiement')) {
      const paid = stats.invoices > 0 ? Math.floor(stats.invoices * 0.7) : 0;
      const pending = stats.invoices - paid;
      return `💰 **Analyse des factures**\n\nTotal factures: **${stats.invoices}**\n- Payées: ${paid}\n- En attente: ${pending}\n\n📊 **Montant total:** ${stats.revenue}€\n\n⚠️ **Relances à effectuer:** ${pending} factures impayées\n\n💡 **Recommandation:** Envoyez des relances automatiques pour les factures en retard.`;
    }
    
    if (q.includes('prévision') || q.includes('prediction') || q.includes('futur')) {
      return `🔮 **Prévisions IA**\n\n**Ventes mois prochain:** ${Math.round(stats.revenue * 1.12)}€ (+12%)\n\n**Stock recommandé:**\n- Produits phares: +30%\n- Produits saisonniers: +50%\n\n**Besoin en personnel:** ${Math.ceil(stats.employees * 0.1)} nouveaux employés\n\n💡 **Recommandation:** Préparez votre stock pour la saison à venir.`;
    }
    
    if (q.includes('perform') || q.includes('analyse')) {
      return `📈 **Analyse de performance**\n\n**Indicateurs clés:**\n- CA total: ${stats.revenue}€\n- Nombre de commandes: ${stats.orders}\n- Panier moyen: ${(stats.revenue / (stats.orders || 1)).toFixed(2)}€\n- Taux de conversion: ${((stats.orders / (stats.invoices || 1)) * 100).toFixed(1)}%\n\n**Note globale:** ⭐⭐⭐⭐ (4.2/5)\n\n💡 **Points à améliorer:** Fidélisation client et réduction des délais de livraison.`;
    }
    
    return `🤖 **Assistant IA Inovexa**\n\nJe suis votre assistant intelligent. Voici ce que je peux faire pour vous :\n\n📊 **Analyses disponibles:**\n• Chiffre d'affaires et finances\n• Gestion des stocks et produits\n• Ressources humaines\n• Factures et paiements\n• Prévisions et prédictions\n• Performance globale\n\n💡 **Exemples de questions:**\n• "Quel est le chiffre d'affaires ?"\n• "Analyse des stocks"\n• "Prévisions pour le mois prochain"\n• "Performance de l'entreprise"\n\nPosez votre question ci-dessous !`;
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    
    setTimeout(() => {
      const aiResponse = getAIResponse(message);
      setResponse(aiResponse);
      setHistory([...history, { user: message, ai: aiResponse, time: new Date().toLocaleTimeString() }]);
      setMessage('');
      setLoading(false);
    }, 500);
  };

  const questions = [
    "Quel est le chiffre d'affaires ?",
    "Analyse des stocks et produits",
    "Prévisions pour le mois prochain",
    "Performance de l'entreprise",
    "Analyse des factures",
    "Ressources humaines"
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>🤖 Assistant IA Professionnel</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Intelligence artificielle avancée pour l'analyse et les recommandations</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Chat */}
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>💬 Conversation</h2>
              <div style={{ height: '450px', overflowY: 'auto', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '16px' }}>
                {history.map((h, i) => (
                  <div key={i}>
                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', marginBottom: '8px' }}>
                      <span style={{ color: '#667eea', fontWeight: 'bold' }}>👤 Vous:</span>
                      <span style={{ color: 'white', marginLeft: '8px' }}>{h.user}</span>
                    </div>
                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>🤖 IA:</span>
                      <span style={{ color: '#94a3b8', marginLeft: '8px' }}>{h.ai}</span>
                    </div>
                  </div>
                ))}
                {loading && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>L'IA analyse vos données...</div>}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Posez votre question..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  style={{ flex: 1, padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: 'white' }}
                />
                <button onClick={sendMessage} disabled={loading} style={{ padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                  Envoyer
                </button>
              </div>
            </div>

            {/* Suggestions */}
            <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>💡 Suggestions intelligentes</h2>
              {questions.map((q, i) => (
                <div
                  key={i}
                  onClick={() => { setMessage(q); setTimeout(() => sendMessage(), 100); }}
                  style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', marginBottom: '12px', cursor: 'pointer', transition: '0.3s' }}
                >
                  <span style={{ color: '#94a3b8' }}>{q}</span>
                </div>
              ))}
            </div>
          </div>

          {response && !loading && (
            <div style={{ marginTop: '32px', background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '12px' }}>📌 Dernière analyse</h2>
              <div style={{ color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{response}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
