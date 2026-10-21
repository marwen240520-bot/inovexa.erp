// components/charts/LazyCharts.tsx
"use client";
import dynamic from "next/dynamic";
import React from "react";

// Chart.js (~70 Ko compressés) n'est plus dans le JavaScript initial des pages :
// le texte, les indicateurs et les tableaux s'affichent d'abord, et la librairie de graphiques
// est téléchargée en parallèle (dès que la page est ouverte), puis enregistrée une seule fois.
// Les pages importent Line / Bar / Doughnut / Pie / Radar d'ici exactement comme de "react-chartjs-2".

type ReactChartJs = typeof import("react-chartjs-2");

let loading: Promise<ReactChartJs> | null = null;

/** Charge chart.js + react-chartjs-2 et enregistre les éléments utilisés par l'application. */
export function loadCharts(): Promise<ReactChartJs> {
  if (!loading) {
    loading = Promise.all([import("chart.js"), import("react-chartjs-2")]).then(([chartjs, rc]) => {
      const {
        Chart, CategoryScale, LinearScale, RadialLinearScale, BarElement, ArcElement,
        PointElement, LineElement, Filler, Title, Tooltip, Legend,
      } = chartjs;
      Chart.register(
        CategoryScale, LinearScale, RadialLinearScale, BarElement, ArcElement,
        PointElement, LineElement, Filler, Title, Tooltip, Legend
      );
      return rc;
    });
    loading.catch(() => { loading = null; }); // nouvel essai possible après une erreur réseau
  }
  return loading;
}

// Démarre le téléchargement dès que la page qui affiche des graphiques est ouverte,
// en parallèle des appels API (et non après).
if (typeof window !== "undefined") {
  void loadCharts().catch(() => {});
}

function ChartPlaceholder() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        minHeight: 160,
        borderRadius: 12,
        background:
          "linear-gradient(90deg, var(--theme-surface-hover, #f3f4f6) 0%, var(--theme-border, #e5e7eb) 50%, var(--theme-surface-hover, #f3f4f6) 100%)",
        backgroundSize: "200% 100%",
        animation: "ix-chart-wait 1.4s ease-in-out infinite",
        opacity: 0.6,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ix-chart-wait { from { background-position: 100% 0; } to { background-position: -100% 0; } }
        @media (prefers-reduced-motion: reduce) { [aria-hidden="true"][style*="ix-chart-wait"] { animation: none !important; } }
      ` }} />
    </div>
  );
}

// (next/dynamic exige un objet d'options écrit directement dans chaque appel)
export const Line = dynamic(() => loadCharts().then((m) => m.Line), { ssr: false, loading: ChartPlaceholder }) as unknown as ReactChartJs["Line"];
export const Bar = dynamic(() => loadCharts().then((m) => m.Bar), { ssr: false, loading: ChartPlaceholder }) as unknown as ReactChartJs["Bar"];
export const Doughnut = dynamic(() => loadCharts().then((m) => m.Doughnut), { ssr: false, loading: ChartPlaceholder }) as unknown as ReactChartJs["Doughnut"];
export const Pie = dynamic(() => loadCharts().then((m) => m.Pie), { ssr: false, loading: ChartPlaceholder }) as unknown as ReactChartJs["Pie"];
export const Radar = dynamic(() => loadCharts().then((m) => m.Radar), { ssr: false, loading: ChartPlaceholder }) as unknown as ReactChartJs["Radar"];
