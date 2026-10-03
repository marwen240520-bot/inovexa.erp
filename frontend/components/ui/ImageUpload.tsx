"use client";
import React, { useRef, useState } from "react";
import { IMAGE_ACCEPT, resizeImageToDataUrl } from "@/lib/imageUtils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (dataUrl: string) => void;
  labels?: { add: string; change: string; remove: string; hint: string; error: string };
  size?: number;
}

const DEFAULT_LABELS = {
  add: "Ajouter une photo",
  change: "Changer la photo",
  remove: "Retirer",
  hint: "PNG, JPEG ou WebP — réduite automatiquement",
  error: "Impossible de lire cette image",
};

/** Sélecteur de photo (galerie ou appareil photo sur mobile) avec aperçu et réduction automatique. */
export default function ImageUpload({ value, onChange, labels = DEFAULT_LABELS, size = 96 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError("");
    try {
      onChange(await resizeImageToDataUrl(file));
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const btn: React.CSSProperties = {
    padding: "9px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 40,
    background: "var(--theme-surface-hover)", color: "var(--theme-text)", border: "1px solid var(--theme-border)",
  };

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: size, height: size, borderRadius: 14, flexShrink: 0, cursor: "pointer", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--theme-surface-hover)", border: "2px dashed var(--theme-border-hover, var(--theme-border))",
          color: "var(--theme-text-secondary)",
        }}
        role="button"
        aria-label={value ? labels.change : labels.add}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} style={btn}>
            {busy ? "…" : value ? labels.change : labels.add}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} style={{ ...btn, color: "#b91c1c", borderColor: "rgba(185,28,28,0.35)" }}>
              {labels.remove}
            </button>
          )}
        </div>
        <span style={{ fontSize: 11, color: "var(--theme-text-secondary)" }}>{error || labels.hint}</span>
      </div>
      <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} onChange={(e) => pick(e.target.files?.[0])} style={{ display: "none" }} />
    </div>
  );
}
