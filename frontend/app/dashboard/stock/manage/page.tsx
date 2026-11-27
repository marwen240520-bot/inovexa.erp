import { redirect } from "next/navigation";

// Anciennes adresses /dashboard/stock/manage?tab=lots… : elles mènent à la page de l'onglet (/dashboard/stock/lots).
const TABS = ["levels", "warehouses", "movements", "lots", "counts", "alerts", "rotation", "valuation"];

export default async function StockManageRedirectPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { tab } = await searchParams;
  const t = Array.isArray(tab) ? tab[0] : tab;
  redirect(`/dashboard/stock/${TABS.includes(t ?? "") ? t : "levels"}`);
}
