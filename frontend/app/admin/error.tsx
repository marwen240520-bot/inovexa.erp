"use client";

import ErrorPanel from "@/components/ui/ErrorPanel";

// Affichée dans la zone de contenu : le menu reste visible et utilisable pour changer de page.
export default function SegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel error={error} reset={reset} />;
}
