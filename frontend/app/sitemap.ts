// app/sitemap.ts — sitemap.xml : pages publiques et articles du blog.
import type { MetadataRoute } from "next";
import postsIndex from "@/content/site/posts/index.json";
import { absoluteUrl } from "@/lib/site/siteUrl";

type Entry = MetadataRoute.Sitemap[number];

const PAGES: Array<{ path: string; priority: number; changeFrequency: NonNullable<Entry["changeFrequency"]> }> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/products", priority: 0.9, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/auth/register", priority: 0.8, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
  const posts: MetadataRoute.Sitemap = (postsIndex as Array<{ slug: string; date?: string }>).map((post) => {
    const when = post.date ? new Date(post.date) : null;
    return {
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: when && !Number.isNaN(when.getTime()) ? when : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    };
  });
  return [...pages, ...posts];
}
