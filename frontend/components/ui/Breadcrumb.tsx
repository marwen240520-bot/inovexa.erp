"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(p => p);

  const getLabel = (path) => {
    const labels = {
      "dashboard": "Dashboard",
      "products": "Products",
      "sales": "Sales",
      "purchases": "Purchases",
      "orders": "Orders",
      "clients": "Clients",
      "suppliers": "Suppliers",
      "invoices": "Invoices",
      "hr": "Human Resources",
      "finance": "Finance",
      "logistics": "Logistics",
      "production": "Production",
      "ai": "AI Assistant",
      "reports": "Reports",
      "analytics": "Analytics",
      "profile": "My Profile",
      "settings": "Settings"
    };
    return labels[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  if (paths.length === 0) return null;

  return (
    <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <Link href="/dashboard" style={{ color: "#667eea", textDecoration: "none", fontSize: "14px" }}>
        Home
      </Link>
      {paths.map((path, index) => {
        const href = "/" + paths.slice(0, index + 1).join("/");
        const isLast = index === paths.length - 1;
        return (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#94a3b8" }}>/</span>
            {isLast ? (
              <span style={{ color: "white", fontSize: "14px", fontWeight: "500" }}>{getLabel(path)}</span>
            ) : (
              <Link href={href} style={{ color: "#667eea", textDecoration: "none", fontSize: "14px" }}>
                {getLabel(path)}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
