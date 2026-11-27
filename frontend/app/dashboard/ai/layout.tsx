import type { ReactNode } from "react";
import AiApp from "./AiApp";

// Le layout garde l'assistant IA en place pendant qu'on passe d'un onglet à l'autre
// (/dashboard/ai, /chat, /forecasts, /recommendations, /analytics) : la conversation et les données ne sont pas perdues.
export default function AiLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AiApp />
      {children}
    </>
  );
}
