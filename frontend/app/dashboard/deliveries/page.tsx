"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function LogisticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3001/logistics/shipments", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      setShipments(
        Array.isArray(data)
          ? data
          : [
              {
                id: 1,
                clientName: "Client A",
                address: "123 Rue de Paris",
                status: "in_transit",
                carrier: "Chronopost"
              },
              {
                id: 2,
                clientName: "Client B",
                address: "45 Avenue de Lyon",
                status: "pending",
                carrier: "DHL"
              },
              {
                id: 3,
                clientName: "Client C",
                address: "78 Boulevard Marseille",
                status: "delivered",
                carrier: "UPS"
              }
            ]
      );
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    if (status === "delivered") return "#10b981";
    if (status === "in_transit") return "#667eea";
    return "#f59e0b";
  };

  const getStatusText = (status) => {
    if (status === "delivered") return "Livrée";
    if (status === "in_transit") return "En transit";
    return "En attente";
  };

  if (loading) {
    return <div style={center}>Chargement...</div>;
  }

  return (
    <div style={container}>
      <Sidebar />

      <div style={content}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          
          {/* HEADER */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "40px" }}>🚚</div>
              <div>
                <h1 style={{ color: "white", fontSize: "28px", margin: 0 }}>
                  Logistique & Transport
                </h1>
                <p style={{ color: "#94a3b8", margin: 0 }}>
                  Gestion des expéditions
                </p>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div style={tableContainer}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              
              <thead>
                <tr style={{ borderBottom: "1px solid #222", color: "#94a3b8" }}>
                  <th style={th}>Client</th>
                  <th style={th}>Adresse</th>
                  <th style={th}>Transporteur</th>
                  <th style={{ ...th, textAlign: "center" }}>Statut</th>
                </tr>
              </thead>

              <tbody>
                {shipments.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    
                    <td style={td}>{s.clientName}</td>

                    <td style={{ ...td, color: "#94a3b8" }}>
                      {s.address}
                    </td>

                    <td style={{ ...td, color: "#94a3b8" }}>
                      {s.carrier}
                    </td>

                    <td style={{ textAlign: "center", padding: "12px" }}>
                      <span
                        style={{
                          background: `${getStatusColor(s.status)}20`,
                          color: getStatusColor(s.status),
                          padding: "4px 12px",
                          borderRadius: "20px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {getStatusText(s.status)}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

/* STYLES */

const container = {
  display: "flex",
  background: "#0a0a0a",
  minHeight: "100vh"
};

const content = {
  marginLeft: "280px",
  flex: 1,
  padding: "32px"
};

const center = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  color: "white"
};

const tableContainer = {
  background: "#111",
  borderRadius: "20px",
  padding: "24px",
  border: "1px solid #222",
  overflowX: "auto"
};

const th = {
  padding: "12px",
  textAlign: "left"
};

const td = {
  padding: "12px",
  color: "white"
};