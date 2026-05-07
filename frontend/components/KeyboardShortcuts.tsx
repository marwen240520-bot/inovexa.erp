"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        router.push("/dashboard");
      } else if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        router.push("/dashboard/products");
      } else if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        router.push("/dashboard/sales");
      } else if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        router.push("/dashboard/orders");
      } else if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        router.push("/dashboard/clients");
      } else if (e.ctrlKey && e.key === "i") {
        e.preventDefault();
        router.push("/dashboard/invoices");
      } else if (e.ctrlKey && e.key === "r") {
        e.preventDefault();
        router.push("/dashboard/reports");
      } else if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        router.push("/admin/clients");
      } else if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        router.push("/dashboard/profile");
      } else if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        router.push("/dashboard/settings");
      } else if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        alert(
          "Raccourcis clavier:\n\nCtrl+D - Dashboard\nCtrl+P - Produits\nCtrl+S - Ventes\nCtrl+O - Commandes\nCtrl+C - Clients\nCtrl+I - Factures\nCtrl+R - Rapports\nCtrl+Shift+A - Admin\nCtrl+Shift+P - Profil\nCtrl+Shift+S - Paramètres"
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
