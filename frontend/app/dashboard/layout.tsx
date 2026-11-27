"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Fragment, useState, useEffect } from "react";
import { useDeviceHint } from "@/contexts/DeviceContext";
import PageSkeleton, { AppShellProvider } from "@/components/ui/PageSkeleton";
import { initCompanyProfile, refreshCompanyProfile, useCompanyProfile } from "@/lib/company-profile";
import FloatingAssistant from "@/components/assistant/FloatingAssistant";
import AccountBar from "@/components/account/AccountBar";
import A11yAutoLabels from "@/components/ui/A11yAutoLabels";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Valeur initiale fournie par le serveur (User-Agent) : le contenu est placé au bon endroit
  // dès le HTML, il ne glisse plus de 280 px vers la droite après le chargement.
  const isMobileHint = useDeviceHint();
  const [isMobile, setIsMobile] = useState(isMobileHint);
  const [mounted, setMounted] = useState(false);
  // Profil de la société (pays, devise, taux de TVA, fonctions locales) : tout le contenu s'affiche avec SES montants.
  const profile = useCompanyProfile();
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    // La copie du navigateur s'applique tout de suite (jamais pendant l'hydratation : le serveur ne connaît que les valeurs
    // par défaut), puis la valeur du serveur la remplace si elle a changé.
    initCompanyProfile();
    setProfileReady(true);
    void refreshCompanyProfile();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    // Les transitions ne s'activent qu'après la première mesure (pas d'animation au chargement)
    const id = window.requestAnimationFrame(() => setMounted(true));
    window.addEventListener("resize", checkMobile);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const isAuthPage =
    pathname?.includes("/auth/login") || pathname?.includes("/auth/register");

  if (isAuthPage) return <>{children}</>;

  // Rail de 280px en desktop ; 0 en mobile (la Sidebar affiche alors sa barre du bas).
  const sidebarWidth = isMobile ? 0 : 280;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        position: "relative",
        background: "var(--theme-background)",
      }}
    >
      {/* Sidebar rendue UNE SEULE FOIS ici. Le layout persiste entre les pages,
          donc elle ne se remonte plus a chaque navigation (fini le reload mobile).
          Le composant se positionne lui-meme : rail fixe en desktop, barre du bas en mobile. */}
      <Sidebar />
      {/* Titre de l'onglet propre à chaque écran ; noms accessibles des champs, colonnes d'action et graphiques. */}
      <A11yAutoLabels />

      {/* Contenu principal */}
      <main
        id="contenu"
        style={{
          flex: 1,
          marginInlineStart: sidebarWidth,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: mounted ? "margin 0.3s ease, width 0.3s ease" : "none",
          minHeight: "100vh",
          position: "relative",
          minWidth: 0,
        }}
      >
        {/* État du compte : temps d'essai restant, abonnement bientôt échu. Rien n'est affiché quand tout est en ordre. */}
        <AccountBar />
        {/* Le contenu attend le profil de la société ; si sa devise change (Paramètres › Société), il se reconstruit avec la nouvelle. */}
        <AppShellProvider>{profileReady ? <Fragment key={`${profile.currency}:${profile.countryCode}`}>{children}</Fragment> : <PageSkeleton />}</AppShellProvider>
      </main>

      {/* Bouton « Chat IA » sur toutes les pages (masquable dans Paramètres › Préférences) */}
      <FloatingAssistant />

      <style dangerouslySetInnerHTML={{
        __html: `
          * { box-sizing: border-box; }

          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: var(--theme-surface-hover); }
          ::-webkit-scrollbar-thumb { background: #667eea; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: #764ba2; }
        `,
      }} />
    </div>
  );
}
