"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function ClientLogisticsPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState([]);
  const [transporteurs, setTransporteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchShipments();
    fetchTransporteurs();
  }, []);

  const fetchShipments = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/logistics/client/shipments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setShipments(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchTransporteurs = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/users/transporteurs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTransporteurs(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  };

  const createShipment = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/logistics/client/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchShipments();
        setMessage("✅ Expédition créée !");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const assignTransporteur = async (shipmentId, transporteurId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/logistics/client/shipments/${shipmentId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transporteurId })
      });
      if (res.ok) {
        fetchShipments();
        setMessage("✅ Transporteur assigné !");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const getStatusColor = (status) => {
    if (status === "delivered") return "#10b981";
    if (status === "in_transit") return "#3b82f6";
    if (status === "pending") return "#f59e0b";
    return "#94a3b8";
  };

  const getStatusText = (status) => {
    if (status === "delivered") return "Livrée";
    if (status === "in_transit") return "En transit";
    if (status === "pending") return "En attente";
    return status;
  };

  if (loading) return <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>Chargement...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "280px", flex: 1, padding: "32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <div><h1 style={{ color: "white", fontSize: "28px", margin: 0 }}>🚚 Mes Expéditions</h1><p style={{ color: "#94a3b8", marginTop: "4px" }}>Gérez vos livraisons et transporteurs</p></div>
            <button onClick={() => setModal({ open: true, form: { trackingNumber: "", clientName: "", address: "", carrier: "Chronopost", estimatedDelivery: "" } })} style={{ background: "#667eea", color: "white", padding: "12px 24px", border: "none", borderRadius: "12px", cursor: "pointer" }}>+ Nouvelle expédition</button>
          </div>

          {message && <div style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "12px", borderRadius: "12px", marginBottom: "20px", textAlign: "center" }}>{message}</div>}

          <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid #222", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid #222", color: "#94a3b8" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>N° Suivi</th><th style={{ padding: "12px", textAlign: "left" }}>Client</th><th style={{ padding: "12px", textAlign: "left" }}>Adresse</th><th style={{ padding: "12px", textAlign: "center" }}>Statut</th><th style={{ padding: "12px", textAlign: "left" }}>Transporteur</th><th style={{ padding: "12px", textAlign: "center" }}>Action</th>
              </tr></thead>
              <tbody>
                {shipments.map(s => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "12px", color: "white" }}>{s.trackingNumber}</td>
                    <td style={{ padding: "12px", color: "#94a3b8" }}>{s.clientName}</td>
                    <td style={{ padding: "12px", color: "#94a3b8" }}>{s.address}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}><span style={{ background: getStatusColor(s.status) + "20", color: getStatusColor(s.status), padding: "4px 12px", borderRadius: "20px" }}>{getStatusText(s.status)}</span></td>
                    <td style={{ padding: "12px", color: "#94a3b8" }}>
                      {s.transporteurId ? (
                        <span style={{ color: "#10b981" }}>✅ Assigné</span>
                      ) : (
                        <select onChange={(e) => assignTransporteur(s.id, parseInt(e.target.value))} style={{ padding: "6px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px", color: "white" }}>
                          <option value="">Assigner</option>
                          {transporteurs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button onClick={() => {}} style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }}>✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#111", padding: "32px", borderRadius: "24px", width: "450px" }}>
            <h2 style={{ color: "white", marginBottom: "24px" }}>🚚 Nouvelle expédition</h2>
            <input type="text" placeholder="N° de suivi" value={modal.form.trackingNumber || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, trackingNumber: e.target.value } })} style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            <input type="text" placeholder="Nom du client" value={modal.form.clientName || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, clientName: e.target.value } })} style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            <input type="text" placeholder="Adresse" value={modal.form.address || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, address: e.target.value } })} style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            <select value={modal.form.carrier || "Chronopost"} onChange={e => setModal({ ...modal, form: { ...modal.form, carrier: e.target.value } })} style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }}>
              <option value="Chronopost">Chronopost</option><option value="DHL">DHL</option><option value="UPS">UPS</option><option value="FedEx">FedEx</option>
            </select>
            <input type="date" placeholder="Date estimée" value={modal.form.estimatedDelivery || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, estimatedDelivery: e.target.value } })} style={{ width: "100%", padding: "12px", marginBottom: "20px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            <div style={{ display: "flex", gap: "12px" }}><button onClick={createShipment} style={{ flex: 1, padding: "12px", background: "#667eea", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>Créer</button><button onClick={() => setModal({ open: false, form: {} })} style={{ flex: 1, padding: "12px", background: "#333", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>Annuler</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
