// app/dashboard/logistics/page.tsx — la logistique s'ouvre sur ses expéditions.
// Chaque onglet a sa propre page : /dashboard/logistics/shipments, /carriers et /analytics.
import { redirect } from "next/navigation";

export default async function LogisticsIndex({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // La recherche globale arrive avec « ?q=… » : le terme cherché suit la redirection.
  const { q } = await searchParams;
  redirect("/dashboard/logistics/shipments" + (typeof q === "string" && q ? `?q=${encodeURIComponent(q)}` : ""));
}
