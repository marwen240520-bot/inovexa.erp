"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [email, setEmail] = useState("admin@inovexa.com");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 🔴 IMPORTANT: Appel direct au backend sur le port 3001
    const API_URL = "https://api-inovexa.ngrok.app/api";

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError(data.message || "Email ou mot de passe incorrect");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur. Vérifiez que le backend est démarré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: theme.background, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center" 
    }}>
      <div style={{
        background: theme.surface,
        padding: "40px",
        borderRadius: "20px",
        width: "400px",
        maxWidth: "90%",
        border: `1px solid ${theme.border}`
      }}>
        <h1 style={{ color: theme.text, textAlign: "center", marginBottom: "30px" }}>Inovexa ERP</h1>
        
        {error && (
          <div style={{
            background: "#ef444420",
            color: "#ef4444",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: theme.surfaceHover,
                border: `1px solid ${theme.border}`,
                borderRadius: "8px",
                color: theme.text,
                fontSize: "14px"
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px" }}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: theme.surfaceHover,
                border: `1px solid ${theme.border}`,
                borderRadius: "8px",
                color: theme.text,
                fontSize: "14px"
              }}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: theme.gradient || `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "500",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        
        <div style={{ 
          textAlign: "center", 
          marginTop: "20px", 
          fontSize: "12px", 
          color: theme.textSecondary,
          borderTop: `1px solid ${theme.border}`,
          paddingTop: "20px"
        }}>
          <p>📧 admin@inovexa.com</p>
          <p>🔑 Admin123!</p>
        </div>
      </div>
    </div>
  );
}
