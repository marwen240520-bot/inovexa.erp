"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useDeviceHint } from "@/contexts/DeviceContext";
import PageSkeleton, { AppShellProvider } from "@/components/ui/PageSkeleton";
import { ErrorBox } from "@/components/erp/kit";
import A11yAutoLabels from "@/components/ui/A11yAutoLabels";
import { API_URL } from "@/lib/saas";
import { clearSession, getStoredUser, getToken, homeFor, isPlatformAdmin, saveSession, type SessionUser } from "@/lib/session";

/**
 * Espace de l'administrateur de la plateforme : même ossature que le tableau de bord de l'ERP
 * (barre latérale rendue une seule fois + contenu), sans l'assistant IA flottant.
 *
 * Garde d'accès : le profil gardé dans le navigateur ne sert qu'à écarter tout de suite les visiteurs
 * qui n'ont rien à faire ici. C'est GET /auth/me qui fait foi : les pages ne sont rendues qu'une fois le rôle
 * confirmé par le serveur. Chaque route /admin/* de l'API revérifie de toute façon le rôle (403 sinon).
 */
type Phase = "checking" | "allowed" | "leaving" | "error";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Valeur initiale fournie par le serveur (User-Agent) : pas de glissement de 280 px au chargement.
  const isMobileHint = useDeviceHint();
  const [isMobile, setIsMobile] = useState(isMobileHint);
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    // Les transitions ne s'activent qu'après la première mesure (pas d'animation au chargement).
    const id = window.requestAnimationFrame(() => setMounted(true));
    window.addEventListener("resize", checkMobile);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const leave = (to: string) => {
      if (cancelled) return;
      setPhase("leaving");
      router.replace(to);
    };

    const token = getToken();
    if (!token) { leave("/auth/login"); return; }
    const stored = getStoredUser();
    if (!isPlatformAdmin(stored?.role)) { leave(homeFor(stored)); return; }

    setPhase("checking");
    (async () => {
      let res: Response;
      try {
        // « no-store » : la réponse ne vient jamais du cache court des lectures (lib/apiCache.ts), c'est le serveur qui répond.
        res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      } catch {
        if (!cancelled) setPhase("error");
        return;
      }
      if (cancelled) return;
      if (res.status === 401) {
        // Session fermée ou expirée : on la retire pour que la page de connexion ne renvoie pas ici.
        clearSession();
        leave("/auth/login");
        return;
      }
      if (res.status === 403) { leave("/dashboard"); return; }
      if (!res.ok) { setPhase("error"); return; }

      const me = (await res.json().catch(() => null)) as (SessionUser & { account?: { blocked?: boolean } | null }) | null;
      if (cancelled) return;
      if (!me) { setPhase("error"); return; }
      if (!isPlatformAdmin(me.role) || me.isTeamMember) {
        // Le profil gardé dans le navigateur disait « administrateur », le serveur dit autre chose : on le remplace par le vrai.
        const user: SessionUser = {
          id: me.id, email: me.email, name: me.name, role: me.role, companyName: me.companyName, modules: me.modules,
          isTeamMember: me.isTeamMember, sector: me.sector, twoFactorEnabled: me.twoFactorEnabled, permissions: me.permissions,
        };
        saveSession({ access_token: token, user });
        leave(homeFor(user, me.account));
        return;
      }
      setPhase("allowed");
    })();

    return () => { cancelled = true; };
  }, [router, attempt]);

  // Rail de 280 px sur ordinateur ; 0 sur téléphone (la barre latérale affiche alors sa barre du bas).
  const sidebarWidth = isMobile ? 0 : 280;

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative", background: "var(--theme-background)" }}>
      {/* Rendue une seule fois ici : elle ne se remonte pas à chaque changement de page de l'espace administrateur. */}
      {phase !== "leaving" && <Sidebar />}
      <A11yAutoLabels />

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
        <AppShellProvider>
          {phase === "allowed" ? (
            <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
          ) : phase === "error" ? (
            <div style={{ padding: "clamp(14px, 3vw, 28px)", maxWidth: 760, margin: "0 auto" }}>
              <ErrorBox message="Impossible de vérifier votre accès : le serveur ne répond pas." onRetry={() => setAttempt((n) => n + 1)} />
            </div>
          ) : (
            <PageSkeleton />
          )}
        </AppShellProvider>
      </main>

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
