"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

// ==================== SVG ICONS ====================
const Icons = {
  User: ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Truck: ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  Mail: ({ size = 12 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Phone: ({ size = 12 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.6 4.4 2 2 0 0 1 3.58 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l1.78-1.78a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Package: ({ size = 28 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  CheckCircle: ({ size = 28 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Clock: ({ size = 28 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Star: ({ size = 28 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  FileText: ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Shield: ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  BarChart2: ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Save: ({ size = 15 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Key: ({ size = 15 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  Lightbulb: ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  ),
  Camera: ({ size = 13 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Spinner: ({ size = 40 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  ),
  CheckSmall: ({ size = 15 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  XCircle: ({ size = 15 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  TrendingUp: ({ size = 22 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Award: ({ size = 22 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
};

export default function TransporteurProfilePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animateCards, setAnimateCards] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", companyName: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [stats, setStats] = useState({ total: 0, delivered: 0, pending: 0, inTransit: 0 });
  const [activeTab, setActiveTab] = useState("info");
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  const getTranslation = (key) => {
    const directTranslations = {
      'profile.title': { fr: 'Mon Profil', en: 'My Profile', es: 'Mi Perfil' },
      'profile.subtitle': { fr: 'Gérez vos informations personnelles et vos performances', en: 'Manage your personal information and performance', es: 'Gestione su información personal y rendimiento' },
      'profile.personalInfo': { fr: 'Informations personnelles', en: 'Personal information', es: 'Información personal' },
      'profile.security': { fr: 'Sécurité', en: 'Security', es: 'Seguridad' },
      'profile.detailedStats': { fr: 'Statistiques détaillées', en: 'Detailed statistics', es: 'Estadísticas detalladas' },
      'profile.name': { fr: 'Nom complet', en: 'Full name', es: 'Nombre completo' },
      'profile.email': { fr: 'Email', en: 'Email', es: 'Correo electrónico' },
      'profile.phone': { fr: 'Téléphone', en: 'Phone', es: 'Teléfono' },
      'profile.company': { fr: 'Entreprise', en: 'Company', es: 'Empresa' },
      'profile.save': { fr: 'Enregistrer', en: 'Save', es: 'Guardar' },
      'profile.changePassword': { fr: 'Changer le mot de passe', en: 'Change password', es: 'Cambiar contraseña' },
      'profile.newPassword': { fr: 'Nouveau mot de passe', en: 'New password', es: 'Nueva contraseña' },
      'profile.confirmPassword': { fr: 'Confirmer le mot de passe', en: 'Confirm password', es: 'Confirmar contraseña' },
      'profile.passwordMinLength': { fr: 'Minimum 6 caractères', en: 'Minimum 6 characters', es: 'Mínimo 6 caracteres' },
      'profile.passwordMismatch': { fr: 'Les mots de passe ne correspondent pas', en: 'Passwords do not match', es: 'Las contraseñas no coinciden' },
      'profile.passwordChanged': { fr: 'Mot de passe changé avec succès', en: 'Password changed successfully', es: 'Contraseña cambiada con éxito' },
      'profile.profileUpdated': { fr: 'Profil mis à jour avec succès', en: 'Profile updated successfully', es: 'Perfil actualizado con éxito' },
      'profile.totalShipments': { fr: 'Livraisons totales', en: 'Total shipments', es: 'Entregas totales' },
      'profile.completedShipments': { fr: 'Livraisons complétées', en: 'Completed shipments', es: 'Entregas completadas' },
      'profile.pendingShipments': { fr: 'En attente', en: 'Pending', es: 'Pendientes' },
      'profile.successRate': { fr: 'Taux de réussite', en: 'Success rate', es: 'Tasa de éxito' },
      'profile.performanceScore': { fr: 'Performance', en: 'Performance', es: 'Rendimiento' },
      'profile.rating': { fr: 'Note /5', en: 'Rating /5', es: 'Nota /5' },
      'profile.tipTitle': { fr: 'Conseil', en: 'Tip', es: 'Consejo' },
      'profile.tipPending': { fr: 'Vous avez {count} livraison(s) en attente. Pensez à les traiter rapidement.', en: 'You have {count} pending delivery(ies). Please process them quickly.', es: 'Tiene {count} entrega(s) pendiente(s). Por favor, procéselas rápidamente.' },
      'profile.tipAllGood': { fr: 'Bravo ! Toutes vos livraisons sont à jour. Continuez sur cette lancée !', en: 'Great! All your deliveries are up to date. Keep it up!', es: '¡Excelente! Todas sus entregas están al día. ¡Siga así!' },
      'profile.changePhoto': { fr: 'Cliquez pour changer la photo', en: 'Click to change photo', es: 'Haga clic para cambiar la foto' },
      'profile.uploading': { fr: 'Téléchargement...', en: 'Uploading...', es: 'Subiendo...' },
      'profile.professionalTransporter': { fr: 'Transporteur professionnel', en: 'Professional transporter', es: 'Transportista profesional' },
      'common.loading': { fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' },
      'common.error': { fr: 'Erreur', en: 'Error', es: 'Error' },
    };
    if (directTranslations[key] && directTranslations[key][language]) return directTranslations[key][language];
    const translated = t(key);
    return translated !== key ? translated : key.split('.').pop() || key;
  };

  // Fonction pour charger les données utilisateur depuis le backend
  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/users/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        setForm({ 
          name: userData.name || "", 
          email: userData.email || "", 
          phone: userData.phone || "", 
          companyName: userData.companyName || "" 
        });
        if (userData.profileImage) {
          setProfileImage(userData.profileImage);
          setImageTimestamp(Date.now());
          setImageError(false);
        }
      }
    } catch(e) {
      console.error("Erreur chargement profil:", e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/auth/login"); return; }
    if (userData) {
      try {
        const u = JSON.parse(userData);
        if (u.role !== "transporteur") { router.push("/dashboard"); return; }
        setUser(u);
        setForm({ name: u.name || "", email: u.email || "", phone: u.phone || "", companyName: u.companyName || "" });
        if (u.profileImage) {
          setProfileImage(u.profileImage);
          setImageError(false);
        }
      } catch(e) { router.push("/auth/login"); return; }
    }
    
    // Charger également les données fraîches depuis le backend
    fetchUserData();
    fetchStats();
    setTimeout(() => setAnimateCards(true), 100);
    setLoading(false);
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/transporteur/stats", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setStats({ total: data.total || 0, delivered: data.delivered || 0, pending: data.pending || 0, inTransit: data.inTransit || 0 });
      }
    } catch(e) { console.error(e); }
  };

  const updateProfile = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        await fetchUserData(); // Recharger les données fraîches
        showMessage(getTranslation("profile.profileUpdated"), "success");
      } else { showMessage(getTranslation("common.error"), "error"); }
    } catch(e) { showMessage(getTranslation("common.error"), "error"); }
    finally { setLoading(false); }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showMessage(getTranslation("profile.passwordMismatch"), "error"); return; }
    if (passwordForm.newPassword.length < 6) { showMessage(getTranslation("profile.passwordMinLength"), "error"); return; }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/users/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: passwordForm.newPassword })
      });
      if (res.ok) { setPasswordForm({ newPassword: "", confirmPassword: "" }); showMessage(getTranslation("profile.passwordChanged"), "success"); }
      else { showMessage(getTranslation("common.error"), "error"); }
    } catch(e) { showMessage(getTranslation("common.error"), "error"); }
  };

  const uploadProfileImage = async (file) => {
    const token = localStorage.getItem("token");
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("http://localhost:3001/users/profile-image", {
        method: "POST", 
        headers: { Authorization: `Bearer ${token}` }, 
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProfileImage(data.profileImage);
        setImageTimestamp(Date.now());
        setImageError(false);
        // Mettre à jour localStorage immédiatement
        const updatedUser = { ...user, profileImage: data.profileImage };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        showMessage("Photo de profil mise à jour", "success");
      } else {
        const error = await res.json();
        showMessage(error.message || "Erreur lors de l'upload", "error");
      }
    } catch(e) { 
      console.error(e);
      showMessage("Erreur de connexion", "error");
    }
    finally { setUploading(false); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      // Validation de la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showMessage("L'image ne doit pas dépasser 2MB", "error");
        return;
      }
      uploadProfileImage(file);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "?";
  const getRandomColor = () => {
    const colors = ["#667eea", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"];
    return colors[(user?.name?.length || 0) % colors.length];
  };

  const successRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(0) : 0;
  const performanceScore = stats.delivered > 0 ? Math.min(5, (stats.delivered / Math.max(stats.total, 1)) * 5).toFixed(1) : "0";

  const headerTitleSize = "25px";
  const headerMarginBottom = "29px";
  const cardPadding = "18px";
  const cardGap = "18px";
  const avatarSize = "108px";
  const avatarBorderRadius = "54px";
  const avatarFontSize = "43px";
  const titleFontSize = "22px";
  const inputPadding = "13px";
  const buttonPadding = "13px";
  const tabPadding = "11px 22px";
  const statBoxPadding = "18px";
  const statValueSize = "29px";

  const tabs = [
    { id: "info", label: getTranslation("profile.personalInfo"), Icon: Icons.FileText },
    { id: "security", label: getTranslation("profile.security"), Icon: Icons.Shield },
    { id: "stats", label: getTranslation("profile.detailedStats"), Icon: Icons.BarChart2 },
  ];

  const statsCards = [
    { Icon: Icons.Package, value: stats.total, label: getTranslation("profile.totalShipments"), color: "#667eea", sub: null },
    { Icon: Icons.CheckCircle, value: stats.delivered, label: getTranslation("profile.completedShipments"), color: "#10b981", sub: `${successRate}% ${getTranslation("profile.successRate")}` },
    { Icon: Icons.Clock, value: stats.pending, label: getTranslation("profile.pendingShipments"), color: "#f59e0b", sub: null },
    { Icon: Icons.Star, value: performanceScore, label: getTranslation("profile.rating"), color: "#f59e0b", sub: null },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a0a" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <Icons.Spinner size={43} />
          <p style={{ color: "#94a3b8", marginTop: "14px", fontSize: "13px" }}>{getTranslation("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "22px", background: "#0a0a0a", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: headerMarginBottom, animation: animateCards ? "fadeInDown 0.5s ease" : "none", opacity: animateCards ? 1 : 0 }}>
        <h1 style={{ color: "white", fontSize: headerTitleSize, margin: 0, display: "flex", alignItems: "center", gap: "11px" }}>
          <span style={{ color: "#667eea" }}><Icons.User size={26} /></span>
          {getTranslation("profile.title")}
        </h1>
        <p style={{ color: "#94a3b8", marginTop: "4px", fontSize: "13px" }}>{getTranslation("profile.subtitle")}</p>
      </div>

      {/* Message de notification */}
      {message && (
        <div style={{ 
          background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", 
          border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`, 
          color: messageType === "success" ? "#10b981" : "#f87171", 
          padding: "11px 16px", 
          borderRadius: "11px", 
          marginBottom: "18px", 
          textAlign: "center", 
          animation: "fadeInUp 0.3s ease", 
          fontSize: "13px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "8px" 
        }}>
          {messageType === "success" ? <Icons.CheckSmall size={15} /> : <Icons.XCircle size={15} />}
          {message}
        </div>
      )}

      {/* Section Profil avec Avatar */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "29px", marginBottom: "29px", alignItems: "center", animation: animateCards ? "fadeInUp 0.5s ease 0.1s" : "none", opacity: animateCards ? 1 : 0 }}>
        <div style={{ textAlign: "center" }}>
          <label style={{ cursor: "pointer" }}>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            {profileImage && !imageError ? (
              <img
                src={`http://localhost:3001${profileImage}?t=${imageTimestamp}`}
                alt="Profile"
                style={{ width: avatarSize, height: avatarSize, borderRadius: avatarBorderRadius, objectFit: "cover", border: "3px solid #10b981", cursor: "pointer", transition: "transform 0.3s" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                style={{ width: avatarSize, height: avatarSize, borderRadius: avatarBorderRadius, background: `linear-gradient(135deg, ${getRandomColor()}, #764ba2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: avatarFontSize, color: "white", cursor: "pointer", transition: "transform 0.3s" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {getInitials(user?.name)}
              </div>
            )}
            {uploading && (
              <p style={{ color: "#94a3b8", fontSize: "11px", marginTop: "7px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                <Icons.Spinner size={14} /> {getTranslation("profile.uploading")}
              </p>
            )}
          </label>
          <p style={{ color: "#94a3b8", fontSize: "11px", marginTop: "7px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <Icons.Camera size={11} /> {getTranslation("profile.changePhoto")}
          </p>
        </div>

        <div>
          <h2 style={{ color: "white", fontSize: titleFontSize, margin: 0 }}>{user?.name}</h2>
          <p style={{ color: "#10b981", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <Icons.Truck size={14} /> {getTranslation("profile.professionalTransporter")}
          </p>
          <div style={{ display: "flex", gap: "14px", marginTop: "11px", flexWrap: "wrap" }}>
            <span style={{ color: "#666", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
              <Icons.Mail size={12} /> {user?.email}
            </span>
            {user?.phone && (
              <span style={{ color: "#666", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                <Icons.Phone size={12} /> {user?.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: cardGap, marginBottom: "29px", animation: animateCards ? "fadeInUp 0.5s ease 0.2s" : "none", opacity: animateCards ? 1 : 0 }}>
        {statsCards.map((card, i) => (
          <div
            key={i}
            style={{ background: "linear-gradient(135deg, #111, #1a1a1a)", borderRadius: "14px", padding: cardPadding, textAlign: "center", border: "1px solid #222", transition: "transform 0.3s" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: card.color }}><card.Icon size={28} /></div>
            <div style={{ fontSize: "25px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{card.label}</div>
            {card.sub && <div style={{ fontSize: "10px", color: card.color, marginTop: "4px" }}>{card.sub}</div>}
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: "7px", marginBottom: "22px", borderBottom: "1px solid #222", animation: animateCards ? "fadeInUp 0.5s ease 0.3s" : "none", opacity: animateCards ? 1 : 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ padding: tabPadding, background: activeTab === tab.id ? "#10b981" : "transparent", border: "none", borderRadius: "11px 11px 0 0", color: activeTab === tab.id ? "white" : "#94a3b8", cursor: "pointer", transition: "all 0.2s", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}
          >
            <tab.Icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Onglet Informations */}
      {activeTab === "info" && (
        <div style={{ background: "#111", borderRadius: "18px", padding: "29px", border: "1px solid #222", animation: "fadeInUp 0.3s ease" }}>
          <div style={{ maxWidth: "540px" }}>
            {[
              { label: `${getTranslation("profile.name")} *`, key: "name", type: "text" },
              { label: `${getTranslation("profile.email")} *`, key: "email", type: "email" },
              { label: getTranslation("profile.phone"), key: "phone", type: "tel" },
              { label: getTranslation("profile.company"), key: "companyName", type: "text" },
            ].map((field, i) => (
              <div key={field.key} style={{ marginBottom: i === 3 ? "22px" : "18px" }}>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "7px", fontSize: "13px" }}>{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  style={{ width: "100%", padding: inputPadding, background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "white", transition: "border-color 0.2s", fontSize: "13px", boxSizing: "border-box" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#10b981"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#333"}
                />
              </div>
            ))}
            <button
              onClick={updateProfile}
              style={{ width: "100%", padding: buttonPadding, background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", borderRadius: "11px", cursor: "pointer", fontWeight: "600", transition: "opacity 0.2s", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <Icons.Save size={15} /> {getTranslation("profile.save")}
            </button>
          </div>
        </div>
      )}

      {/* Onglet Sécurité */}
      {activeTab === "security" && (
        <div style={{ background: "#111", borderRadius: "18px", padding: "29px", border: "1px solid #222", animation: "fadeInUp 0.3s ease" }}>
          <div style={{ maxWidth: "540px" }}>
            <div style={{ marginBottom: "18px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "7px", fontSize: "13px" }}>{getTranslation("profile.newPassword")}</label>
              <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} style={{ width: "100%", padding: inputPadding, background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "white", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "22px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "7px", fontSize: "13px" }}>{getTranslation("profile.confirmPassword")}</label>
              <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} style={{ width: "100%", padding: inputPadding, background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "white", fontSize: "13px", boxSizing: "border-box" }} />
              <p style={{ color: "#666", fontSize: "10px", marginTop: "7px" }}>{getTranslation("profile.passwordMinLength")}</p>
            </div>
            <button
              onClick={changePassword}
              style={{ width: "100%", padding: buttonPadding, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", border: "none", borderRadius: "11px", cursor: "pointer", fontWeight: "600", transition: "opacity 0.2s", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <Icons.Key size={15} /> {getTranslation("profile.changePassword")}
            </button>
          </div>
        </div>
      )}

      {/* Onglet Statistiques détaillées */}
      {activeTab === "stats" && (
        <div style={{ background: "#111", borderRadius: "18px", padding: "29px", border: "1px solid #222", animation: "fadeInUp 0.3s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "22px", marginBottom: "29px" }}>
            <div style={{ background: "#1a1a1a", padding: statBoxPadding, borderRadius: "14px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "7px", color: "#667eea" }}><Icons.Package size={24} /></div>
              <div style={{ fontSize: statValueSize, color: "#667eea", fontWeight: "bold" }}>{stats.total}</div>
              <div style={{ color: "#94a3b8", fontSize: "11px" }}>{getTranslation("profile.totalShipments")}</div>
            </div>
            <div style={{ background: "#1a1a1a", padding: statBoxPadding, borderRadius: "14px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "7px", color: "#10b981" }}><Icons.CheckCircle size={24} /></div>
              <div style={{ fontSize: statValueSize, color: "#10b981", fontWeight: "bold" }}>{stats.delivered}</div>
              <div style={{ color: "#94a3b8", fontSize: "11px" }}>{getTranslation("profile.completedShipments")}</div>
            </div>
          </div>

          {/* Barre taux de réussite */}
          <div style={{ marginBottom: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
              <span style={{ color: "#94a3b8", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icons.TrendingUp size={14} /> {getTranslation("profile.successRate")}
              </span>
              <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "12px" }}>{successRate}%</span>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: "9px", height: "7px", overflow: "hidden" }}>
              <div style={{ width: `${successRate}%`, background: "linear-gradient(90deg, #10b981, #059669)", height: "7px", borderRadius: "9px", transition: "width 0.5s" }} />
            </div>
          </div>

          {/* Barre performance */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
              <span style={{ color: "#94a3b8", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icons.Award size={14} /> {getTranslation("profile.performanceScore")}
              </span>
              <span style={{ color: "#f59e0b", fontWeight: "bold", fontSize: "12px" }}>{performanceScore} / 5</span>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: "9px", height: "7px", overflow: "hidden" }}>
              <div style={{ width: `${parseFloat(performanceScore) * 20}%`, background: "linear-gradient(90deg, #f59e0b, #d97706)", height: "7px", borderRadius: "9px", transition: "width 0.5s" }} />
            </div>
          </div>

          {/* Conseil */}
          <div style={{ marginTop: "22px", padding: "14px 18px", background: "#1a1a1a", borderRadius: "11px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={{ color: "#f59e0b", marginTop: "1px", flexShrink: 0 }}><Icons.Lightbulb size={20} /></span>
            <div>
              <div style={{ color: "white", fontWeight: "bold", fontSize: "13px" }}>{getTranslation("profile.tipTitle")}</div>
              <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "4px" }}>
                {stats.pending > 0
                  ? getTranslation("profile.tipPending").replace("{count}", stats.pending.toString())
                  : getTranslation("profile.tipAllGood")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}