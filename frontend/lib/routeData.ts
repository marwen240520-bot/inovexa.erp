// lib/routeData.ts
// Préchargement des données d'une page AVANT qu'elle soit affichée.
//
// • Au chargement initial (F5, lien direct) : les requêtes partent dès que le JavaScript est lu,
//   sans attendre que React ait fini de construire la page (gain : le temps d'hydratation).
// • Au survol d'un lien de la barre latérale : les listes de la page visée sont demandées pendant
//   que la souris s'approche du clic.
// Les pages n'ont rien à changer : elles font leurs fetch habituels, et lib/apiCache.ts leur
// renvoie la réponse déjà reçue (ou en cours de réception) au lieu de refaire la requête.
// ⚠️ L'URL doit être EXACTEMENT celle utilisée par la page : `${NEXT_PUBLIC_API_URL}/chemin`.

const ROUTE_ENDPOINTS: Record<string, string[]> = {
  "/dashboard": ["/users/profile", "/sales", "/purchases", "/clients", "/products", "/invoices", "/orders", "/employees"],
  "/dashboard/products": ["/categories", "/products"],
  "/dashboard/categories": ["/categories", "/products"],
  "/dashboard/stock": ["/products", "/sales", "/purchases"],
  "/dashboard/sales": ["/sales", "/products", "/clients"],
  "/dashboard/purchases": ["/purchases", "/products", "/suppliers"],
  "/dashboard/orders": ["/orders", "/clients", "/products"],
  "/dashboard/clients": ["/clients"],
  "/dashboard/suppliers": ["/suppliers"],
  "/dashboard/invoices": ["/invoices", "/clients", "/suppliers"],
  "/dashboard/hr": ["/employees", "/departments"],
  "/dashboard/pos": ["/products", "/pos/today"],
  "/dashboard/objectives": ["/objectives"],
  "/dashboard/analytics": ["/sales", "/products", "/clients", "/orders", "/invoices", "/employees", "/logistics/shipments"],
  "/dashboard/finance": ["/sales", "/purchases", "/invoices", "/products", "/clients", "/suppliers", "/employees", "/projects"],
  "/dashboard/logistics": ["/logistics/client/shipments", "/transporteurs"],
  "/dashboard/profile": ["/users/profile", "/sales", "/orders", "/clients"],
};

function readAuth(): { token: string | null; userId: string | null } {
  try {
    const token = localStorage.getItem("token");
    let userId: string | null = null;
    const raw = localStorage.getItem("user");
    if (raw) userId = String(JSON.parse(raw)?.id ?? "") || null;
    return { token, userId };
  } catch {
    return { token: null, userId: null };
  }
}

/** Lance (sans attendre) les lectures dont la page `path` aura besoin. */
export function prefetchRouteData(path: string, opts: { includeModules?: boolean } = {}) {
  if (typeof window === "undefined") return;
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return;
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const endpoints = ROUTE_ENDPOINTS[clean];
  const { token, userId } = readAuth();
  if (!token) return;
  const headers = { Authorization: `Bearer ${token}` };
  const list = [...(endpoints || [])];
  // Modules de l'utilisateur (barre latérale), demandés une fois au chargement initial
  if (opts.includeModules && userId && clean.startsWith("/dashboard")) list.push(`/users/${userId}/modules`);
  for (const ep of list) {
    fetch(`${base}${ep}`, { headers }).catch(() => { /* la page refera la requête et gérera l'erreur */ });
  }
}
