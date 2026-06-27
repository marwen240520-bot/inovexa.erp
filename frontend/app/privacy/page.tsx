"use client";
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <Link href="/" style={{ color: '#667eea', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <span>←</span> Retour à l'accueil
        </Link>
        
        <h1 style={{ color: 'white', fontSize: '32px', marginBottom: '24px' }}>Politique de confidentialité</h1>
        <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Dernière mise à jour : 30 mars 2025</p>
        
        <div style={{ background: '#111', borderRadius: '20px', padding: '32px', border: '1px solid #222' }}>
          <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '16px' }}>1. Collecte des informations</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: '1.6' }}>
            Nous collectons les informations que vous nous fournissez directement, telles que votre nom, email, numéro de téléphone, et les informations de votre entreprise lors de la création de votre compte.
          </p>
          
          <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '16px' }}>2. Utilisation des informations</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: '1.6' }}>
            Vos informations sont utilisées pour :<br/>
            - Gérer votre compte et vous fournir nos services<br/>
            - Communiquer avec vous concernant votre compte<br/>
            - Améliorer nos services et votre expérience utilisateur
          </p>
          
          <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '16px' }}>3. Protection des données</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: '1.6' }}>
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé.
          </p>
          
          <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '16px' }}>4. Partage des informations</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: '1.6' }}>
            Nous ne vendons pas vos informations personnelles. Nous ne les partageons qu'avec votre consentement ou si requis par la loi.
          </p>
          
          <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '16px' }}>5. Vos droits</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: '1.6' }}>
            Vous avez le droit d'accéder, de modifier ou de supprimer vos informations personnelles. Contactez-nous à contact@inovexa-ai.com pour toute demande.
          </p>
          
          <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '16px' }}>6. Cookies</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: '1.6' }}>
            Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation de notre site.
          </p>
          
          <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '16px' }}>7. Contact</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: '1.6' }}>
            Pour toute question concernant cette politique, contactez-nous :<br/>
            📧 contact@inovexa-ai.com<br/>
            💬 +216 22 535 181
          </p>
        </div>
        
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Link href="/" style={{ background: '#667eea', color: 'white', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', display: 'inline-block' }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
