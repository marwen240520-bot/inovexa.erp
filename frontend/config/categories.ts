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

// Type any[] volontaire : le composant lit des proprietes optionnelles
// sans garde, ce qui ferait echouer le mode strict de TypeScript.
export const categoriesConfig: any[] = [
  { id: "electronique", name: "Electronique", label: "Electronique", description: "Produits electroniques et high-tech", icon: "Cpu", color: "#3b82f6", subcategories: [
      { id: "electronique-composants", name: "Composants", label: "Composants", description: "" },
      { id: "electronique-peripheriques", name: "Peripheriques", label: "Peripheriques", description: "" },
      { id: "electronique-accessoires", name: "Accessoires", label: "Accessoires", description: "" } ] },
  { id: "alimentaire", name: "Alimentaire", label: "Alimentaire", description: "Produits alimentaires et boissons", icon: "Apple", color: "#22c55e", subcategories: [
      { id: "alimentaire-frais", name: "Produits frais", label: "Produits frais", description: "" },
      { id: "alimentaire-sec", name: "Produits secs", label: "Produits secs", description: "" },
      { id: "alimentaire-boissons", name: "Boissons", label: "Boissons", description: "" } ] },
  { id: "cosmetique", name: "Cosmetique", label: "Cosmetique", description: "Cosmetiques, parfums et huiles essentielles", icon: "Sparkles", color: "#ec4899", subcategories: [
      { id: "cosmetique-soin", name: "Soin", label: "Soin", description: "" },
      { id: "cosmetique-parfum", name: "Parfums & eaux florales", label: "Parfums & eaux florales", description: "" },
      { id: "cosmetique-huiles", name: "Huiles essentielles", label: "Huiles essentielles", description: "" } ] },
  { id: "textile", name: "Textile", label: "Textile", description: "Vetements et accessoires textiles", icon: "Shirt", color: "#f59e0b", subcategories: [
      { id: "textile-vetements", name: "Vetements", label: "Vetements", description: "" },
      { id: "textile-accessoires", name: "Accessoires", label: "Accessoires", description: "" } ] },
  { id: "mobilier", name: "Mobilier", label: "Mobilier", description: "Mobilier interieur et exterieur", icon: "Armchair", color: "#8b5cf6", subcategories: [
      { id: "mobilier-interieur", name: "Interieur", label: "Interieur", description: "" },
      { id: "mobilier-exterieur", name: "Exterieur", label: "Exterieur", description: "" } ] },
  { id: "services", name: "Services", label: "Services", description: "Prestations de services", icon: "Briefcase", color: "#06b6d4", subcategories: [
      { id: "services-conseil", name: "Conseil", label: "Conseil", description: "" },
      { id: "services-maintenance", name: "Maintenance", label: "Maintenance", description: "" } ] },
  { id: "autre", name: "Autre", label: "Autre", description: "Autres categories", icon: "Package", color: "#6b7280", subcategories: [] },
];

export default categoriesConfig;