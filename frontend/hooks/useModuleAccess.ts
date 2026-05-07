import { useState, useEffect } from "react";

export function useModuleAccess() {
  const [modules, setModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModules = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:3001/client-modules/my-modules", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setModules(data);
        } else {
          // Default modules if API fails
          setModules({
            dashboard: true, products: true, categories: true, stock: true,
            sales: true, purchases: true, orders: true, clients: true,
            suppliers: true, invoices: true, hr: true, finance: true,
            logistics: true, production: true, ai: true, reports: true,
            analytics: true, profile: true, settings: true
          });
        }
      } catch(e) { 
        console.error(e);
        setError(e.message);
      }
      setLoading(false);
    };
    fetchModules();
  }, []);

  const hasAccess = (moduleName) => {
    return modules[moduleName] !== false;
  };

  const getEnabledModules = () => {
    return Object.entries(modules).filter(([key, value]) => value === true).map(([key]) => key);
  };

  return { modules, loading, error, hasAccess, getEnabledModules };
}
