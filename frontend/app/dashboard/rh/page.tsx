"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RHPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/auth/login");
      return;
    }

    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3001/hr/employees", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setEmployees(await res.json());
      }
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  const createEmployee = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3001/hr/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(modal.form)
      });

      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchEmployees();

        setMessage("✅ Employé ajouté !");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={center}>
        Chargement...
      </div>
    );
  }

  return (
    <div style={container}>

      <div style={content}>

        <Link href="/dashboard" style={link}>
          ← Retour au tableau de bord
        </Link>

        <h1 style={title}>👨‍💼 Ressources Humaines</h1>

        <p style={{ color: "#94a3b8" }}>
          Gestion des employés, salaires et statuts
        </p>

        <button
          onClick={() =>
            setModal({
              open: true,
              form: {
                name: "",
                email: "",
                position: "",
                salary: 0,
                hireDate: ""
              }
            })
          }
          style={addBtn}
        >
          + Nouvel employé
        </button>

        {message && <div style={success}>{message}</div>}

        <div style={tableContainer}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>

            <thead>
              <tr style={{ color: "#94a3b8", borderBottom: "1px solid #222" }}>
                <th style={th}>Nom</th>
                <th style={th}>Poste</th>
                <th style={{ ...th, textAlign: "right" }}>Salaire</th>
                <th style={th}>Statut</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                  <td style={td}>{e.name}</td>
                  <td style={td}>{e.position}</td>

                  <td style={{ ...td, textAlign: "right", color: "#10b981" }}>
                    {e.salary} €
                  </td>

                  <td style={td}>
                    <span
                      style={{
                        background: e.active ? "#10b98133" : "#ef444433",
                        color: e.active ? "#10b981" : "#ef4444",
                        padding: "4px 10px",
                        borderRadius: "12px"
                      }}
                    >
                      {e.active ? "Actif" : "Inactif"}
                    </span>
                  </td>

                  <td style={td}>
                    <button style={deleteBtn}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

          {employees.length === 0 && (
            <p style={{ textAlign: "center", color: "#666", padding: "40px" }}>
              Aucun employé
            </p>
          )}

        </div>
      </div>

      {/* MODAL */}
      {modal.open && (
        <div style={overlay}>
          <div style={modalBox}>

            <h2 style={{ color: "white" }}>👥 Nouvel employé</h2>

            <input
              placeholder="Nom"
              value={modal.form.name || ""}
              onChange={(e) =>
                setModal({
                  ...modal,
                  form: { ...modal.form, name: e.target.value }
                })
              }
              style={input}
            />

            <input
              placeholder="Email"
              value={modal.form.email || ""}
              onChange={(e) =>
                setModal({
                  ...modal,
                  form: { ...modal.form, email: e.target.value }
                })
              }
              style={input}
            />

            <input
              placeholder="Poste"
              value={modal.form.position || ""}
              onChange={(e) =>
                setModal({
                  ...modal,
                  form: { ...modal.form, position: e.target.value }
                })
              }
              style={input}
            />

            <input
              type="number"
              placeholder="Salaire"
              value={modal.form.salary || 0}
              onChange={(e) =>
                setModal({
                  ...modal,
                  form: {
                    ...modal.form,
                    salary: parseFloat(e.target.value)
                  }
                })
              }
              style={input}
            />

            <input
              type="date"
              value={modal.form.hireDate || ""}
              onChange={(e) =>
                setModal({
                  ...modal,
                  form: { ...modal.form, hireDate: e.target.value }
                })
              }
              style={input}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={createEmployee} style={btnPrimary}>
                Ajouter
              </button>

              <button
                onClick={() => setModal({ open: false, form: {} })}
                style={btnSecondary}
              >
                Annuler
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/* ===== STYLES ===== */

const container = {
  background: "#0a0a0a",
  minHeight: "100vh",
  padding: "32px",
  color: "white"
};

const content = {
  maxWidth: "1200px",
  margin: "0 auto"
};

const center = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  color: "white"
};

const link = {
  color: "#667eea",
  textDecoration: "none"
};

const title = {
  marginTop: "16px"
};

const tableContainer = {
  background: "#111",
  borderRadius: "16px",
  padding: "20px",
  marginTop: "20px"
};

const th = {
  padding: "12px",
  textAlign: "left"
};

const td = {
  padding: "12px",
  color: "white"
};

const addBtn = {
  marginTop: "20px",
  background: "#667eea",
  color: "white",
  padding: "10px 16px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
};

const deleteBtn = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer"
};

const success = {
  marginTop: "10px",
  background: "rgba(16,185,129,0.2)",
  padding: "10px",
  borderRadius: "8px"
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const modalBox = {
  background: "#111",
  padding: "24px",
  borderRadius: "16px",
  width: "400px"
};

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "8px",
  color: "white"
};

const btnPrimary = {
  flex: 1,
  padding: "10px",
  background: "#667eea",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
};

const btnSecondary = {
  flex: 1,
  padding: "10px",
  background: "#333",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
};