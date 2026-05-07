"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function TransporteursPage() {
  const router = useRouter();
  const [transporteurs, setTransporteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {}, editMode: false, editId: null });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchTransporteurs();
  }, []);

  const fetchTransporteurs = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/transporteurs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransporteurs(Array.isArray(data) ? data : []);
      } else {
        setTransporteurs([]);
      }
    } catch(e) { 
      console.error(e);
      setTransporteurs([]);
    }
    setLoading(false);
  };

  const createTransporteur = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/transporteurs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchTransporteurs();
        showMessage("✅ Transporteur ajouté avec succès !", "success");
      } else {
        const err = await res.json();
        showMessage("❌ " + (err.message || "Erreur lors de l'ajout"), "error");
      }
    } catch(e) { 
      showMessage("❌ Erreur de connexion", "error");
    }
  };

  const updateTransporteur = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/transporteurs/${modal.editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchTransporteurs();
        showMessage("✅ Transporteur modifié avec succès !", "success");
      } else {
        showMessage("❌ Erreur lors de la modification", "error");
      }
    } catch(e) { 
      showMessage("❌ Erreur de connexion", "error");
    }
  };

  const deleteTransporteur = async (id) => {
    if (confirm("⚠️ Supprimer définitivement ce transporteur ?")) {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:3001/transporteurs/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          fetchTransporteurs();
          showMessage("✅ Transporteur supprimé", "success");
        } else {
          showMessage("❌ Erreur lors de la suppression", "error");
        }
      } catch(e) { 
        showMessage("❌ Erreur de connexion", "error");
      }
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const openEditModal = (t) => {
    setModal({
      open: true,
      editMode: true,
      editId: t.id,
      form: {
        name: t.name || "",
        email: t.email || "",
        phone: t.phone || "",
        companyName: t.companyName || ""
      }
    });
  };

  if (loading) {
    return <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>Chargement...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "280px", flex: 1, padding: "32px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ color: "white", fontSize: "28px", margin: 0 }}>🚚 Mes Transporteurs</h1>
              <p style={{ color: "#94a3b8", marginTop: "4px" }}>Gérez vos partenaires de livraison</p>
            </div>
            <button onClick={() => setModal({ open: true, editMode: false, form: { name: "", email: "", phone: "", companyName: "" } })} style={{ background: "#667eea", color: "white", padding: "12px 24px", border: "none", borderRadius: "12px", cursor: "pointer" }}>
              + Nouveau transporteur
            </button>
          </div>

          {message && (
            <div style={{ 
              background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", 
              border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`, 
              color: messageType === "success" ? "#10b981" : "#f87171", 
              padding: "12px", 
              borderRadius: "12px", 
              marginBottom: "20px", 
              textAlign: "center" 
            }}>
              {message}
            </div>
          )}

          <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid #222", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222", color: "#94a3b8" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Nom</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Téléphone</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Société</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transporteurs.map(t => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "12px", color: "white" }}>{t.name}</td>
                    <td style={{ padding: "12px", color: "#94a3b8" }}>{t.email}</td>
                    <td style={{ padding: "12px", color: "#94a3b8" }}>{t.phone || "-"}</td>
                    <td style={{ padding: "12px", color: "#94a3b8" }}>{t.companyName || "-"}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button onClick={() => openEditModal(t)} style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer", marginRight: "5px" }}>✏️</button>
                      <button onClick={() => deleteTransporteur(t.id)} style={{ background: "#c33", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transporteurs.length === 0 && (
              <p style={{ textAlign: "center", color: "#666", padding: "40px" }}>
                Aucun transporteur. Cliquez sur "+ Nouveau transporteur" pour en ajouter.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Ajout/Modification */}
      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#111", padding: "32px", borderRadius: "24px", width: "450px", maxWidth: "90%" }}>
            <h2 style={{ color: "white", marginBottom: "24px" }}>
              {modal.editMode ? "✏️ Modifier le transporteur" : "🚚 Nouveau transporteur"}
            </h2>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>Nom *</label>
              <input type="text" placeholder="Nom du transporteur" value={modal.form.name || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>Email *</label>
              <input type="email" placeholder="Email" value={modal.form.email || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>Téléphone</label>
              <input type="tel" placeholder="Téléphone" value={modal.form.phone || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>Nom de la société</label>
              <input type="text" placeholder="Société" value={modal.form.companyName || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, companyName: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={modal.editMode ? updateTransporteur : createTransporteur} style={{ flex: 1, padding: "12px", background: "#667eea", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>
                {modal.editMode ? "Modifier" : "Ajouter"}
              </button>
              <button onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })} style={{ flex: 1, padding: "12px", background: "#333", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
