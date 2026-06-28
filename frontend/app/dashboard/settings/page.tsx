"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconSettings = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconGlobe = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const IconCurrency = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const IconCalendar = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconSave = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconReset = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
  </svg>
);

const IconLogout = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconCheckCircle = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconAlertCircle = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconLoader = ({ size = 40, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { language, changeLanguage, t } = useLanguage();
  const { theme } = useTheme();
  const { isMobile } = useResponsive();

  // FIX: Margin left for desktop sidebar (280px)
  const contentMarginLeft = isMobile ? "0" : "0px";

  const [loading, setLoading] = useState(true);
  const [animateCards, setAnimateCards] = useState(false);
  const [settings, setSettings] = useState({
    language: "fr",
    currency: "eur",
    dateFormat: "dd/mm/yyyy"
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const containerPadding = isMobile ? "16px" : "32px";
  const cardPadding = isMobile ? "20px" : "24px";
  const cardRadius = isMobile ? "16px" : "20px";
  const sectionMargin = isMobile ? "20px" : "24px";
  const headerTitleSize = isMobile ? "22px" : "28px";
  const buttonPadding = isMobile ? "12px" : "14px";
  const selectPadding = isMobile ? "12px" : "12px";
  const iconSize = isMobile ? 18 : 20;

  const flagCodes = { fr: "fr", en: "us", es: "es" };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");

    const savedLanguage = localStorage.getItem("language") || "fr";
    const savedCurrency = localStorage.getItem("currency") || "eur";
    const savedDateFormat = localStorage.getItem("dateFormat") || "dd/mm/yyyy";

    setSettings({ language: savedLanguage, currency: savedCurrency, dateFormat: savedDateFormat });
    setLoading(false);
    setTimeout(() => setAnimateCards(true), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async () => {
    localStorage.setItem("currency", settings.currency);
    localStorage.setItem("dateFormat", settings.dateFormat);
    localStorage.setItem("app_currency", settings.currency);
    localStorage.setItem("app_dateFormat", settings.dateFormat);

    const event = new CustomEvent("settingsChanged", {
      detail: { currency: settings.currency, dateFormat: settings.dateFormat }
    });
    window.dispatchEvent(event);

    if (settings.language !== language) {
      localStorage.setItem("language", settings.language);
      await changeLanguage(settings.language);
      showMessage(t("settings.settingsSaved"), "success");
    } else {
      showMessage(t("settings.settingsSaved"), "success");
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const resetSettings = () => {
    const defaults = { language: "fr", currency: "eur", dateFormat: "dd/mm/yyyy" };
    setSettings(defaults);
    localStorage.setItem("language", "fr");
    localStorage.setItem("currency", "eur");
    localStorage.setItem("dateFormat", "dd/mm/yyyy");
    
    if (language !== "fr") {
      changeLanguage("fr");
    }
    
    showMessage(t("settings.settingsReset"), "success");
  };

  const logout = () => {
    if (confirm(t("settings.logoutWarning"))) {
      localStorage.clear();
      router.push("/");
    }
  };

  const formatDateExample = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    if (settings.dateFormat === "mm/dd/yyyy") return `${month}/${day}/${year}`;
    if (settings.dateFormat === "yyyy-mm-dd") return `${year}-${month}-${day}`;
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount) => {
    const symbols = { eur: "€", usd: "$", gbp: "£", tnd: "DT" };
    return `${amount.toLocaleString()} ${symbols[settings.currency] || "€"}`;
  };

  const getCurrentLanguageName = () => {
    switch (settings.language) {
      case "fr": return "Français";
      case "en": return "English";
      case "es": return "Español";
      default: return "Français";
    }
  };

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `;

  // FIX: Loading state with sidebar
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        minHeight: "100vh", 
        width: "100%", 
        background: theme.background,
        padding: 0,
        margin: 0
      }}>
        <Sidebar />
        <div style={{ 
          flex: 1,
          marginLeft: isMobile ? "0" : "280px",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          minHeight: "100vh",
          background: theme.background
        }}>
          <style>{animations}</style>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <IconLoader size={isMobile ? 36 : 44} color={theme.primary} />
            </div>
            <p style={{ fontSize: isMobile ? "12px" : "14px" }}>{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: theme.background, 
      display: "flex",
      padding: 0,
      margin: 0
    }}>
      <style>{animations}</style>
      
      <Sidebar />
      
      <div style={{ 
        marginLeft: contentMarginLeft,
        flex: 1, 
        padding: containerPadding,
        paddingBottom: isMobile ? "70px" : containerPadding,
        overflowX: "hidden",
        width: "100%",
        minHeight: "100vh",
        background: theme.background,
        transition: "margin-left 0.3s ease"
      }}>
        <div style={{ maxWidth: isMobile ? "100%" : "800px", margin: "0 auto", width: "100%" }}>

          {/* Header */}
          <div style={{
            marginBottom: sectionMargin,
            animation: "fadeInDown 0.5s ease",
            opacity: animateCards ? 1 : 0,
            transform: animateCards ? "translateY(0)" : "translateY(-20px)"
          }}>
            <h1 style={{ color: theme.text, fontSize: headerTitleSize, display: "flex", alignItems: "center", gap: "10px" }}>
              <IconSettings size={isMobile ? 22 : 28} color={theme.primary} />
              {t("common.settings")}
            </h1>
            <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>
              {t("settings.subtitle")}
            </p>
          </div>

          {/* Notification */}
          {message && (
            <div style={{
              background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`,
              color: messageType === "success" ? "#10b981" : "#f87171",
              padding: isMobile ? "10px 14px" : "12px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              animation: "fadeInUp 0.3s ease",
              fontSize: isMobile ? "12px" : "14px"
            }}>
              {messageType === "success"
                ? <IconCheckCircle size={16} color="#10b981" />
                : <IconAlertCircle size={16} color="#f87171" />
              }
              {message}
            </div>
          )}

          {/* SECTION LANGUE */}
          <div style={{
            background: theme.surface,
            borderRadius: cardRadius,
            padding: cardPadding,
            border: `1px solid ${theme.border}`,
            marginBottom: sectionMargin,
            opacity: animateCards ? 1 : 0,
            transition: "transform 0.3s, box-shadow 0.3s",
            animation: "fadeInUp 0.5s ease 0.1s both"
          }}
            onMouseEnter={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ color: theme.text, fontSize: isMobile ? "16px" : "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                <IconGlobe size={iconSize} color={theme.primary} />
                {t("settings.language")}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <img
                  src={`https://flagcdn.com/w40/${flagCodes[settings.language]}.png`}
                  alt="flag"
                  style={{ borderRadius: "4px", width: isMobile ? "30px" : "40px", height: isMobile ? "20px" : "auto", boxShadow: "0 0 10px rgba(0,0,0,0.5)" }}
                />
                <span style={{ color: theme.accent, fontSize: isMobile ? "12px" : "14px", fontWeight: "bold" }}>
                  {getCurrentLanguageName()}
                </span>
              </div>
            </div>
            <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px", fontSize: isMobile ? "12px" : "14px" }}>
              {t("settings.interfaceLanguage")}
            </label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              style={{ width: "100%", padding: selectPadding, background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", transition: "border-color 0.2s", fontSize: isMobile ? "13px" : "14px" }}
              onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
              onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
            >
              <option value="fr">FRANÇAIS</option>
              <option value="en">ENGLISH</option>
              <option value="es">ESPAÑOL</option>
            </select>
            <div style={{ marginTop: "12px", padding: "10px", background: `${theme.primary}15`, borderRadius: "8px", border: `1px solid ${theme.primary}30`, fontSize: isMobile ? "11px" : "12px" }}>
              <span style={{ color: theme.textSecondary }}>
                {t("settings.currentLanguage")}: <strong style={{ color: theme.accent }}>{getCurrentLanguageName()}</strong>
              </span>
            </div>
          </div>

          {/* SECTION DEVISE */}
          <div style={{
            background: theme.surface,
            borderRadius: cardRadius,
            padding: cardPadding,
            border: `1px solid ${theme.border}`,
            marginBottom: sectionMargin,
            opacity: animateCards ? 1 : 0,
            transition: "transform 0.3s, box-shadow 0.3s",
            animation: "fadeInUp 0.5s ease 0.2s both"
          }}
            onMouseEnter={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(0)")}
          >
            <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "16px" : "18px", display: "flex", alignItems: "center", gap: "8px" }}>
              <IconCurrency size={iconSize} color={theme.primary} />
              {t("settings.currency")}
            </h3>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              style={{ width: "100%", padding: selectPadding, background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}
            >
              <option value="eur">Euro (€)</option>
              <option value="usd">Dollar US ($)</option>
              <option value="gbp">Livre sterling (£)</option>
              <option value="tnd">Dinar tunisien (DT)</option>
            </select>
            <div style={{ marginTop: "12px", padding: "12px", background: theme.surfaceHover, borderRadius: "8px", color: theme.accent, fontSize: isMobile ? "12px" : "14px" }}>
              {t("settings.example")}: <b>{formatCurrency(1000)}</b>
            </div>
          </div>

          {/* SECTION FORMAT DATE */}
          <div style={{
            background: theme.surface,
            borderRadius: cardRadius,
            padding: cardPadding,
            border: `1px solid ${theme.border}`,
            marginBottom: sectionMargin,
            opacity: animateCards ? 1 : 0,
            transition: "transform 0.3s, box-shadow 0.3s",
            animation: "fadeInUp 0.5s ease 0.3s both"
          }}
            onMouseEnter={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(0)")}
          >
            <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "16px" : "18px", display: "flex", alignItems: "center", gap: "8px" }}>
              <IconCalendar size={iconSize} color={theme.primary} />
              {t("settings.dateFormat")}
            </h3>
            <select
              value={settings.dateFormat}
              onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
              style={{ width: "100%", padding: selectPadding, background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}
            >
              <option value="dd/mm/yyyy">DD/MM/YYYY (Ex: {formatDateExample(new Date())})</option>
              <option value="mm/dd/yyyy">MM/DD/YYYY (Ex: {formatDateExample(new Date())})</option>
              <option value="yyyy-mm-dd">YYYY-MM-DD (Ex: {formatDateExample(new Date())})</option>
            </select>
          </div>

          {/* BOUTONS ACTIONS */}
          <div style={{
            display: "flex",
            gap: isMobile ? "12px" : "16px",
            marginBottom: sectionMargin,
            opacity: animateCards ? 1 : 0,
            animation: "fadeInUp 0.5s ease 0.4s both",
            flexDirection: isMobile ? "column" : "row"
          }}>
            <button
              onClick={saveSettings}
              style={{ 
                flex: 1, 
                padding: buttonPadding, 
                background: theme.gradient, 
                color: "white", 
                border: "none", 
                borderRadius: "10px", 
                fontWeight: "bold", 
                cursor: "pointer", 
                transition: "all 0.2s", 
                fontSize: isMobile ? "14px" : "16px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                gap: "8px",
                WebkitTapHighlightColor: "transparent"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              onTouchStart={(e) => e.currentTarget.style.opacity = "0.8"}
              onTouchEnd={(e) => e.currentTarget.style.opacity = "1"}
            >
              <IconSave size={18} color="white" />
              {t("common.save")}
            </button>
            <button
              onClick={resetSettings}
              style={{ 
                flex: 1, 
                padding: buttonPadding, 
                background: theme.surfaceHover, 
                color: theme.text, 
                border: `1px solid ${theme.border}`, 
                borderRadius: "10px", 
                cursor: "pointer", 
                transition: "all 0.2s", 
                fontSize: isMobile ? "14px" : "16px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                gap: "8px",
                WebkitTapHighlightColor: "transparent"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme.surface}
              onMouseLeave={(e) => e.currentTarget.style.background = theme.surfaceHover}
              onTouchStart={(e) => e.currentTarget.style.opacity = "0.8"}
              onTouchEnd={(e) => e.currentTarget.style.opacity = "1"}
            >
              <IconReset size={18} color={theme.text} />
              {t("common.reset")}
            </button>
          </div>

          {/* BOUTON DÉCONNEXION */}
          <button
            onClick={logout}
            style={{ 
              width: "100%", 
              padding: buttonPadding, 
              background: "#c33", 
              color: "white", 
              border: "none", 
              borderRadius: "10px", 
              fontWeight: "bold", 
              cursor: "pointer", 
              transition: "all 0.2s ease", 
              animation: "fadeInUp 0.5s ease 0.45s both", 
              opacity: animateCards ? 1 : 0, 
              fontSize: isMobile ? "14px" : "16px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "8px",
              WebkitTapHighlightColor: "transparent"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#ff4444"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#c33"}
            onTouchStart={(e) => e.currentTarget.style.opacity = "0.8"}
            onTouchEnd={(e) => e.currentTarget.style.opacity = "1"}
          >
            <IconLogout size={18} color="white" />
            {t("common.logout")}
          </button>
        </div>
      </div>
    </div>
  );
}