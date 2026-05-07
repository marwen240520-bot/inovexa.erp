"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

// ==================== SVG ICONS ====================
const Icons = {
  Settings: ({ size = 22 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Globe: ({ size = 15 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Calendar: ({ size = 15 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Bell: ({ size = 15 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Shield: ({ size = 15 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Key: ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  LogOut: ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  CheckSmall: ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  XCircle: ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  AlertTriangle: ({ size = 12 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Spinner: ({ size = 40 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  ),
  Check: ({ size = 13 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

export default function TransporteurSettingsPage() {
  const router = useRouter();
  const { t, language, changeLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    language: language,
    dateFormat: "dd/mm/yyyy",
    notifications: true,
    emailNotifications: true
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);

  const getTranslation = (key) => {
    const directTranslations = {
      'transporteur.settings.title': { fr: 'Paramètres', en: 'Settings', es: 'Ajustes' },
      'transporteur.settings.subtitle': { fr: 'Personnalisez votre expérience', en: 'Customize your experience', es: 'Personalice su experiencia' },
      'transporteur.settings.language': { fr: 'Langue', en: 'Language', es: 'Idioma' },
      'transporteur.settings.date_format': { fr: 'Format de date', en: 'Date format', es: 'Formato de fecha' },
      'transporteur.settings.notifications': { fr: 'Notifications', en: 'Notifications', es: 'Notificaciones' },
      'transporteur.settings.enable_notifications': { fr: 'Activer les notifications', en: 'Enable notifications', es: 'Activar notificaciones' },
      'transporteur.settings.email_notifications': { fr: 'Notifications par email', en: 'Email notifications', es: 'Notificaciones por correo' },
      'transporteur.settings.change_password': { fr: 'Changer le mot de passe', en: 'Change password', es: 'Cambiar contraseña' },
      'transporteur.settings.change_password_btn': { fr: 'Changer le mot de passe', en: 'Change password', es: 'Cambiar contraseña' },
      'transporteur.settings.new_password': { fr: 'Nouveau mot de passe', en: 'New password', es: 'Nueva contraseña' },
      'transporteur.settings.confirm_password': { fr: 'Confirmer le mot de passe', en: 'Confirm password', es: 'Confirmar contraseña' },
      'transporteur.settings.password_min_length': { fr: 'Minimum 6 caractères', en: 'Minimum 6 characters', es: 'Mínimo 6 caracteres' },
      'transporteur.settings.password_too_short': { fr: 'Le mot de passe doit contenir au moins 6 caractères', en: 'Password must be at least 6 characters', es: 'La contraseña debe tener al menos 6 caracteres' },
      'transporteur.settings.password_mismatch': { fr: 'Les mots de passe ne correspondent pas', en: 'Passwords do not match', es: 'Las contraseñas no coinciden' },
      'transporteur.settings.password_changed': { fr: 'Mot de passe changé avec succès', en: 'Password changed successfully', es: 'Contraseña cambiada con éxito' },
      'transporteur.settings.date_format_saved': { fr: 'Format de date enregistré', en: 'Date format saved', es: 'Formato de fecha guardado' },
      'transporteur.settings.preferences_saved': { fr: 'Préférences enregistrées', en: 'Preferences saved', es: 'Preferencias guardadas' },
      'transporteur.settings.language_changed': { fr: 'Langue changée', en: 'Language changed', es: 'Idioma cambiado' },
      'transporteur.settings.current_language': { fr: 'Langue actuelle', en: 'Current language', es: 'Idioma actual' },
      'transporteur.settings.example': { fr: 'exemple', en: 'example', es: 'ejemplo' },
      'transporteur.settings.current_date': { fr: 'Date actuelle', en: 'Current date', es: 'Fecha actual' },
      'common.loading': { fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' },
      'common.error': { fr: 'Erreur', en: 'Error', es: 'Error' },
      'common.logout': { fr: 'Déconnexion', en: 'Logout', es: 'Cerrar sesión' },
      'common.logoutWarning': { fr: 'Êtes-vous sûr de vouloir vous déconnecter ?', en: 'Are you sure you want to logout?', es: '¿Está seguro de que desea cerrar sesión?' }
    };
    if (directTranslations[key] && directTranslations[key][language]) return directTranslations[key][language];
    const translated = t(key);
    return translated !== key ? translated : key.split('.').pop() || key;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/auth/login"); return; }
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role !== "transporteur") { router.push("/dashboard"); return; }
      } catch(e) { router.push("/auth/login"); return; }
    }
    const savedLanguage = language || localStorage.getItem("language") || "fr";
    const savedDateFormat = localStorage.getItem("dateFormat") || "dd/mm/yyyy";
    setSettings({
      language: savedLanguage,
      dateFormat: savedDateFormat,
      notifications: localStorage.getItem("notifications") !== "false",
      emailNotifications: localStorage.getItem("emailNotifications") !== "false"
    });
    setLoading(false);
    setTimeout(() => setAnimateCards(true), 100);
  }, [language]);

  const savePreference = (key, value) => {
    localStorage.setItem(key, value.toString());
    showMessage(
      key === "dateFormat"
        ? getTranslation("transporteur.settings.date_format_saved")
        : getTranslation("transporteur.settings.preferences_saved"),
      "success"
    );
  };

  const handleLanguageChange = async (lang) => {
    await changeLanguage(lang);
    localStorage.setItem("language", lang);
    setSettings(prev => ({ ...prev, language: lang }));
    showMessage(getTranslation("transporteur.settings.language_changed"), "success");
    setTimeout(() => window.location.reload(), 1000);
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showMessage(getTranslation("transporteur.settings.password_mismatch"), "error"); return; }
    if (passwordForm.newPassword.length < 6) { showMessage(getTranslation("transporteur.settings.password_too_short"), "error"); return; }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/users/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: passwordForm.newPassword })
      });
      if (res.ok) { setPasswordForm({ newPassword: "", confirmPassword: "" }); showMessage(getTranslation("transporteur.settings.password_changed"), "success"); }
      else { showMessage(getTranslation("common.error"), "error"); }
    } catch(e) { showMessage(getTranslation("common.error"), "error"); }
  };

  const showMessage = (msg, type) => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const formatDateExample = () => {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    if (settings.dateFormat === "dd/mm/yyyy") return `${day}/${month}/${year}`;
    if (settings.dateFormat === "mm/dd/yyyy") return `${month}/${day}/${year}`;
    return `${year}-${month}-${day}`;
  };

  const getLanguageButtonText = (lang) => {
    if (lang === 'fr') return 'Français';
    if (lang === 'en') return 'English';
    return 'Español';
  };

  // Tailles réduites de 10%
  const sectionPadding = "22px";
  const sectionMarginBottom = "22px";
  const titleFontSize = "22px";
  const inputPadding = "13px";
  const buttonPadding = "13px";
  const checkboxSize = "16px";
  const logoutButtonPadding = "13px";
  const fontSizeSmall = "12px";
  const fontSizeExtraSmall = "10px";

  const sectionStyle = {
    background: "#111",
    borderRadius: "14px",
    padding: sectionPadding,
    border: "1px solid #222",
    marginBottom: sectionMarginBottom,
    opacity: animateCards ? 1 : 0,
    transition: "transform 0.3s",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a0a" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <Icons.Spinner size={43} />
          <p style={{ color: "#94a3b8", marginTop: "14px", fontSize: fontSizeSmall }}>{getTranslation("common.loading")}</p>
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
      <div style={{ marginBottom: "22px", animation: animateCards ? "fadeInDown 0.5s ease" : "none", opacity: animateCards ? 1 : 0 }}>
        <h1 style={{ color: "white", fontSize: titleFontSize, marginBottom: "7px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#667eea" }}><Icons.Settings size={22} /></span>
          {getTranslation("transporteur.settings.title")}
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "22px", fontSize: fontSizeSmall }}>{getTranslation("transporteur.settings.subtitle")}</p>
      </div>

      {/* Message */}
      {message && (
        <div style={{ background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`, color: messageType === "success" ? "#10b981" : "#f87171", padding: "11px 16px", borderRadius: "11px", marginBottom: "18px", textAlign: "center", animation: "fadeInUp 0.3s ease", fontSize: fontSizeSmall, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          {messageType === "success" ? <Icons.CheckSmall size={14} /> : <Icons.XCircle size={14} />}
          {message}
        </div>
      )}

      {/* Section Langue */}
      <div
        style={{ ...sectionStyle, animation: animateCards ? "fadeInUp 0.5s ease 0.1s" : "none" }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
      >
        <h3 style={{ color: "white", marginBottom: "18px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#667eea" }}><Icons.Globe size={15} /></span>
          {getTranslation("transporteur.settings.language")}
        </h3>
        <div style={{ display: "flex", gap: "11px", flexWrap: "wrap" }}>
          {["fr", "en", "es"].map(lang => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              style={{ padding: "9px 22px", background: language === lang ? "#667eea" : "#1a1a1a", border: `1px solid ${language === lang ? "#667eea" : "#333"}`, borderRadius: "7px", color: "white", cursor: "pointer", fontWeight: language === lang ? "600" : "400", transition: "all 0.2s", fontSize: fontSizeSmall, display: "flex", alignItems: "center", gap: "6px" }}
            >
              {language === lang && <Icons.Check size={12} />}
              {getLanguageButtonText(lang)}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "11px", padding: "7px 11px", background: "#1a1a1a", borderRadius: "7px", display: "flex", alignItems: "center", gap: "6px" }}>
          {language !== settings.language && <Icons.AlertTriangle size={11} />}
          <span style={{ color: "#94a3b8", fontSize: fontSizeExtraSmall }}>
            {getTranslation("transporteur.settings.current_language")}: {language === "fr" ? "Français" : language === "en" ? "English" : "Español"}
          </span>
        </div>
      </div>

      {/* Section Format de date */}
      <div
        style={{ ...sectionStyle, animation: animateCards ? "fadeInUp 0.5s ease 0.2s" : "none" }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
      >
        <h3 style={{ color: "white", marginBottom: "18px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#667eea" }}><Icons.Calendar size={15} /></span>
          {getTranslation("transporteur.settings.date_format")}
        </h3>
        <select
          value={settings.dateFormat}
          onChange={(e) => { const v = e.target.value; setSettings({ ...settings, dateFormat: v }); savePreference("dateFormat", v); }}
          style={{ width: "100%", padding: inputPadding, background: "#1a1a1a", border: "1px solid #333", borderRadius: "9px", color: "white", cursor: "pointer", fontSize: fontSizeSmall }}
        >
          <option value="dd/mm/yyyy">DD/MM/YYYY ({getTranslation("transporteur.settings.example")}: {formatDateExample()})</option>
          <option value="mm/dd/yyyy">MM/DD/YYYY ({getTranslation("transporteur.settings.example")}: {formatDateExample()})</option>
          <option value="yyyy-mm-dd">YYYY-MM-DD ({getTranslation("transporteur.settings.example")}: {formatDateExample()})</option>
        </select>
        <div style={{ marginTop: "11px", padding: "7px 11px", background: "#1a1a1a", borderRadius: "7px" }}>
          <span style={{ color: "#94a3b8", fontSize: fontSizeExtraSmall }}>{getTranslation("transporteur.settings.current_date")}: </span>
          <span style={{ color: "#667eea", fontWeight: "bold" }}>{formatDateExample()}</span>
        </div>
      </div>

      {/* Section Notifications */}
      <div
        style={{ ...sectionStyle, animation: animateCards ? "fadeInUp 0.5s ease 0.3s" : "none" }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
      >
        <h3 style={{ color: "white", marginBottom: "18px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#667eea" }}><Icons.Bell size={15} /></span>
          {getTranslation("transporteur.settings.notifications")}
        </h3>
        {[
          { key: "notifications", label: getTranslation("transporteur.settings.enable_notifications") },
          { key: "emailNotifications", label: getTranslation("transporteur.settings.email_notifications") },
        ].map((item, i) => (
          <div key={item.key} style={{ marginBottom: i === 0 ? "11px" : "0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "11px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={(e) => { setSettings({ ...settings, [item.key]: e.target.checked }); savePreference(item.key, e.target.checked); }}
                style={{ width: checkboxSize, height: checkboxSize, cursor: "pointer", accentColor: "#667eea" }}
              />
              <span style={{ color: "#94a3b8", fontSize: fontSizeSmall }}>{item.label}</span>
            </label>
          </div>
        ))}
      </div>

      {/* Section Mot de passe */}
      <div
        style={{ ...sectionStyle, animation: animateCards ? "fadeInUp 0.5s ease 0.4s" : "none" }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
      >
        <h3 style={{ color: "white", marginBottom: "18px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#667eea" }}><Icons.Shield size={15} /></span>
          {getTranslation("transporteur.settings.change_password")}
        </h3>
        <div style={{ marginBottom: "11px" }}>
          <input
            type="password"
            placeholder={getTranslation("transporteur.settings.new_password")}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            style={{ width: "100%", padding: inputPadding, background: "#1a1a1a", border: "1px solid #333", borderRadius: "9px", color: "white", marginBottom: "11px", fontSize: fontSizeSmall, boxSizing: "border-box" }}
          />
          <input
            type="password"
            placeholder={getTranslation("transporteur.settings.confirm_password")}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            style={{ width: "100%", padding: inputPadding, background: "#1a1a1a", border: "1px solid #333", borderRadius: "9px", color: "white", fontSize: fontSizeSmall, boxSizing: "border-box" }}
          />
          <p style={{ color: "#666", fontSize: fontSizeExtraSmall, marginTop: "7px" }}>{getTranslation("transporteur.settings.password_min_length")}</p>
        </div>
        <button
          onClick={changePassword}
          style={{ width: "100%", padding: buttonPadding, background: "#f59e0b", color: "white", border: "none", borderRadius: "9px", cursor: "pointer", fontWeight: "500", transition: "opacity 0.2s", fontSize: fontSizeSmall, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <Icons.Key size={14} /> {getTranslation("transporteur.settings.change_password_btn")}
        </button>
      </div>

      {/* Déconnexion */}
      <div style={{ display: "flex", gap: "14px", animation: animateCards ? "fadeInUp 0.5s ease 0.5s" : "none", opacity: animateCards ? 1 : 0 }}>
        <button
          onClick={() => {
            if (confirm(getTranslation("common.logoutWarning"))) {
              ["token", "user", "language", "dateFormat", "notifications", "emailNotifications"].forEach(k => localStorage.removeItem(k));
              router.push("/");
            }
          }}
          style={{ width: "100%", padding: logoutButtonPadding, background: "rgba(239,68,68,0.8)", color: "white", border: "none", borderRadius: "9px", cursor: "pointer", fontWeight: "500", transition: "background 0.2s", fontSize: fontSizeSmall, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#ef4444"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.8)"}
        >
          <Icons.LogOut size={14} /> {getTranslation("common.logout")}
        </button>
      </div>
    </div>
  );
}