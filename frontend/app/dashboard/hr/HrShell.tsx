"use client";
import { usePathname } from "next/navigation";
import PayrollApp, { HR_TAB_PATHS } from "./PayrollApp";

const HR_PATHS: readonly string[] = Object.values(HR_TAB_PATHS);

/**
 * Affiche l'écran Paie et congés (bulletins, paramètres de paie, congés) uniquement sur l'adresse de l'un de ses onglets :
 * /dashboard/hr (la liste des employés) a sa propre page. Le layout est partagé par les employés et par les pages de paie.
 */
export default function HrShell() {
  const pathname = (usePathname() || "").replace(/\/+$/, "");
  if (!HR_PATHS.includes(pathname)) return null;
  return <PayrollApp />;
}
