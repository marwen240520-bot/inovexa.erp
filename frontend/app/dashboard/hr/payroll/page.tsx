import { redirect } from "next/navigation";

// RH › Bulletins de paie (écran monté par ../layout.tsx). Les anciennes adresses /dashboard/hr/payroll?tab=leaves
// et ?tab=settings mènent aux nouvelles pages ; ?tab=payroll (ou sans onglet) reste ici.
export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { tab } = await searchParams;
  const t = Array.isArray(tab) ? tab[0] : tab;
  if (t === "leaves") redirect("/dashboard/hr/leaves");
  if (t === "settings") redirect("/dashboard/hr/payroll/settings");
  return null;
}
