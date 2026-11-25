// app/(site)/pricing/page.tsx — page publique « pricing » (contenu : content/site/pages/pricing.<langue>.json)
import { SitePage, sitePageMetadata } from "@/components/site/SitePage";

export function generateMetadata() {
  return sitePageMetadata("pricing");
}

export default function Page() {
  return <SitePage name="pricing" />;
}
