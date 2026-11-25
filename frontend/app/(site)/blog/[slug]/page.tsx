// app/(site)/blog/[slug]/page.tsx — un article (content/site/posts/<slug>.json)
// Les versions française et espagnole d'un article ont leur propre adresse : <slug>-fr, <slug>-es.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Blocks, SiteLink } from "@/components/site/SiteBlocks";
import { loadPost, postVariants, siteT, type SiteLang } from "@/lib/site/content";

// Next.js 16 : params est une promesse.
type Props = { params: Promise<{ slug: string }> };

const LANGUAGE_NAMES: Record<SiteLang, string> = { en: "English", fr: "Français", es: "Español" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return {};
  const languages: Record<string, string> = {};
  for (const variant of postVariants(post.base)) languages[variant.lang] = `/blog/${variant.slug}`;
  return {
    title: post.seoTitle || `${post.title} | Inovexa ERP`,
    description: post.description,
    alternates: { languages },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  // Libellés autour de l'article : dans la langue de l'article lui-même.
  const t = siteT(post.lang);
  const others = postVariants(post.base).filter((variant) => variant.slug !== post.slug);

  return (
    <article className="st-page st-post" lang={post.lang}>
      <header className="st-hero">
        <div className="st-wrap st-narrow">
          <p className="st-eyebrow">
            <Link href="/blog">Blog</Link>
            {post.kicker ? ` · ${post.kicker}` : ""}
          </p>
          <h1 className="st-h1">{post.title}</h1>
          <p className="st-post-meta">
            {t("blogPost.author")} · {post.dateLine}
          </p>
          {others.length > 0 ? (
            <p className="st-post-langs">
              {others.map((variant) => (
                <Link key={variant.slug} href={`/blog/${variant.slug}`} hrefLang={variant.lang} lang={variant.lang}>
                  {LANGUAGE_NAMES[variant.lang]}
                </Link>
              ))}
            </p>
          ) : null}
        </div>
      </header>

      <div className="st-wrap st-narrow st-prose">
        <Blocks blocks={post.blocks} />
        <p className="st-actions">
          <Link href="/blog" className="st-btn st-btn-ghost">
            ← {t("blogPost.backToBlog")}
          </Link>
        </p>
      </div>

      {post.cta ? (
        <section className="st-section st-cta-band">
          <div className="st-wrap st-narrow">
            <header className="st-section-head">
              <h2 className="st-h2">{post.cta.title}</h2>
              {post.cta.text ? <p className="st-lead">{post.cta.text}</p> : null}
            </header>
            <p className="st-actions">
              {post.cta.actions.map((action, i) => (
                <SiteLink key={i} href={action.href} className={i === 0 ? "st-btn" : "st-btn st-btn-ghost"}>
                  {action.label}
                </SiteLink>
              ))}
            </p>
          </div>
        </section>
      ) : null}

      {post.related.length > 0 ? (
        <section className="st-section">
          <div className="st-wrap">
            <header className="st-section-head">
              <h2 className="st-h2">{t("blogPost.relatedArticles")}</h2>
            </header>
            <div className="st-cards">
              {post.related.map((item) => (
                <article key={item.href} className="st-card">
                  {item.badge ? <span className="st-badge">{item.badge}</span> : null}
                  <h3 className="st-card-title">
                    <SiteLink href={item.href}>{item.title}</SiteLink>
                  </h3>
                  {item.meta ? <p className="st-muted">{item.meta}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
