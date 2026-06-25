"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface User {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  role?: string;
  profileImage?: string;
}

interface Stats {
  total: number;
  delivered: number;
  pending: number;
  inTransit: number;
}

const Icons = {
  User: ({ size = 20 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Truck: ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  Mail: ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Phone: ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.6 4.4 2 2 0 0 1 3.58 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l1.78-1.78a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Building: ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
    </svg>
  ),
  Package: ({ size = 28 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  CheckCircle: ({ size = 28 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  FileText: ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  BarChart2: ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Save: ({ size = 15 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Lightbulb: ({ size = 20 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  ),
  Spinner: ({ size = 40 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  ),
  CheckSmall: ({ size = 15 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  XCircle: ({ size = 15 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  TrendingUp: ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Award: ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
  AlertCircle: ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  ShieldCheck: ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  Info: ({ size = 12 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

// Composant champ de formulaire am�lior�
const FormField = ({
  label,
  icon,
  hint,
  required,
  value,
  onChange,
  type = "text",
  placeholder,
  isMobile,
  hasChanged,
}: {
  label: string;
  icon: React.ReactNode;
  hint?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  isMobile: boolean;
  hasChanged: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  const filled = value.trim().length > 0;

  let borderColor = "#2a2a2a";
  if (focused) borderColor = "#667eea";
  else if (hasChanged && filled) borderColor = "#10b981";
  else if (filled) borderColor = "#333";

  const boxShadow = focused ? "0 0 0 3px rgba(102,126,234,0.15)" : "none";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{
        fontSize: isMobile ? "11px" : "12px",
        fontWeight: 500,
        color: focused ? "#667eea" : "#94a3b8",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        transition: "color 0.2s",
      }}>
        <span style={{ color: focused ? "#667eea" : "#555" }}>{icon}</span>
        {label}
        {required && <span style={{ color: "#ef4444", fontSize: "10px" }}>*</span>}
      </label>

      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: isMobile ? "10px 12px 10px 36px" : "11px 12px 11px 38px",
            background: focused ? "#161616" : "#111",
            border: `1px solid ${borderColor}`,
            borderRadius: "10px",
            color: "white",
            fontSize: isMobile ? "12px" : "13px",
            outline: "none",
            boxShadow,
            transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
          }}
        />
        <span style={{
          position: "absolute",
          left: "11px",
          top: "50%",
          transform: "translateY(-50%)",
          color: focused ? "#667eea" : "#555",
          transition: "color 0.2s",
          pointerEvents: "none",
          display: "flex",
        }}>
          {icon}
        </span>
        {hasChanged && filled && !focused && (
          <span style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#10b981",
            display: "flex",
          }}>
            <Icons.CheckSmall size={14} />
          </span>
        )}
      </div>

      {hint && (
        <span style={{
          fontSize: "10px",
          color: "#555",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          paddingLeft: "2px",
        }}>
          <Icons.Info size={10} /> {hint}
        </span>
      )}
    </div>
  );
};

export default function TransporteurProfilePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", companyName: "" });
  const [originalForm, setOriginalForm] = useState({ name: "", email: "", phone: "", companyName: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [stats, setStats] = useState<Stats>({ total: 0, delivered: 0, pending: 0, inTransit: 0 });
  const [activeTab, setActiveTab] = useState("info");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getTranslation = (key: string): string => {
    const directTranslations: Record<string, Record<string, string>> = {
      "profile.title": { fr: "Mon Profil", en: "My Profile", es: "Mi Perfil" },
      "profile.subtitle": { fr: "G�rez vos informations personnelles", en: "Manage your personal information", es: "Gestione su informaci�n personal" },
      "profile.personalInfo": { fr: "Informations personnelles", en: "Personal information", es: "Informaci�n personal" },
      "profile.detailedStats": { fr: "Statistiques d�taill�es", en: "Detailed statistics", es: "Estad�sticas detalladas" },
      "profile.name": { fr: "Nom complet", en: "Full name", es: "Nombre completo" },
      "profile.email": { fr: "Email", en: "Email", es: "Correo electr�nico" },
      "profile.phone": { fr: "T�l�phone", en: "Phone", es: "Tel�fono" },
      "profile.company": { fr: "Entreprise", en: "Company", es: "Empresa" },
      "profile.save": { fr: "Enregistrer les modifications", en: "Save changes", es: "Guardar cambios" },
      "profile.cancel": { fr: "Annuler", en: "Cancel", es: "Cancelar" },
      "profile.saved": { fr: "Enregistr� !", en: "Saved!", es: "�Guardado!" },
      "profile.saving": { fr: "Enregistrement...", en: "Saving...", es: "Guardando..." },
      "profile.profileUpdated": { fr: "Profil mis � jour avec succ�s", en: "Profile updated successfully", es: "Perfil actualizado con �xito" },
      "profile.unsavedChanges": { fr: "Vous avez des modifications non enregistr�es", en: "You have unsaved changes", es: "Tiene cambios sin guardar" },
      "profile.totalShipments": { fr: "Livraisons totales", en: "Total shipments", es: "Entregas totales" },
      "profile.completedShipments": { fr: "Livraisons compl�t�es", en: "Completed shipments", es: "Entregas completadas" },
      "profile.pendingShipments": { fr: "En attente", en: "Pending", es: "Pendientes" },
      "profile.successRate": { fr: "Taux de r�ussite", en: "Success rate", es: "Tasa de �xito" },
      "profile.performanceScore": { fr: "Performance", en: "Performance", es: "Rendimiento" },
      "profile.tipTitle": { fr: "Conseil", en: "Tip", es: "Consejo" },
      "profile.professionalTransporter": { fr: "Transporteur professionnel", en: "Professional transporter", es: "Transportista profesional" },
      "profile.verified": { fr: "V�rifi�", en: "Verified", es: "Verificado" },
      "profile.emailHint": { fr: "Utilis� pour les notifications de livraison", en: "Used for delivery notifications", es: "Usado para notificaciones de entrega" },
      "profile.companyHint": { fr: "Visible sur votre profil public", en: "Visible on your public profile", es: "Visible en su perfil p�blico" },
      "profile.identity": { fr: "Identit�", en: "Identity", es: "Identidad" },
      "profile.contact": { fr: "Contact", en: "Contact", es: "Contacto" },
      "common.loading": { fr: "Chargement...", en: "Loading...", es: "Cargando..." },
      "common.error": { fr: "Une erreur est survenue", en: "An error occurred", es: "Ocurri� un error" },
    };
    if (directTranslations[key]?.[language]) return directTranslations[key][language];
    const translated = t(key);
    return translated !== key ? translated : key.split(".").pop() || key;
  };

  const hasChanges =
    form.name !== originalForm.name ||
    form.email !== originalForm.email ||
    form.phone !== originalForm.phone ||
    form.companyName !== originalForm.companyName;

  const fieldChanged = (field: keyof typeof form) => form[field] !== originalForm[field];

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const userData = await res.json();
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        const f = {
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          companyName: userData.companyName || "",
        };
        setForm(f);
        setOriginalForm(f);
      }
    } catch (e) {
      console.error("Erreur chargement profil:", e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/auth/login"); return; }
    if (userData) {
      try {
        const u = JSON.parse(userData) as User;
        if (u.role !== "transporteur") { router.push("/dashboard"); return; }
        setUser(u);
        const f = {
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          companyName: u.companyName || "",
        };
        setForm(f);
        setOriginalForm(f);
      } catch (e) { router.push("/auth/login"); return; }
    }
    fetchUserData();
    fetchStats();
    setTimeout(() => setAnimateCards(true), 100);
    setLoading(false);
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transporteur/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats({ total: data.total || 0, delivered: data.delivered || 0, pending: data.pending || 0, inTransit: data.inTransit || 0 });
      }
    } catch (e) { console.error(e); }
  };

  const updateProfile = async () => {
    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await fetchUserData();
        setSaveSuccess(true);
        showMessage(getTranslation("profile.profileUpdated"), "success");
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        showMessage(getTranslation("common.error"), "error");
      }
    } catch (e) {
      showMessage(getTranslation("common.error"), "error");
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    setForm({ ...originalForm });
  };

  const showMessage = (msg: string, type: string) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const getInitials = (name?: string) => (!name ? "?" : name.charAt(0).toUpperCase());

  const getAvatarColor = () => {
    const colors = ["#667eea", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"];
    return colors[(user?.name?.length || 0) % colors.length];
  };

  const successRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(0) : "0";
  const performanceScore = stats.delivered > 0 ? Math.min(5, (stats.delivered / Math.max(stats.total, 1)) * 5).toFixed(1) : "0";

  const tabs = [
    { id: "info", label: getTranslation("profile.personalInfo"), Icon: Icons.FileText },
    { id: "stats", label: getTranslation("profile.detailedStats"), Icon: Icons.BarChart2 },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a0a" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <Icons.Spinner size={40} />
          <p style={{ color: "#94a3b8", marginTop: "14px", fontSize: "13px" }}>{getTranslation("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: isMobile ? "16px" : "22px",
      background: "#0a0a0a",
      minHeight: "100vh",
      paddingBottom: isMobile ? "80px" : "22px",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 60px; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        input::placeholder { color: #444; }
        .tab-btn:hover { background: rgba(255,255,255,0.05) !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: isMobile ? "20px" : "28px", animation: animateCards ? "fadeInDown 0.5s ease" : "none" }}>
        <h1 style={{ color: "white", fontSize: isMobile ? "20px" : "24px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#667eea" }}><Icons.User size={isMobile ? 22 : 26} /></span>
          {getTranslation("profile.title")}
        </h1>
        <p style={{ color: "#94a3b8", marginTop: "4px", fontSize: isMobile ? "11px" : "13px" }}>
          {getTranslation("profile.subtitle")}
        </p>
      </div>

      {/* Toast message */}
      {message && (
        <div style={{
          background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`,
          color: messageType === "success" ? "#10b981" : "#f87171",
          padding: "10px 16px",
          borderRadius: "11px",
          marginBottom: "18px",
          textAlign: "center",
          fontSize: isMobile ? "11px" : "13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
          {messageType === "success" ? <Icons.CheckSmall size={13} /> : <Icons.XCircle size={13} />}
          {message}
        </div>
      )}

      {/* Avatar bar */}
      <div style={{
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: "18px 18px 0 0",
        padding: isMobile ? "16px" : "20px 24px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "center" : "center",
        gap: isMobile ? "14px" : "20px",
        textAlign: isMobile ? "center" : "left",
      }}>
        <div style={{
          width: isMobile ? "64px" : "72px",
          height: isMobile ? "64px" : "72px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${getAvatarColor()}, #764ba2)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isMobile ? "26px" : "30px",
          color: "white",
          fontWeight: 600,
          flexShrink: 0,
          transition: "transform 0.3s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {getInitials(form.name || user?.name)}
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ color: "white", fontSize: isMobile ? "17px" : "19px", margin: "0 0 4px" }}>
            {form.name || user?.name}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
            <span style={{ color: "#10b981", fontSize: isMobile ? "11px" : "12px", display: "flex", alignItems: "center", gap: "5px" }}>
              <Icons.Truck size={12} /> {getTranslation("profile.professionalTransporter")}
            </span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              padding: "2px 9px",
              borderRadius: "20px",
              background: "rgba(16,185,129,0.12)",
              color: "#10b981",
              border: "1px solid rgba(16,185,129,0.25)",
              fontWeight: 500,
            }}>
              <Icons.ShieldCheck size={11} /> {getTranslation("profile.verified")}
            </span>
          </div>
          <div style={{ display: "flex", gap: "14px", marginTop: "8px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
            {form.email && (
              <span style={{ color: "#555", fontSize: isMobile ? "10px" : "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Icons.Mail size={11} /> {form.email}
              </span>
            )}
            {form.phone && (
              <span style={{ color: "#555", fontSize: isMobile ? "10px" : "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Icons.Phone size={11} /> {form.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "4px",
        borderBottom: "1px solid #1e1e1e",
        background: "#0e0e0e",
        padding: "0 8px",
        overflowX: isMobile ? "auto" : "visible",
        marginTop: isMobile ? "16px" : "22px",
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="tab-btn"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: isMobile ? "11px 16px" : "12px 22px",
              background: activeTab === tab.id ? "#111" : "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #667eea" : "2px solid transparent",
              borderRadius: "8px 8px 0 0",
              color: activeTab === tab.id ? "#667eea" : "#555",
              cursor: "pointer",
              fontSize: isMobile ? "11px" : "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
              transition: "color 0.2s, border-color 0.2s",
              fontWeight: activeTab === tab.id ? 500 : 400,
            }}
          >
            <tab.Icon size={isMobile ? 12 : 13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Informations */}
      {activeTab === "info" && (
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderTop: "none", borderRadius: "0 0 18px 18px", padding: isMobile ? "20px" : "28px" }}>

          {/* Banni�re modifications non enregistr�es */}
          {hasChanges && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "10px",
              marginBottom: "22px",
              fontSize: isMobile ? "11px" : "12px",
              color: "#f59e0b",
              animation: "slideDown 0.3s ease",
            }}>
              <Icons.AlertCircle size={13} />
              {getTranslation("profile.unsavedChanges")}
            </div>
          )}

          <div style={{ maxWidth: isMobile ? "100%" : "560px", display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Section Identit� */}
            <div>
              <p style={{ color: "#444", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
                {getTranslation("profile.identity")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <FormField
                  label={getTranslation("profile.name")}
                  icon={<Icons.User size={14} />}
                  required
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  placeholder="Votre nom complet"
                  isMobile={isMobile}
                  hasChanged={fieldChanged("name")}
                />
                <FormField
                  label={getTranslation("profile.company")}
                  icon={<Icons.Building size={14} />}
                  hint={getTranslation("profile.companyHint")}
                  value={form.companyName}
                  onChange={(v) => setForm({ ...form, companyName: v })}
                  placeholder="Nom de votre entreprise (optionnel)"
                  isMobile={isMobile}
                  hasChanged={fieldChanged("companyName")}
                />
              </div>
            </div>

            {/* S�parateur */}
            <div style={{ height: "1px", background: "#1a1a1a" }} />

            {/* Section Contact */}
            <div>
              <p style={{ color: "#444", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
                {getTranslation("profile.contact")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <FormField
                  label={getTranslation("profile.email")}
                  icon={<Icons.Mail size={14} />}
                  hint={getTranslation("profile.emailHint")}
                  required
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  placeholder="votre@email.com"
                  isMobile={isMobile}
                  hasChanged={fieldChanged("email")}
                />
                <FormField
                  label={getTranslation("profile.phone")}
                  icon={<Icons.Phone size={14} />}
                  type="tel"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  placeholder="+216 XX XXX XXX"
                  isMobile={isMobile}
                  hasChanged={fieldChanged("phone")}
                />
              </div>
            </div>

            {/* S�parateur */}
            <div style={{ height: "1px", background: "#1a1a1a" }} />

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {hasChanges && (
                <button
                  onClick={cancelChanges}
                  style={{
                    padding: isMobile ? "10px 16px" : "11px 20px",
                    background: "transparent",
                    border: "1px solid #2a2a2a",
                    borderRadius: "10px",
                    color: "#666",
                    cursor: "pointer",
                    fontSize: isMobile ? "12px" : "13px",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#999"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#666"; }}
                >
                  {getTranslation("profile.cancel")}
                </button>
              )}

              <button
                onClick={updateProfile}
                disabled={saving || !hasChanges}
                style={{
                  flex: 1,
                  padding: isMobile ? "10px 16px" : "11px 20px",
                  background: saveSuccess
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : hasChanges
                    ? "linear-gradient(135deg, #667eea, #764ba2)"
                    : "#1a1a1a",
                  border: "none",
                  borderRadius: "10px",
                  color: hasChanges ? "white" : "#444",
                  cursor: hasChanges && !saving ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  fontSize: isMobile ? "12px" : "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.3s, transform 0.1s",
                  animation: saving ? "pulse 1s infinite" : "none",
                }}
                onMouseEnter={(e) => { if (hasChanges && !saving) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {saving ? (
                  <><Icons.Spinner size={14} /> {getTranslation("profile.saving")}</>
                ) : saveSuccess ? (
                  <><Icons.CheckSmall size={14} /> {getTranslation("profile.saved")}</>
                ) : (
                  <><Icons.Save size={14} /> {getTranslation("profile.save")}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Statistiques */}
      {activeTab === "stats" && (
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderTop: "none", borderRadius: "0 0 18px 18px", padding: isMobile ? "20px" : "28px" }}>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: isMobile ? "12px" : "18px",
            marginBottom: "24px",
          }}>
            <div style={{ background: "#1a1a1a", padding: isMobile ? "14px" : "18px", borderRadius: "14px", textAlign: "center", border: "1px solid #222" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: "#667eea" }}><Icons.Package size={isMobile ? 22 : 26} /></div>
              <div style={{ fontSize: isMobile ? "26px" : "32px", color: "#667eea", fontWeight: "bold" }}>{stats.total}</div>
              <div style={{ color: "#94a3b8", fontSize: isMobile ? "10px" : "11px", marginTop: "2px" }}>{getTranslation("profile.totalShipments")}</div>
            </div>
            <div style={{ background: "#1a1a1a", padding: isMobile ? "14px" : "18px", borderRadius: "14px", textAlign: "center", border: "1px solid #222" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: "#10b981" }}><Icons.CheckCircle size={isMobile ? 22 : 26} /></div>
              <div style={{ fontSize: isMobile ? "26px" : "32px", color: "#10b981", fontWeight: "bold" }}>{stats.delivered}</div>
              <div style={{ color: "#94a3b8", fontSize: isMobile ? "10px" : "11px", marginTop: "2px" }}>{getTranslation("profile.completedShipments")}</div>
            </div>
          </div>

          {/* Taux de r�ussite */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "#94a3b8", fontSize: isMobile ? "11px" : "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icons.TrendingUp size={13} /> {getTranslation("profile.successRate")}
              </span>
              <span style={{ color: "#10b981", fontWeight: "bold", fontSize: isMobile ? "12px" : "13px" }}>{successRate}%</span>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: "9px", height: "7px", overflow: "hidden" }}>
              <div style={{ width: `${successRate}%`, background: "linear-gradient(90deg, #10b981, #059669)", height: "7px", borderRadius: "9px", transition: "width 1s ease" }} />
            </div>
          </div>

          {/* Performance */}
          <div style={{ marginBottom: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "#94a3b8", fontSize: isMobile ? "11px" : "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icons.Award size={13} /> {getTranslation("profile.performanceScore")}
              </span>
              <span style={{ color: "#f59e0b", fontWeight: "bold", fontSize: isMobile ? "12px" : "13px" }}>{performanceScore} / 5</span>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: "9px", height: "7px", overflow: "hidden" }}>
              <div style={{ width: `${parseFloat(performanceScore) * 20}%`, background: "linear-gradient(90deg, #f59e0b, #d97706)", height: "7px", borderRadius: "9px", transition: "width 1s ease" }} />
            </div>
          </div>

          {/* Conseil */}
          <div style={{ padding: isMobile ? "12px 14px" : "14px 18px", background: "#1a1a1a", borderRadius: "12px", display: "flex", alignItems: "flex-start", gap: "12px", border: "1px solid #222" }}>
            <span style={{ color: "#f59e0b", flexShrink: 0, marginTop: "1px" }}><Icons.Lightbulb size={isMobile ? 16 : 18} /></span>
            <div>
              <div style={{ color: "white", fontWeight: 600, fontSize: isMobile ? "12px" : "13px" }}>{getTranslation("profile.tipTitle")}</div>
              <div style={{ color: "#94a3b8", fontSize: isMobile ? "10px" : "11px", marginTop: "4px" }}>
                {stats.pending > 0
                  ? `${stats.pending} ${stats.pending === 1 ? "livraison en attente" : "livraisons en attente"}`
                  : "Bravo ! Toutes vos livraisons sont � jour"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}