"use client";
/**
 * Sous-navigation d'un module regroupant plusieurs pages (RH, Clients, Paramètres…).
 * L'onglet actif se déduit de l'adresse : chemin de la page, puis paramètre `?tab=`.
 */
import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCompanyProfile, type LocalFeatures } from "@/lib/company-profile";

/** `feature` : l'onglet n'existe que si la société dispose de cette fonction locale (paie : Tunisie uniquement). */
export interface ModuleTab { key: string; label: string; href: string; path: string; tab?: string; feature?: keyof LocalFeatures }

export const HR_TABS: ModuleTab[] = [
  { key: "employees", label: "Employés", href: "/dashboard/hr", path: "/dashboard/hr" },
  { key: "payroll", label: "Bulletins de paie", href: "/dashboard/hr/payroll?tab=payroll", path: "/dashboard/hr/payroll", tab: "payroll", feature: "payroll" },
  { key: "leaves", label: "Congés", href: "/dashboard/hr/payroll?tab=leaves", path: "/dashboard/hr/payroll", tab: "leaves" },
  { key: "settings", label: "Paramètres de paie", href: "/dashboard/hr/payroll?tab=settings", path: "/dashboard/hr/payroll", tab: "settings", feature: "payroll" },
];

export const CLIENT_TABS: ModuleTab[] = [
  { key: "list", label: "Clients", href: "/dashboard/clients", path: "/dashboard/clients" },
  { key: "overview", label: "Fiche 360°", href: "/dashboard/crm?tab=overview", path: "/dashboard/crm", tab: "overview" },
  { key: "followups", label: "À relancer", href: "/dashboard/crm?tab=followups", path: "/dashboard/crm", tab: "followups" },
  { key: "prices", label: "Listes de prix", href: "/dashboard/crm?tab=prices", path: "/dashboard/crm", tab: "prices" },
];

export const SETTINGS_TABS: ModuleTab[] = [
  { key: "preferences", label: "Préférences", href: "/dashboard/settings", path: "/dashboard/settings" },
  { key: "company", label: "Société & fiscalité", href: "/dashboard/company", path: "/dashboard/company" },
];

export default function ModuleNav({ tabs: all, label }: { tabs: ModuleTab[]; label: string }) {
  const { features } = useCompanyProfile();
  const tabs = all.filter((t) => !t.feature || features[t.feature]);
  const pathname = usePathname() || "";
  const params = useSearchParams();
  const tab = params.get("tab");
  // Onglet demandé mais masqué (fonction locale absente, ex. la paie hors Tunisie) : la page affiche alors un onglet visible de la même page.
  const hiddenTab = !!tab && all.some((t) => t.path === pathname && t.tab === tab && t.feature && !features[t.feature]);
  // Le plus précis gagne : même chemin + même ?tab, sinon même chemin, sinon le premier onglet.
  const current =
    tabs.find((t) => t.path === pathname && t.tab && t.tab === tab) ||
    (hiddenTab ? tabs.find((t) => t.path === pathname && t.tab) : undefined) ||
    tabs.find((t) => t.path === pathname && (!t.tab || !tab)) ||
    tabs.find((t) => pathname.startsWith(t.path + "/") || t.path === pathname) ||
    tabs[0];
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
