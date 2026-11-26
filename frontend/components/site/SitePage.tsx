// components/site/SitePage.tsx
// Rendu d'une page publique à partir de son fichier de contenu (content/site/pages). Composant serveur.
import type { Metadata } from "next";
import { Blocks } from "@/components/site/SiteBlocks";
import ContactForm from "@/components/site/ContactForm";
import { getSiteLang, loadPage, plainText, siteT, type PageName, type SiteLang } from "@/lib/site/content";

const CONTACT_LABEL_KEYS = [
  "formTitle", "labelFirstName", "labelLastName", "labelCompany", "labelEmail", "labelPhone", "labelSize",
  "labelSelectSize", "labelMessage", "placeholderFirstName", "placeholderLastName", "placeholderEmail",
  "placeholderCompany", "placeholderPhone", "placeholderMessage", "submit", "size1", "size2", "size3", "size4",
  "size5", "privacyA", "privacyB", "errRequired", "errEmail",
];

/** Les textes juridiques n'existent qu'en anglais sur le site : on le signale dans les autres langues. */
const LEGAL_NOTE: Partial<Record<SiteLang, string>> = {
  fr: "Ce texte juridique n'est disponible qu'en anglais.",
  es: "Este texto legal solo está disponible en inglés.",
};

export async function sitePageMetadata(name: PageName): Promise<Metadata> {
  const lang = await getSiteLang();
  const data = await loadPage(name, lang);
  const hero = data.blocks.find((block) => block.t === "hero");
  const heroTitle = plainText(hero?.title);
  const heroLead = plainText(hero?.blocks?.find((block: any) => block.t === "p")?.c);
  // Les pages qui portent leurs propres titre et description dans chaque langue (« localized ») les utilisent tels quels ;
  // les autres n'ont ces champs qu'en anglais : dans les autres langues, ils sont tirés du premier bloc.
  const own = lang === "en" || (data as { localized?: boolean }).localized === true;
  return {
    title: own && data.title ? data.title : `${heroTitle} | Inovexa ERP`,
    description: own && data.description ? data.description : heroLead || data.description,
  };
}

function ContactSection({ lang }: { lang: SiteLang }) {
  const t = siteT(lang);
  const labels: Record<string, string> = { privacyPolicy: t("footer.privacyPolicy") };
  for (const key of CONTACT_LABEL_KEYS) labels[key] = t("contact." + key);

  return (
    <div className="st-contact">
      <ContactForm lang={lang} labels={labels} />
      <aside className="st-contact-side">
        <div className="st-card">
          <h3 className="st-card-title">{t("contact.sidebarResponseTitle")}</h3>
          <p>{t("contact.sidebarResponseDesc")}</p>
        </div>
        <div className="st-card">
          <h3 className="st-card-title">{t("contact.officeTitle")}</h3>
          <dl className="st-pairs">
            <div>
              <dt>{t("contact.officeEmail")}</dt>
              <dd>
                <a href="mailto:contact@inovexa-erp.com">contact@inovexa-erp.com</a>
              </dd>
            </div>
            <div>
              <dt>{t("contact.officePhone")}</dt>
              <dd>
                <a href="tel:+21622535181">+216 22 535 181</a>
              </dd>
            </div>
            <div>
              <dt>{t("contact.officeWhatsapp")}</dt>
              <dd>
                <a href="https://wa.me/21626583168" target="_blank" rel="noopener noreferrer">
                  +216 26 583 168
                </a>
              </dd>
            </div>
          </dl>
        </div>
        <div className="st-card">
          <h3 className="st-card-title">{t("contact.hoursTitle")}</h3>
          <dl className="st-pairs">
            <div>
              <dt>{t("contact.weekdays")}</dt>
              <dd>{t("contact.weekdaysTime")}</dd>
            </div>
            <div>
              <dt>{t("contact.saturday")}</dt>
              <dd>{t("contact.saturdayTime")}</dd>
            </div>
            <div>
              <dt>{t("contact.sunday")}</dt>
              <dd>{t("contact.sundayTime")}</dd>
            </div>
          </dl>
          <p className="st-muted">{t("contact.afterHoursNote")}</p>
        </div>
      </aside>
    </div>
  );
}

export async function SitePage({ name }: { name: PageName }) {
  const lang = await getSiteLang();
  const data = await loadPage(name, lang);
  const legalNote = name === "privacy" || name === "terms" ? LEGAL_NOTE[lang] : undefined;
  return (
    <div className={"st-page st-page-" + name}>
      <Blocks blocks={data.blocks} extras={name === "contact" ? { lang, contact: <ContactSection lang={lang} /> } : { lang }} />
      {legalNote ? (
        <p className="st-wrap st-muted st-legal-note" lang={lang}>
          {legalNote}
        </p>
      ) : null}
    </div>
  );
}
