// app/(site)/about/page.tsx — page publique « about » (contenu : content/site/pages/about.<langue>.json)
import { SitePage, sitePageMetadata } from "@/components/site/SitePage";

export function generateMetadata() {
  return sitePageMetadata("about");
}

export default function Page() {
  return <SitePage name="about" />;
}
