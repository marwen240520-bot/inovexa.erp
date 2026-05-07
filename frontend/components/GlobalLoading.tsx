"use client";
import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GlobalLoading() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: "3px",
        background: "linear-gradient(90deg, #667eea, #764ba2, #667eea)",
        animation: "loading 1s infinite",
      }}
    />
  );
}
