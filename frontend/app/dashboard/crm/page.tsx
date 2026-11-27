import { redirect } from "next/navigation";

// Le CRM est fusionné avec la page Clients. Les anciennes adresses (/dashboard/crm, /dashboard/crm?tab=followups…)
// restent valables : elles mènent à la sous-page équivalente de Clients.
export default async function CrmRedirectPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { tab } = await searchParams;
  const t = Array.isArray(tab) ? tab[0] : tab;
  redirect(t === "followups" ? "/dashboard/clients/followups" : t === "prices" ? "/dashboard/clients/prices" : "/dashboard/clients/overview");
}
