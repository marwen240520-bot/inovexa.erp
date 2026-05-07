"use client";
import { useState } from "react";

export function HelpModal() {
  const [open, setOpen] = useState(false);

  const helpSections = [
    {
      title: "📊 Gestion des produits",
      content: "Ajoutez, modifiez ou supprimez vos produits. Chaque produit peut avoir une catégorie, un SKU, un prix et une quantité en stock."
    },
    {
      title: "💰 Ventes et achats",
      content: "Enregistrez vos ventes et achats. Le système calcule automatiquement le total en fonction du prix du produit et de la quantité."
    },
    {
      title: "📝 Commandes clients",
      content: "Gérez les commandes de vos clients. Vous pouvez modifier le statut (en attente, en traitement, livrée, annulée) à tout moment."
    },
    {
      title: "👥 Gestion des clients",
      content: "Conservez un carnet d'adresses de vos clients. Ajoutez leurs coordonnées pour faciliter la facturation."
    },
    {
      title: "🧾 Facturation",
      content: "Générez des factures, marquez-les comme payées et téléchargez-les au format PDF. Le calcul de la TVA est automatique."
    },
    {
      title: "📈 Rapports et analytics",
      content: "Consultez vos statistiques de vente, bénéfices et suivez l'évolution de votre activité sur différentes périodes."
    },
    {
      title: "⚙️ Raccourcis clavier",
      content: "Ctrl+D → Dashboard | Ctrl+P → Produits | Ctrl+S → Ventes | Ctrl+O → Commandes | Ctrl+C → Clients | Ctrl+I → Factures | Ctrl+R → Rapports | Ctrl+/ → Aide"
    }
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "90px",
          right: "20px",
          width: "50px",
          height: "50px",
          borderRadius: "25px",
          background: "#667eea",
          border: "none",
          color: "white",
          fontSize: "24px",
          cursor: "pointer",
          zIndex: 999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
        }}
        title="Aide"
      >
        ❓
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px"
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: "#111",
              borderRadius: "24px",
              width: "600px",
              maxWidth: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              border: "1px solid #222",
              padding: "24px"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ color: "white", margin: 0 }}>❓ Centre d'aide</h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "24px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "24px", padding: "16px", background: "#1a1a1a", borderRadius: "12px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div>
              <h3 style={{ color: "white", marginBottom: "8px" }}>Bienvenue sur Inovexa ERP</h3>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                Besoin d'aide ? Consultez les sections ci-dessous ou contactez notre support.
              </p>
            </div>

            {helpSections.map((section, idx) => (
              <div key={idx} style={{ marginBottom: "20px", padding: "16px", background: "#1a1a1a", borderRadius: "12px" }}>
                <h3 style={{ color: "#667eea", marginBottom: "8px", fontSize: "16px" }}>{section.title}</h3>
                <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.5" }}>{section.content}</p>
              </div>
            ))}

            <div style={{ marginTop: "24px", padding: "16px", background: "#1a1a1a", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📧</div>
              <h3 style={{ color: "white", marginBottom: "8px", fontSize: "16px" }}>Besoin d'aide supplémentaire ?</h3>
              <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "12px" }}>
                Contactez notre équipe de support
              </p>
              <button
                onClick={() => window.location.href = "mailto:support@inovexa.com"}
                style={{
                  padding: "8px 20px",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                support@inovexa.com
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
