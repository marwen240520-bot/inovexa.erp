"use client";
// components/logistics/fields.tsx
// Champs des formulaires : un vrai libellé relié au champ, le pictogramme à l'intérieur (comme avant),
// l'aide et l'erreur annoncées par aria-describedby.
import type { InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes } from "react";
import { controlStyle } from "./styles";

interface FieldShell {
  id: string;
  label: string;
  required?: boolean;
  icon?: ReactNode;
  hint?: string;
  error?: string | null;
}

function Shell({ id, label, required, icon, hint, error, children }: FieldShell & { children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>
        {label}
        {required && <span aria-hidden="true" style={{ color: "var(--theme-danger, #dc2626)" }}> *</span>}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {icon && <span style={{ position: "absolute", insetInlineStart: 10, display: "flex", color: "var(--theme-text-secondary)", pointerEvents: "none" }}>{icon}</span>}
        {children}
      </div>
      {hint && !error && <p id={`${id}-hint`} style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>{hint}</p>}
      {error && <p id={`${id}-error`} style={{ fontSize: 12, color: "var(--theme-danger, #dc2626)" }}>{error}</p>}
    </div>
  );
}

const describedBy = (id: string, hint?: string, error?: string | null) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

const fieldStyle = (hasIcon: boolean, error?: string | null) => ({
  ...controlStyle,
  paddingInlineStart: hasIcon ? 32 : 12,
  borderColor: error ? "var(--theme-danger, #dc2626)" : "var(--theme-border)",
});

export function TextField({ id, label, required, icon, hint, error, inputRef, ...input }: FieldShell & { inputRef?: Ref<HTMLInputElement> } & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "style" | "className">) {
  return (
    <Shell id={id} label={label} required={required} icon={icon} hint={hint} error={error}>
      <input
        {...input}
        ref={inputRef}
        id={id}
        className="lgx-control"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        style={fieldStyle(!!icon, error)}
      />
    </Shell>
  );
}

export function SelectField({ id, label, required, icon, hint, error, children, ...select }: FieldShell & { children: ReactNode } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "style" | "className">) {
  return (
    <Shell id={id} label={label} required={required} icon={icon} hint={hint} error={error}>
      <select
        {...select}
        id={id}
        className="lgx-control"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        style={{ ...fieldStyle(!!icon, error), cursor: "pointer" }}
      >
        {children}
      </select>
    </Shell>
  );
}
