import Spinner from "@/components/ui/Spinner";

// Loader de route global (App Router) — utilise le spinner unique de l'app.
export default function Loading() {
  return <Spinner fullScreen />;
}
