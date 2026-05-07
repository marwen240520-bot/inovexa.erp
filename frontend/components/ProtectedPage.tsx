"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ProtectedPage({ module, children, requiredRole }) {
  const router = useRouter();
  const { loading, hasAccess } = useModuleAccess();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Checking access..." />;
  }

  // Vérifier le rôle
  if (requiredRole && user?.role !== requiredRole && user?.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  // Vérifier l'accès au module
  if (module && !hasAccess(module)) {
    router.push("/dashboard");
    return null;
  }

  return children;
}
