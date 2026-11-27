"use client";
import { usePathname } from "next/navigation";
import CrmApp, { CRM_TAB_PATHS } from "./CrmApp";

const CRM_PATHS: readonly string[] = Object.values(CRM_TAB_PATHS);

/**
 * Affiche l'écran CRM (Fiche 360°, À relancer, Listes de prix) uniquement sur l'adresse de l'un de ses onglets :
 * /dashboard/clients (la liste des clients) a sa propre page. Le layout est partagé par la liste et par les onglets.
 */
export default function ClientsShell() {
  const pathname = (usePathname() || "").replace(/\/+$/, "");
  if (!CRM_PATHS.includes(pathname)) return null;
  return <CrmApp />;
}
