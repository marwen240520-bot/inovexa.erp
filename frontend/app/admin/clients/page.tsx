"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminClients() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const u = JSON.parse(userData || "{}");
    setUser(u);
    if (u.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const users = await res.json();
        setClients(users.filter(u => u.role === "user"));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const createClient = async () => {
    const form = modal.form;
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setMessage("Veuillez remplir tous les champs obligatoires");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    try {
      const res = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          role: "user",
          phone: form.phone || "",
          company: form.company || ""
        })
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        setMessage("Client créé avec succès !");
        setTimeout(() => setMessage(""), 3000);
        fetchClients();
      } else {
        const data = await res.json();
        setMessage(data.message || "Erreur lors de la création");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setMessage("Erreur de connexion");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const deleteClient = async (id) => {
    if (!confirm("Supprimer ce client ?")) return;
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3001/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchClients();
    setMessage("Client supprimé");
    setTimeout(() => setMessage(""), 2000);
  };

  if (loading) {
    return (
      <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        Chargement...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      <div style={{ background: "#111", padding: "20px 32px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <img src="/logo.png" alt="Inovexa" style={{ width: "50px", height: "50px" }} />
          <h1 style={{ color: "white", fontSize: "24px" }}>Inovexa ERP - Administration</h1>
        </div>
        <div>
          <span style={{ color: "#e2e8f0", marginRight: "20px" }}>👋 {user?.firstName} {user?.lastName}</span>
          <button onClick={() => { localStorage.clear(); router.push("/auth/login"); }} style={{ background: "#c33", color: "white", padding: "8px 16px", border: "none", borderRadius: "10px", cursor: "pointer" }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ padding: "32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <h1 style={{ color: "white", fontSize: "28px" }}>Gestion des Clients ({clients.length})</h1>
            <button onClick={() => setModal({ open: true, form: {} })} style={{ background: "#667eea", color: "white", padding: "12px 24px", border: "none", borderRadius: "12px", cursor: "pointer" }}>
              + Nouveau client
            </button>
          </div>

          {message && (
            <div style={{
              background: message.includes("succès") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${message.includes("succès") ? "#10b981" : "#ef4444"}`,
              color: message.includes("succès") ? "#10b981" : "#f87171",
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
                  <th style={{ padding: "12px", textAlign: "left" }}>Client</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Société</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Téléphone</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Actions</th>
                 </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "12px", color: "white" }}>{c.firstName} {c.lastName}</td>
                    <td style={{ padding: "12px", color: "#94a3b8" }}>{c.email}</td>
                    <td style={{ padding: "12px", color: "#94a3b8" }}>{c.company || "-"}</td>
                    <td style={{ padding: "12px", color: "#94a3b8" }}>{c.phone || "-"}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button onClick={() => deleteClient(c.id)} style={{ background: "#c33", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clients.length === 0 && (
              <p style={{ textAlign: "center", color: "#666", padding: "40px" }}>
                Aucun client. Cliquez sur "Nouveau client" pour commencer.
              </p>
            )}
          </div>
        </div>
      </div>

      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#111", padding: "32px", borderRadius: "24px", width: "450px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ color: "white", fontSize: "24px" }}>Créer un client</h2>
              <button onClick={() => setModal({ open: false, form: {} })} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "24px", cursor: "pointer" }}>✕</button>
            </div>

            <input type="text" placeholder="Prénom *" value={modal.form.firstName || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, firstName: e.target.value } })} style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            <input type="text" placeholder="Nom *" value={modal.form.lastName || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, lastName: e.target.value } })} style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            <input type="email" placeholder="Email *" value={modal.form.email || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            <input type="password" placeholder="Mot de passe *" value={modal.form.password || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, password: e.target.value } })} style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            <input type="text" placeholder="Société" value={modal.form.company || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, company: e.target.value } })} style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            <input type="tel" placeholder="Téléphone" value={modal.form.phone || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} style={{ width: "100%", padding: "12px", marginBottom: "20px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={createClient} style={{ flex: 1, padding: "12px", background: "#667eea", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>
                Créer
              </button>
              <button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: "12px", background: "#333", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
