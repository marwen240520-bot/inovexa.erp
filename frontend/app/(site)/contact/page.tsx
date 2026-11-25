// app/(site)/contact/page.tsx — page publique « contact » (contenu : content/site/pages/contact.<langue>.json)
import { SitePage, sitePageMetadata } from "@/components/site/SitePage";

export function generateMetadata() {
  return sitePageMetadata("contact");
}

export default function Page() {
  return <SitePage name="contact" />;
}
