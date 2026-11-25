// lib/site/content.ts
// Contenu des pages publiques (produits, tarifs, à propos, contact, blog, mentions légales).
// Les fichiers de content/site sont générés à partir de l'export docs/contenu-site (site inovexa-erp.com).
// Module serveur uniquement (pas de "use client").
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, lookup, pickLanguage } from "@/lib/i18n";
import en from "@/content/site/i18n/en.json";
import fr from "@/content/site/i18n/fr.json";
import es from "@/content/site/i18n/es.json";
import postsIndex from "@/content/site/posts/index.json";

export type SiteLang = "en" | "fr" | "es";
export const SITE_LANGS: SiteLang[] = ["en", "fr", "es"];
export type PageName = "products" | "pricing" | "about" | "contact" | "privacy" | "terms";

/** Texte en ligne : chaîne, ou nœud (b, i, s, code, a, img, br). */
export type Inline = string | { t: string; c?: Inline[]; href?: string; src?: string; alt?: string };
/** Bloc de contenu : hero, section, cards, stats, actions, plans, faq, table, h, p, ul, ol, quote… */
export type Block = { t: string; [key: string]: any };

export interface SitePageData {
  title: string;
  description: string;
  lang: string;
  blocks: Block[];
}

export interface PostHead {
  slug: string;
  lang: SiteLang;
  /** Identifiant commun aux versions en/fr/es d'un même article. */
  base: string;
  title: string;
  description: string;
  kicker: string;
  dateLine: string;
  date: string;
}

export interface Post extends PostHead {
  seoTitle: string;
  blocks: Block[];
  related: { badge: string; title: string; meta: string; href: string }[];
  cta: { title: string; text: string; actions: { href: string; label: string }[] } | null;
}

const DICTS: Record<SiteLang, any> = { en, fr, es };
const POSTS = postsIndex as unknown as PostHead[];

/** Langue des pages publiques : celle de l'application (cookie « lang ») ; anglais si elle n'a pas de contenu (arabe). */
export async function getSiteLang(): Promise<SiteLang> {
  const jar = await cookies();
  const h = await headers();
  const lang = pickLanguage(jar.get(LANG_COOKIE)?.value, h.get("accept-language"));
  return lang === "fr" || lang === "es" ? lang : "en";
}

/** Traducteur des textes du site : clé « section.cle », repli sur l'anglais puis sur la clé. */
export function siteT(lang: SiteLang) {
  return (key: string): string => {
    const value = lookup(DICTS[lang], key) ?? lookup(en, key);
    return typeof value === "string" ? value : key;
  };
}

export async function loadPage(name: PageName, lang: SiteLang): Promise<SitePageData> {
  const mod = await import(`@/content/site/pages/${name}.${lang}.json`);
  return mod.default as SitePageData;
}

export function plainText(nodes: Inline[] | undefined): string {
  if (!nodes) return "";
  return nodes
    .map((node) => (typeof node === "string" ? node : node.t === "br" ? " " : plainText(node.c)))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/** Versions disponibles d'un article (en, et parfois fr / es). */
export function postVariants(base: string): PostHead[] {
  return POSTS.filter((post) => post.base === base);
}

/** Articles affichés dans une langue : la version traduite si elle existe, sinon l'article en anglais. */
export function listPosts(lang: SiteLang): PostHead[] {
  const bases = Array.from(new Set(POSTS.map((post) => post.base)));
  const picked: PostHead[] = [];
  for (const base of bases) {
    const variants = postVariants(base);
    const post = variants.find((v) => v.lang === lang) ?? variants.find((v) => v.lang === "en") ?? variants[0];
    if (post) picked.push(post);
  }
  return picked.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
}

export async function loadPost(slug: string): Promise<Post | null> {
  if (!/^[a-z0-9-]+$/.test(slug) || !POSTS.some((post) => post.slug === slug)) return null;
  const mod = await import(`@/content/site/posts/${slug}.json`);
  return mod.default as Post;
}
