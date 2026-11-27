"use client";
import { usePathname } from "next/navigation";
import ReportsApp from "./ReportsApp";

/**
 * Affiche l'écran des rapports (Générer / Enregistrés) sauf sur /dashboard/reports/business,
 * qui a sa propre page : le layout est partagé par les deux.
 */
export default function ReportsShell() {
  const pathname = usePathname() || "";
  if (pathname === "/dashboard/reports/business" || pathname.startsWith("/dashboard/reports/business/")) return null;
  return <ReportsApp />;
}
