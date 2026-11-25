// app/(site)/terms/page.tsx — page publique « terms » (contenu : content/site/pages/terms.<langue>.json)
import { SitePage, sitePageMetadata } from "@/components/site/SitePage";

export function generateMetadata() {
  return sitePageMetadata("terms");
}

export default function Page() {
  return <SitePage name="terms" />;
}
