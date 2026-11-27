// app/robots.ts — robots.txt : les pages publiques sont ouvertes aux moteurs de recherche, les espaces privés non.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // La règle la plus précise l'emporte : /auth/register reste explorable malgré l'interdiction de /auth/.
        allow: ["/", "/auth/register"],
        disallow: ["/api/", "/dashboard/", "/admin/", "/transporteur/", "/subscription", "/reset-password", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
