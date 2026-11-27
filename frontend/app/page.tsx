// app/page.tsx — page d'accueil (enveloppe serveur).
//
// Le contenu de la page est dans components/home/HomePage.tsx (composant client). Ce fichier ajoute ce qui doit se
// trouver dans le HTML envoyé par le serveur pour les moteurs de recherche et les aperçus de partage : titre et
// description dans la langue du visiteur, adresse canonique, balises Open Graph / Twitter et données structurées
// JSON-LD (organisation, site, application).
import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { HOME_SEO } from "@/components/home/homeSeo";
import { ALL_MODULES, MODULE_INFO, pick } from "@/lib/catalog";
import { getSiteLang } from "@/lib/site/content";
import { SITE_URL, absoluteUrl } from "@/lib/site/siteUrl";

const LOGO = "/images/logo.png";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getSiteLang();
  const seo = HOME_SEO[lang];
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: "Inovexa ERP",
      title: seo.title,
      description: seo.description,
      locale: seo.locale,
      images: [{ url: LOGO, alt: "Inovexa ERP" }],
    },
    twitter: { card: "summary", title: seo.title, description: seo.description, images: [LOGO] },
  };
}

export default async function Page() {
  const lang = await getSiteLang();
  const seo = HOME_SEO[lang];
  const organizationId = `${SITE_URL}/#organization`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Inovexa ERP",
        alternateName: "MSAI Systems",
        url: SITE_URL,
        logo: absoluteUrl(LOGO),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "contact@inovexa-erp.com",
          availableLanguage: ["French", "English", "Spanish"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Inovexa ERP",
        inLanguage: ["fr", "en", "es"],
        publisher: { "@id": organizationId },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: "Inovexa ERP",
        url: SITE_URL,
        description: seo.description,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: lang,
        featureList: ALL_MODULES.map((key) => pick(MODULE_INFO[key].label, lang)),
        publisher: { "@id": organizationId },
      },
    ],
  };
  return (
    <>
      {/* « < » échappé : le JSON ne peut pas refermer la balise <script>. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <HomePage />
    </>
  );
}
