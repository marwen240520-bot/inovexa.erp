"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function BarcodePage() {
  const router = useRouter();
  const [scannedCode, setScannedCode] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
    inputRef.current?.focus();
  }, []);

  const handleScan = async () => {
    if (!scannedCode) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/products/barcode/${scannedCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        setMessage('✅ Produit trouvé !');
      } else {
        setProduct(null);
        setMessage('❌ Produit non trouvé');
      }
    } catch(e) { console.error(e); }
    setLoading(false);
    setTimeout(() => setMessage(''), 2000);
    setScannedCode('');
    inputRef.current?.focus();
  };

  const addToCart = async () => {
    if (!product) return;
    const token = localStorage.getItem('token');
    await fetch('http://localhost:3001/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: product.id, quantity: 1 })
    });
    setMessage('✅ Ajouté au panier !');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>📱 Scan de codes-barres</h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Scannez un produit avec votre lecteur de codes-barres</p>

          {message && (
            <div style={{ background: message.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.includes('✅') ? '#10b981' : '#ef4444'}`, color: message.includes('✅') ? '#10b981' : '#f87171', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <div style={{ background: '#111', borderRadius: '20px', padding: '32px', border: '1px solid #222', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📱</div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Scannez un code-barres..."
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              style={{ width: '100%', padding: '16px', fontSize: '18px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: 'white', textAlign: 'center' }}
            />
            <button onClick={handleScan} disabled={loading} style={{ marginTop: '20px', padding: '12px 32px', background: '#667eea', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              {loading ? 'Recherche...' : 'Valider'}
            </button>
          </div>

          {product && (
            <div style={{ marginTop: '32px', background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
              <h2 style={{ color: 'white', marginBottom: '16px' }}>📦 Produit scanné</h2>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#94a3b8', marginBottom: '8px' }}>Nom</div>
                  <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{product.name}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', marginBottom: '8px' }}>Prix</div>
                  <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>{product.price} €</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', marginBottom: '8px' }}>Stock</div>
                  <div style={{ color: product.quantity > 0 ? '#10b981' : '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>{product.quantity}</div>
                </div>
              </div>
              <button onClick={addToCart} style={{ marginTop: '20px', width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                Ajouter au panier
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
