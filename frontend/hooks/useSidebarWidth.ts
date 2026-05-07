// hooks/useSidebarWidth.ts
import { useEffect, useState } from "react";

const SIDEBAR_KEY = "sidebar_open";
export const SIDEBAR_OPEN_WIDTH = 280;
export const SIDEBAR_CLOSED_WIDTH = 72;

export function useSidebarWidth(): number {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved !== null) return saved === "true";
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    // Écoute le CustomEvent dispatché par Sidebar.tsx au moment du clic —
    // zéro délai, la page démarre sa transition en même temps que le sidebar.
    const handleToggle = (e: CustomEvent<{ open: boolean }>) => {
      setSidebarOpen(e.detail.open);
    };

    // Fallback pour les autres onglets (StorageEvent standard)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SIDEBAR_KEY && e.newValue !== null) {
        setSidebarOpen(e.newValue === "true");
      }
    };

    window.addEventListener("sidebarToggle", handleToggle as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("sidebarToggle", handleToggle as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return sidebarOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_CLOSED_WIDTH;
}
