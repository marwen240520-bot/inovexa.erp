// components/ui/PageSkeleton.tsx
"use client";
import React, { createContext, useContext } from "react";

/**
 * Indique qu'on est à l'intérieur de l'interface de l'application (barre latérale visible).
 * Dans ce cas, les écrans de chargement de page affichent un squelette du contenu
 * au lieu du logo plein écran : la mise en page reste stable et le chargement paraît plus court.
 */
const AppShellContext = createContext(false);

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  return <AppShellContext.Provider value={true}>{children}</AppShellContext.Provider>;
}

export function useInAppShell(): boolean {
  return useContext(AppShellContext);
}

const CSS = `
.ix-skel { padding: clamp(16px, 2.4vw, 28px); padding-bottom: calc(clamp(16px, 2.4vw, 28px) + env(safe-area-inset-bottom, 0px)); min-height: 100vh; box-sizing: border-box; }
.ix-skel * { box-sizing: border-box; }
.ix-skel__bone { position: relative; overflow: hidden; border-radius: 10px; background: var(--theme-border, #e5e7eb); opacity: 0.8; }
.ix-skel__bone::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent 0%, rgba(var(--theme-primary-rgb, 79, 70, 229), 0.07) 45%, rgba(255,255,255,0.10) 50%, rgba(var(--theme-primary-rgb, 79, 70, 229), 0.07) 55%, transparent 100%);
  animation: ix-skel-shimmer 1.35s ease-in-out infinite; }
.ix-skel__card { background: var(--theme-surface, #fff); border: 1px solid var(--theme-border, #e5e7eb); border-radius: 16px; }
.ix-skel__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.ix-skel__kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.ix-skel__kpi { padding: 18px; height: 112px; display: flex; flex-direction: column; justify-content: space-between; }
.ix-skel__table { padding: 18px; }
.ix-skel__row { display: grid; grid-template-columns: 36px 2.2fr 1fr 1fr 0.8fr; gap: 16px; align-items: center; padding: 14px 0; border-top: 1px solid var(--theme-border, #e5e7eb); }
.ix-skel__row:first-child { border-top: none; }
.ix-skel__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 767px) {
  .ix-skel { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
  .ix-skel__row { grid-template-columns: 28px 2fr 1fr; }
  .ix-skel__row > :nth-child(n+4) { display: none; }
  .ix-skel__actions { display: none !important; }
}
@keyframes ix-skel-shimmer { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) {
  .ix-skel__bone::after { animation: none; }
  .ix-skel__bone { animation: ix-skel-pulse 1.6s ease-in-out infinite; }
}
@keyframes ix-skel-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
`;

function Bone({ w = "100%", h = 12, r, style }: { w?: number | string; h?: number | string; r?: number; style?: React.CSSProperties }) {
  return <div className="ix-skel__bone" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/** Squelette générique d'une page de l'ERP : en-tête, indicateurs, tableau. */
export default function PageSkeleton({ rows = 6, kpis = 4 }: { rows?: number; kpis?: number }) {
  return (
    <div className="ix-skel" data-skeleton aria-busy="true" aria-live="polite">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <span className="ix-skel__sr">Chargement…</span>

      <div className="ix-skel__head">
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <Bone w="min(280px, 70%)" h={28} r={8} />
          <Bone w="min(200px, 50%)" h={12} style={{ marginTop: 12 }} />
        </div>
        <div className="ix-skel__actions" style={{ display: "flex", gap: 10 }}>
          <Bone w={96} h={40} r={12} />
          <Bone w={120} h={40} r={12} />
        </div>
      </div>

      <div className="ix-skel__kpis">
        {Array.from({ length: kpis }).map((_, i) => (
          <div key={i} className="ix-skel__card ix-skel__kpi">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Bone w="45%" h={10} />
              <Bone w={26} h={26} r={8} />
            </div>
            <Bone w="62%" h={26} r={8} />
            <Bone w="38%" h={9} />
          </div>
        ))}
      </div>

      <div className="ix-skel__card ix-skel__table">
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <Bone w="100%" h={38} r={10} />
          <Bone w={160} h={38} r={10} />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="ix-skel__row">
            <Bone w={28} h={28} r={8} />
            <Bone w={`${78 - (i % 3) * 12}%`} h={12} />
            <Bone w="70%" h={12} />
            <Bone w="55%" h={12} />
            <Bone w="80%" h={22} r={999} />
          </div>
        ))}
      </div>
    </div>
  );
}
