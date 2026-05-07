"use client";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <button
        onClick={() => changeLanguage("fr")}
        style={{
          padding: "6px 12px",
          background: language === "fr" ? "#667eea" : "#1a1a1a",
          border: `1px solid ${language === "fr" ? "#667eea" : "#333"}`,
          borderRadius: "6px",
          color: "white",
          cursor: "pointer",
          fontSize: "12px"
        }}
      >
        🇫🇷 FR
      </button>
      <button
        onClick={() => changeLanguage("en")}
        style={{
          padding: "6px 12px",
          background: language === "en" ? "#667eea" : "#1a1a1a",
          border: `1px solid ${language === "en" ? "#667eea" : "#333"}`,
          borderRadius: "6px",
          color: "white",
          cursor: "pointer",
          fontSize: "12px"
        }}
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
