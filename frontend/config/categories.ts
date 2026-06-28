// config/categories.ts
export interface CategoryConfigItem {
  id: string | number;
  name: string;
  label?: string;
  icon?: string;
  color?: string;
  description?: string;
  subcategories?: CategoryConfigItem[];
  [key: string]: any;
}

export const categoriesConfig: CategoryConfigItem[] = [
  { id: "electronique", name: "Electronique", label: "Electronique", icon: "Cpu", color: "#3b82f6", subcategories: [
      { id: "electronique-composants", name: "Composants", label: "Composants" },
      { id: "electronique-peripheriques", name: "Peripheriques", label: "Peripheriques" },
      { id: "electronique-accessoires", name: "Accessoires", label: "Accessoires" } ] },
  { id: "alimentaire", name: "Alimentaire", label: "Alimentaire", icon: "Apple", color: "#22c55e", subcategories: [
      { id: "alimentaire-frais", name: "Produits frais", label: "Produits frais" },
      { id: "alimentaire-sec", name: "Produits secs", label: "Produits secs" },
      { id: "alimentaire-boissons", name: "Boissons", label: "Boissons" } ] },
  { id: "cosmetique", name: "Cosmetique", label: "Cosmetique", icon: "Sparkles", color: "#ec4899", subcategories: [
      { id: "cosmetique-soin", name: "Soin", label: "Soin" },
      { id: "cosmetique-parfum", name: "Parfums & eaux florales", label: "Parfums & eaux florales" },
      { id: "cosmetique-huiles", name: "Huiles essentielles", label: "Huiles essentielles" } ] },
  { id: "textile", name: "Textile", label: "Textile", icon: "Shirt", color: "#f59e0b", subcategories: [
      { id: "textile-vetements", name: "Vetements", label: "Vetements" },
      { id: "textile-accessoires", name: "Accessoires", label: "Accessoires" } ] },
  { id: "mobilier", name: "Mobilier", label: "Mobilier", icon: "Armchair", color: "#8b5cf6", subcategories: [
      { id: "mobilier-interieur", name: "Interieur", label: "Interieur" },
      { id: "mobilier-exterieur", name: "Exterieur", label: "Exterieur" } ] },
  { id: "services", name: "Services", label: "Services", icon: "Briefcase", color: "#06b6d4", subcategories: [
      { id: "services-conseil", name: "Conseil", label: "Conseil" },
      { id: "services-maintenance", name: "Maintenance", label: "Maintenance" } ] },
  { id: "autre", name: "Autre", label: "Autre", icon: "Package", color: "#6b7280", subcategories: [] },
];

export default categoriesConfig;