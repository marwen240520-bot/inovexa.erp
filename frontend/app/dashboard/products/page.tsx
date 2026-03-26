"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/products', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        console.log('Produits chargés:', data.length);
      } else {
        console.error('Erreur chargement produits:', res.status);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createProduct = async () => {
    if (!modal.form.name || !modal.form.sku) {
      setMessage('❌ Veuillez remplir le nom et le SKU');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: modal.form.name,
          sku: modal.form.sku,
          price: parseFloat(modal.form.price) || 0,
          quantity: parseInt(modal.form.quantity) || 0,
          description: modal.form.description || ''
        })
      });

      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchProducts();
        setMessage('✅ Produit ajouté avec succès !');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await res.json();
        setMessage(`❌ Erreur: ${error.message || 'Impossible d\'ajouter le produit'}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch(e) {
      setMessage('❌ Erreur de connexion au serveur');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const deleteProduct = async (id) => {
    if (confirm('Supprimer ce produit ?')) {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/products/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchProducts();
      setMessage('✅ Produit supprimé');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const filteredProducts = products.filter(p => 
    (p.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.sku?.toLowerCase() || '').includes(search.toLowerCase())
  );

  if (loading) {
    return <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ color: 'white', fontSize: '28px' }}>📦 Gestion des Produits ({products.length})</h1>
            <button onClick={() => setModal({ open: true, form: {} })} style={{ background: '#667eea', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              + Nouveau produit
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="🔍 Rechercher un produit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: 'white' }}
            />
          </div>

          {message && (
            <div style={{ 
              background: message.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
              border: `1px solid ${message.includes('✅') ? '#10b981' : '#ef4444'}`, 
              color: message.includes('✅') ? '#10b981' : '#f87171', 
              padding: '12px', 
              borderRadius: '12px', 
              marginBottom: '20px', 
              textAlign: 'center' 
            }}>
              {message}
            </div>
          )}

          <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>SKU</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Prix</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Stock</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                 </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: 'white' }}>{p.name}</td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{p.sku}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{p.price}€</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: (p.quantity || 0) < 10 ? '#f87171' : '#94a3b8' }}>{p.quantity}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => deleteProduct(p.id)} style={{ background: '#c33', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                {search ? 'Aucun produit correspondant.' : 'Aucun produit. Cliquez sur "Nouveau produit" pour commencer.'}
              </p>
            )}
          </div>
        </div>

        {modal.open && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#111', padding: '32px', borderRadius: '24px', width: '450px' }}>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>➕ Ajouter un produit</h2>
              <input type="text" placeholder="Nom *" value={modal.form.name || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="text" placeholder="SKU *" value={modal.form.sku || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, sku: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Prix (€)" value={modal.form.price || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, price: parseFloat(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <input type="number" placeholder="Quantité" value={modal.form.quantity || 0} onChange={e => setModal({ ...modal, form: { ...modal.form, quantity: parseInt(e.target.value) } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white' }} />
              <textarea placeholder="Description" value={modal.form.description || ''} onChange={e => setModal({ ...modal, form: { ...modal.form, description: e.target.value } })} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white', minHeight: '80px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={createProduct} style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
                <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
