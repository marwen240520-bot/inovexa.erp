"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la gestion des clients
    router.push("/admin/clients");
  }, [router]);

  return <Spinner fullScreen />;
}
