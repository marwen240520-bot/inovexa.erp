// app/(site)/privacy/page.tsx — page publique « privacy » (contenu : content/site/pages/privacy.<langue>.json)
import { SitePage, sitePageMetadata } from "@/components/site/SitePage";

export function generateMetadata() {
  return sitePageMetadata("privacy");
}

export default function Page() {
  return <SitePage name="privacy" />;
}
