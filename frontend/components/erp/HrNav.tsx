"use client";
/** Sous-navigation du module Ressources humaines : employés, bulletins de paie, congés, paramètres de paie. */
import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export const HR_TABS = [
  ["employees", "Employés", "/dashboard/hr"],
  ["payroll", "Bulletins de paie", "/dashboard/hr/payroll?tab=payroll"],
  ["leaves", "Congés", "/dashboard/hr/payroll?tab=leaves"],
  ["settings", "Paramètres de paie", "/dashboard/hr/payroll?tab=settings"],
] as const;
export type HrTab = (typeof HR_TABS)[number][0];

export default function HrNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current: HrTab = pathname?.startsWith("/dashboard/hr/payroll") ? ((params.get("tab") as HrTab) || "payroll") : "employees";
  return (
    <nav aria-label="Ressources humaines" style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--theme-border)", marginBottom: 18, overflowX: "auto" }}>
      {HR_TABS.map(([key, label, href]) => {
        const active = key === current;
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            style={{
              padding: "10px 14px", fontSize: 14, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", textDecoration: "none",
              color: active ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary)",
              borderBottom: `2px solid ${active ? "var(--theme-primary, #4f46e5)" : "transparent"}`, marginBottom: -1,
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
