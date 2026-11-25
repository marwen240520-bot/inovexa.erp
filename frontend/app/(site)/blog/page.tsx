// app/(site)/blog/page.tsx — liste des articles (content/site/posts/index.json)
import type { Metadata } from "next";
import Link from "next/link";
import { getSiteLang, listPosts, siteT, type PostHead, type SiteLang } from "@/lib/site/content";

export async function generateMetadata(): Promise<Metadata> {
  const t = siteT(await getSiteLang());
  return {
    title: `${t("blog.heroTitle1")} ${t("blog.heroTitle2")} | Inovexa ERP`,
    description: t("blog.heroSubtitle"),
  };
}

function PostCard({ post, lang, badge }: { post: PostHead; lang: SiteLang; badge?: string }) {
  return (
    <article className="st-card" lang={post.lang}>
      <span className="st-badge">
        {badge || post.kicker || "Blog"}
        {/* Article non traduit dans la langue affichée : on indique sa langue */}
        {post.lang !== lang ? ` · ${post.lang.toUpperCase()}` : ""}
      </span>
      <h3 className="st-card-title">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      <p>{post.description}</p>
      <p className="st-muted">{post.dateLine}</p>
    </article>
  );
}

export default async function BlogPage() {
  const lang = await getSiteLang();
  const t = siteT(lang);
  const [featured, ...others] = listPosts(lang);

  return (
    <div className="st-page st-page-blog">
      <section className="st-hero">
        <div className="st-wrap">
          <p className="st-eyebrow">
            {t("blog.hub")} · {t("blog.heroTags")}
          </p>
          <h1 className="st-h1">
            {t("blog.heroTitle1")} {t("blog.heroTitle2")}
          </h1>
          <div className="st-hero-body">
            <p>{t("blog.heroSubtitle")}</p>
          </div>
        </div>
      </section>

      <section className="st-section">
        <div className="st-wrap">
          {featured ? (
            <div className="st-featured">
              <PostCard post={featured} lang={lang} badge={t("blog.featured")} />
            </div>
          ) : null}
          <header className="st-section-head">
            <h2 className="st-h2">{t("blog.latest")}</h2>
          </header>
          <div className="st-cards">
            {others.map((post) => (
              <PostCard key={post.slug} post={post} lang={lang} />
            ))}
          </div>
        </div>
      </section>

      <section className="st-section st-cta-band">
        <div className="st-wrap">
          <header className="st-section-head">
            <h2 className="st-h2">{t("blog.ctaTitle")}</h2>
            <p className="st-lead">{t("blog.ctaSubtitle")}</p>
          </header>
          <p className="st-actions">
            <Link href="/contact#form-section" className="st-btn">
              {t("cta.bookFreeDemo")}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
