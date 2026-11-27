"use client";
/**
 * Sous-navigation d'un module regroupant plusieurs pages (RH, Clients, Paramètres…).
 * Chaque onglet a SA PROPRE adresse (les mêmes que les sous-pages du menu latéral) ; l'onglet actif se déduit du
 * chemin de la page : l'adresse la plus précise gagne.
 */
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompanyProfile, type LocalFeatures } from "@/lib/company-profile";

/**
 * `feature` : l'onglet n'existe que si la société dispose de cette fonction locale (paie : Tunisie uniquement).
 * `fallbackKey` : onglet affiché à sa place quand la fonction est absente (la paie hors Tunisie ouvre les congés).
 */
export interface ModuleTab { key: string; label: string; href: string; feature?: keyof LocalFeatures; fallbackKey?: string }

export const HR_TABS: ModuleTab[] = [
  { key: "employees", label: "Employés", href: "/dashboard/hr" },
  { key: "payroll", label: "Bulletins de paie", href: "/dashboard/hr/payroll", feature: "payroll", fallbackKey: "leaves" },
  { key: "leaves", label: "Congés", href: "/dashboard/hr/leaves" },
  { key: "settings", label: "Paramètres de paie", href: "/dashboard/hr/payroll/settings", feature: "payroll", fallbackKey: "leaves" },
];

export const CLIENT_TABS: ModuleTab[] = [
  { key: "list", label: "Clients", href: "/dashboard/clients" },
  { key: "overview", label: "Fiche 360°", href: "/dashboard/clients/overview" },
  { key: "followups", label: "À relancer", href: "/dashboard/clients/followups" },
  { key: "prices", label: "Listes de prix", href: "/dashboard/clients/prices" },
];

export const SETTINGS_TABS: ModuleTab[] = [
  { key: "preferences", label: "Préférences", href: "/dashboard/settings" },
  { key: "company", label: "Société & fiscalité", href: "/dashboard/company" },
];

export default function ModuleNav({ tabs: all, label }: { tabs: ModuleTab[]; label: string }) {
  const { features } = useCompanyProfile();
  const tabs = all.filter((t) => !t.feature || features[t.feature]);
  const pathname = (usePathname() || "").replace(/\/+$/, "");
  // L'adresse la plus précise gagne (/dashboard/hr/payroll/settings avant /dashboard/hr/payroll avant /dashboard/hr).
  const best = [...all]
    .sort((a, b) => b.href.length - a.href.length)
    .find((t) => pathname === t.href || pathname.startsWith(t.href + "/"));
  // Onglet masqué (fonction locale absente) : l'onglet de repli de la même page prend sa place.
  const target = best && best.feature && !features[best.feature] && best.fallbackKey ? all.find((t) => t.key === best.fallbackKey) : best;
  const current = target && tabs.includes(target) ? target : tabs[0];
  return (
    <nav aria-label={label} style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--theme-border)", marginBottom: 18, overflowX: "auto" }}>
      {tabs.map((t) => {
        const active = t.key === current.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={active ? "page" : undefined}
            style={{
              padding: "10px 14px", fontSize: 14, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", textDecoration: "none",
              color: active ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary)",
              borderBottom: `2px solid ${active ? "var(--theme-primary, #4f46e5)" : "transparent"}`, marginBottom: -1,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
