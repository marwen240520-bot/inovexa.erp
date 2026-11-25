// app/(site)/products/page.tsx — page publique « products » (contenu : content/site/pages/products.<langue>.json)
import { SitePage, sitePageMetadata } from "@/components/site/SitePage";

export function generateMetadata() {
  return sitePageMetadata("products");
}

export default function Page() {
  return <SitePage name="products" />;
}
