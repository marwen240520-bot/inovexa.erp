/**
 * Contenu de départ de la plateforme : formules, secteurs, catalogue de suggestions, prestations.
 *
 * ⚠️  TOUS LES MONTANTS SONT DES PROPOSITIONS À VALIDER PAR L'ADMINISTRATEUR.
 *  - Formules et prestations : créées en BROUILLON (isPublic = false). Rien n'apparaît sur le site tant que
 *    l'administrateur n'a pas relu les prix et publié.
 *  - Catalogue par secteur : exemples chiffrés pour montrer le calcul « coût d'achat + marge = prix de vente ».
 *    Ce ne sont PAS des prix de marché et aucune étude de marché n'est derrière : chaque ligne porte sa base de
 *    calcul (`basis`), et chaque société remplace ces valeurs par les siennes.
 *  - La TVA n'est pas renseignée par article : c'est le taux par défaut de la société qui s'applique (modifiable).
 *
 * Ce contenu n'est inséré qu'une fois (platform_settings.defaultsSeeded) ; ensuite tout se gère depuis l'administration.
 */

const BASE = ['products', 'categories', 'clients', 'invoices', 'finance', 'reports', 'analytics', 'ai'];

export interface DefaultItem { name: string; unit?: string; cost?: number; margin?: number; price?: number; kind?: 'product' | 'service'; lots?: boolean; description?: string }
export interface DefaultCategory { name: string; description?: string; items: DefaultItem[]; children?: DefaultCategory[] }
export interface DefaultSector {
  code: string; name: string; nameEn: string; nameAr: string; description: string;
  modules: string[]; recommendations: string[]; categories: DefaultCategory[];
}

export const DEFAULT_SECTORS: DefaultSector[] = [
  {
    code: 'commerce', name: 'Commerce et détail', nameEn: 'Commerce and retail', nameAr: 'التجارة والبيع بالتفصيل',
    description: 'Boutiques, magasins et points de vente : caisse, stock et réassort.',
    modules: [...BASE, 'stock', 'sales', 'pos', 'purchases', 'orders', 'suppliers', 'objectives'],
    recommendations: [
      'Créez vos catégories avant vos produits : les rapports de marge se lisent par catégorie.',
      'Renseignez un seuil d’alerte par produit pour être prévenu avant la rupture.',
      'Ouvrez une session de caisse chaque jour : l’écart de caisse se calcule à la clôture.',
    ],
    categories: [
      { name: 'Habillement', items: [
        { name: 'T-shirt coton', cost: 12, margin: 80 }, { name: 'Jean', cost: 35, margin: 70 }, { name: 'Veste', cost: 60, margin: 65 },
      ] },
      { name: 'Électronique', items: [
        { name: 'Écouteurs sans fil', cost: 45, margin: 35 }, { name: 'Chargeur rapide', cost: 14, margin: 50 }, { name: 'Coque de téléphone', cost: 4, margin: 150 },
      ] },
      { name: 'Maison', items: [
        { name: 'Service de verres (6 pièces)', unit: 'lot', cost: 9, margin: 60 }, { name: 'Poêle antiadhésive', cost: 22, margin: 55 },
      ] },
      { name: 'Accessoires', items: [
        { name: 'Ceinture', cost: 10, margin: 100 }, { name: 'Sac à main', cost: 40, margin: 90 }, { name: 'Lunettes de soleil', cost: 15, margin: 120 },
      ] },
    ],
  },
  {
    code: 'wholesale', name: 'Gros et distribution', nameEn: 'Wholesale and distribution', nameAr: 'تجارة الجملة والتوزيع',
    description: 'Grossistes et distributeurs : volumes, dépôts, tournées de livraison.',
    modules: [...BASE, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'objectives'],
    recommendations: [
      'Créez un dépôt par site de stockage : les transferts entre dépôts sont tracés.',
      'Utilisez les listes de prix (Clients › Listes de prix) pour vos tarifs revendeurs.',
      'Le bon de livraison décrémente le stock ; la facture se crée ensuite en un clic.',
    ],
    categories: [
      { name: 'Alimentaire sec', items: [
        { name: 'Carton d’eau minérale (6 × 1,5 l)', unit: 'carton', cost: 3.6, margin: 12 }, { name: 'Sac de sucre 50 kg', unit: 'sac', cost: 70, margin: 8 },
        { name: 'Carton de pâtes (20 × 500 g)', unit: 'carton', cost: 16, margin: 10 },
      ] },
      { name: 'Hygiène et entretien', items: [
        { name: 'Carton de détergent (12 × 1 l)', unit: 'carton', cost: 30, margin: 15 }, { name: 'Palette de papier hygiénique', unit: 'palette', cost: 420, margin: 10 },
      ] },
      { name: 'Prestations', items: [
        { name: 'Livraison régionale', unit: 'course', price: 25, kind: 'service' }, { name: 'Préparation de commande', unit: 'commande', price: 5, kind: 'service' },
      ] },
    ],
  },
  {
    code: 'healthcare', name: 'Santé et pharmacies', nameEn: 'Healthcare and pharmacies', nameAr: 'الصحة والصيدليات',
    description: 'Pharmacies, parapharmacies, cabinets et fournisseurs médicaux : lots et dates de péremption.',
    modules: [...BASE, 'stock', 'sales', 'pos', 'purchases', 'suppliers', 'hr'],
    recommendations: [
      'Activez le suivi par lot sur les produits périssables : les sorties se font au premier périmé (FEFO).',
      'Les alertes signalent les lots qui périment dans les 30 jours.',
      'Les prix des médicaments sont réglementés : saisissez les prix officiels en vigueur, pas des estimations.',
    ],
    categories: [
      { name: 'Consommables médicaux', items: [
        { name: 'Boîte de gants d’examen (100)', unit: 'boîte', cost: 9, margin: 30, lots: true }, { name: 'Masques chirurgicaux (50)', unit: 'boîte', cost: 5, margin: 40, lots: true },
        { name: 'Seringues 5 ml (100)', unit: 'boîte', cost: 12, margin: 25, lots: true },
      ] },
      { name: 'Parapharmacie', items: [
        { name: 'Crème hydratante', cost: 14, margin: 35, lots: true }, { name: 'Écran solaire SPF 50', cost: 22, margin: 35, lots: true },
      ] },
      { name: 'Équipement', items: [
        { name: 'Tensiomètre électronique', cost: 70, margin: 30 }, { name: 'Thermomètre infrarouge', cost: 35, margin: 35 },
      ] },
    ],
  },
  {
    code: 'construction', name: 'Construction et BTP', nameEn: 'Construction', nameAr: 'البناء والأشغال العامة',
    description: 'Entreprises de bâtiment et négoce de matériaux : devis, matériaux, main-d’œuvre.',
    modules: [...BASE, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'objectives'],
    recommendations: [
      'Créez la main-d’œuvre et les locations comme des prestations (non stockées) : elles s’ajoutent aux devis.',
      'Un devis accepté se transforme en bon de livraison puis en facture, sans ressaisie.',
      'Les prix des matériaux varient souvent : mettez à jour vos coûts à chaque achat (le coût moyen se recalcule seul).',
    ],
    categories: [
      { name: 'Gros œuvre', items: [
        { name: 'Sac de ciment 50 kg', unit: 'sac', cost: 18, margin: 12 }, { name: 'Fer à béton', unit: 'tonne', cost: 2600, margin: 8 },
        { name: 'Brique de 12', unit: 'pièce', cost: 0.75, margin: 20 }, { name: 'Sable', unit: 'm³', cost: 45, margin: 20 },
      ] },
      { name: 'Second œuvre', items: [
        { name: 'Carrelage', unit: 'm²', cost: 28, margin: 30 }, { name: 'Peinture 20 l', unit: 'seau', cost: 110, margin: 25 },
      ] },
      { name: 'Main-d’œuvre et location', items: [
        { name: 'Journée de maçon', unit: 'jour', price: 80, kind: 'service' }, { name: 'Journée de manœuvre', unit: 'jour', price: 45, kind: 'service' },
        { name: 'Location de bétonnière', unit: 'jour', price: 60, kind: 'service' },
      ] },
    ],
  },
  {
    code: 'education', name: 'Éducation et formation', nameEn: 'Education and training', nameAr: 'التعليم والتكوين',
    description: 'Écoles privées et centres de formation : inscriptions, mensualités, formateurs.',
    modules: [...BASE, 'sales', 'hr', 'objectives'],
    recommendations: [
      'Créez chaque formation comme une prestation : elle se facture sans mouvement de stock.',
      'Enregistrez chaque apprenant comme un client pour suivre ses règlements et ses relances.',
      'Les échéances d’une facture permettent d’encaisser une inscription en plusieurs mensualités.',
    ],
    categories: [
      { name: 'Scolarité', items: [
        { name: 'Frais d’inscription annuels', unit: 'année', price: 200, kind: 'service' }, { name: 'Mensualité', unit: 'mois', price: 250, kind: 'service' },
      ] },
      { name: 'Formation professionnelle', items: [
        { name: 'Formation courte (20 h)', unit: 'session', price: 400, kind: 'service' }, { name: 'Cours particulier', unit: 'heure', price: 30, kind: 'service' },
      ] },
      { name: 'Fournitures', items: [
        { name: 'Support de cours imprimé', cost: 6, margin: 60 }, { name: 'Tenue / uniforme', cost: 35, margin: 40 },
      ] },
    ],
  },
  {
    code: 'restaurant', name: 'Restaurants et cafés', nameEn: 'Restaurants and cafés', nameAr: 'المطاعم والمقاهي',
    description: 'Restaurants, cafés, pâtisseries et restauration rapide : carte, ingrédients, caisse.',
    modules: [...BASE, 'stock', 'sales', 'pos', 'purchases', 'suppliers', 'hr'],
    recommendations: [
      'Créez vos plats et boissons pour la caisse, et vos ingrédients comme produits stockés.',
      'Coût d’un plat = somme des ingrédients ; visez un prix de vente qui laisse la marge que vous vous fixez.',
      'Suivez les lots et dates de péremption des produits frais.',
    ],
    categories: [
      { name: 'Carte', description: 'Ce que vous vendez', items: [], children: [
        { name: 'Plats', items: [
          { name: 'Sandwich', unit: 'portion', cost: 3, margin: 130 }, { name: 'Pizza', unit: 'portion', cost: 5, margin: 160 }, { name: 'Plat du jour', unit: 'portion', cost: 7, margin: 130 },
        ] },
        { name: 'Boissons', items: [
          { name: 'Café express', unit: 'tasse', cost: 0.5, margin: 300 }, { name: 'Jus frais', unit: 'verre', cost: 1.8, margin: 180 }, { name: 'Eau minérale 0,5 l', unit: 'bouteille', cost: 0.5, margin: 200 },
        ] },
      ] },
      { name: 'Ingrédients', description: 'Ce que vous achetez', items: [
        { name: 'Farine', unit: 'kg', cost: 1.1, lots: true }, { name: 'Fromage', unit: 'kg', cost: 22, lots: true },
        { name: 'Café en grains', unit: 'kg', cost: 38, lots: true }, { name: 'Huile d’olive', unit: 'l', cost: 24, lots: true },
      ] },
    ],
  },
  {
    code: 'logistics', name: 'Logistique et transport', nameEn: 'Logistics and transport', nameAr: 'اللوجستيك والنقل',
    description: 'Transporteurs, messageries et entrepôts : expéditions, tournées, tarifs.',
    modules: [...BASE, 'logistics', 'sales', 'orders', 'purchases', 'suppliers', 'hr', 'objectives'],
    recommendations: [
      'Créez vos transporteurs puis vos expéditions : chaque transporteur suit ses colis depuis son espace.',
      'Facturez vos prestations (course, stockage, emballage) comme des services, sans stock.',
      'Le tableau d’analyse compare délais et taux de livraison par transporteur.',
    ],
    categories: [
      { name: 'Transport', items: [
        { name: 'Livraison en ville', unit: 'colis', price: 7, kind: 'service' }, { name: 'Livraison inter-régions', unit: 'colis', price: 10, kind: 'service' },
        { name: 'Transport de marchandises', unit: 'km', price: 1.2, kind: 'service' },
      ] },
      { name: 'Entreposage', items: [
        { name: 'Stockage de palette', unit: 'palette/mois', price: 20, kind: 'service' }, { name: 'Manutention', unit: 'heure', price: 15, kind: 'service' },
      ] },
      { name: 'Emballage', items: [
        { name: 'Carton d’expédition', cost: 1.2, margin: 60 }, { name: 'Film étirable', unit: 'rouleau', cost: 9, margin: 40 },
      ] },
    ],
  },
  {
    code: 'manufacturing', name: 'Industrie et fabrication', nameEn: 'Manufacturing and industry', nameAr: 'الصناعة والتصنيع',
    description: 'Ateliers et usines : matières premières, produits finis, achats et expéditions.',
    modules: [...BASE, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'objectives'],
    recommendations: [
      'Séparez matières premières et produits finis en catégories : la valeur du stock se lit par catégorie.',
      'Le coût moyen pondéré se met à jour à chaque réception d’achat.',
      'Les inventaires tournants corrigent le stock sans arrêter l’activité.',
    ],
    categories: [
      { name: 'Matières premières', items: [
        { name: 'Tissu', unit: 'm', cost: 6 }, { name: 'Fil à coudre', unit: 'bobine', cost: 2.5 }, { name: 'Granulés plastique', unit: 'kg', cost: 4.5 },
      ] },
      { name: 'Produits finis', items: [
        { name: 'Article confectionné', cost: 18, margin: 45 }, { name: 'Pièce injectée', cost: 1.4, margin: 60 },
      ] },
      { name: 'Sous-traitance', items: [
        { name: 'Façon (travail à façon)', unit: 'pièce', price: 4, kind: 'service' }, { name: 'Heure machine', unit: 'heure', price: 35, kind: 'service' },
      ] },
    ],
  },
  {
    code: 'services', name: 'Services professionnels', nameEn: 'Professional services', nameAr: 'الخدمات المهنية',
    description: 'Cabinets, agences et indépendants : honoraires, contrats, relances.',
    modules: [...BASE, 'sales', 'hr', 'objectives'],
    recommendations: [
      'Créez vos prestations (heure, jour, forfait) comme des services non stockés.',
      'La retenue à la source sur honoraires se règle par document ; validez le taux avec votre comptable.',
      'La fiche 360° d’un client réunit devis, factures, règlements et échanges.',
    ],
    categories: [
      { name: 'Honoraires', items: [
        { name: 'Heure de conseil', unit: 'heure', price: 60, kind: 'service' }, { name: 'Journée d’intervention', unit: 'jour', price: 400, kind: 'service' },
      ] },
      { name: 'Forfaits', items: [
        { name: 'Forfait mensuel de suivi', unit: 'mois', price: 300, kind: 'service' }, { name: 'Audit / diagnostic', unit: 'forfait', price: 800, kind: 'service' },
      ] },
      { name: 'Frais refacturés', items: [
        { name: 'Frais de déplacement', unit: 'km', price: 0.6, kind: 'service' },
      ] },
    ],
  },
  {
    code: 'other', name: 'Autre activité', nameEn: 'Other businesses', nameAr: 'نشاط آخر',
    description: 'Tous les modules sont proposés : gardez ceux qui vous servent.',
    modules: [...BASE, 'stock', 'sales', 'pos', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'objectives'],
    recommendations: [
      'Commencez par la fiche société (Paramètres › Société & fiscalité) : elle alimente vos factures.',
      'Importez vos produits et clients depuis un fichier Excel ou CSV pour démarrer vite.',
    ],
    categories: [
      { name: 'Produits', items: [{ name: 'Article exemple', cost: 10, margin: 40 }] },
      { name: 'Prestations', items: [{ name: 'Prestation exemple', unit: 'heure', price: 40, kind: 'service' }] },
    ],
  },
];

/** Base de calcul affichée à côté de chaque suggestion. */
export function basisFor(item: DefaultItem): string {
  if (item.kind === 'service') return 'Exemple de tarif à adapter à vos coûts et à votre zone — ce n’est pas un prix de marché.';
  if (item.cost !== undefined && item.margin !== undefined) return `Exemple : coût d’achat ${item.cost} DT + marge ${item.margin} %. Remplacez par votre coût réel.`;
  return 'Coût d’achat d’exemple (matière ou ingrédient non revendu tel quel). Remplacez par votre coût réel.';
}

export const DEFAULT_PLANS = [
  {
    code: 'starter', name: 'Starter', sortOrder: 1, highlight: false, maxUsers: 3, priceMonthly: 49, priceAnnual: 490,
    description: 'Pour démarrer : ventes, stock, facturation.',
    modules: ['products', 'categories', 'stock', 'sales', 'pos', 'purchases', 'clients', 'suppliers', 'invoices', 'reports'],
    features: ['Jusqu’à 3 utilisateurs', 'Ventes, caisse, achats et stock', 'Devis, factures et règlements', 'Rapports standard', 'Support par email'],
  },
  {
    code: 'business', name: 'Business', sortOrder: 2, highlight: true, maxUsers: 10, priceMonthly: 99, priceAnnual: 990,
    description: 'Tous les modules pour une PME qui grandit.',
    modules: null,
    features: ['Jusqu’à 10 utilisateurs', 'Tous les modules de votre secteur', 'Comptabilité, paie et RH', 'Analyses et assistant IA', 'Support prioritaire'],
  },
  {
    code: 'enterprise', name: 'Enterprise', sortOrder: 3, highlight: false, maxUsers: null, priceMonthly: null, priceAnnual: null,
    description: 'Multi-sites, besoins spécifiques, accompagnement dédié.',
    modules: null,
    features: ['Utilisateurs illimités', 'Paramétrage sur mesure', 'Reprise de données accompagnée', 'Interlocuteur dédié'],
  },
];

export const DEFAULT_SERVICE_OFFERS = [
  { sectorCode: null, category: 'setup', name: 'Mise en service standard', description: 'Paramétrage de la société, de la TVA, de la numérotation et des utilisateurs.', price: 300, priceUnit: 'one_time' },
  { sectorCode: null, category: 'migration', name: 'Reprise de données', description: 'Import de vos produits, clients, fournisseurs et soldes depuis vos fichiers.', price: null, priceUnit: 'one_time' },
  { sectorCode: null, category: 'training', name: 'Formation des utilisateurs', description: 'Session à distance ou sur site.', price: 250, priceUnit: 'per_day' },
  { sectorCode: null, category: 'support', name: 'Support et maintenance étendus', description: 'Assistance prioritaire par téléphone et suivi des mises à jour.', price: 40, priceUnit: 'per_month' },
  { sectorCode: 'commerce', category: 'setup', name: 'Commerce : configuration et gestion du stock', description: 'Catégories, codes-barres, seuils d’alerte, caisse.', price: 350, priceUnit: 'one_time' },
  { sectorCode: 'wholesale', category: 'setup', name: 'Distribution : dépôts et listes de prix', description: 'Dépôts, tarifs revendeurs, circuit bon de livraison → facture.', price: 450, priceUnit: 'one_time' },
  { sectorCode: 'restaurant', category: 'setup', name: 'Restaurant : carte, ingrédients et stock', description: 'Carte pour la caisse, ingrédients, suivi des produits frais.', price: 400, priceUnit: 'one_time' },
  { sectorCode: 'construction', category: 'setup', name: 'BTP : matériaux, main-d’œuvre et devis', description: 'Bibliothèque de matériaux et de prestations, modèles de devis.', price: 500, priceUnit: 'one_time' },
  { sectorCode: 'healthcare', category: 'setup', name: 'Santé : stock, lots et péremption', description: 'Suivi par lot, alertes de péremption, inventaire initial.', price: 450, priceUnit: 'one_time' },
  { sectorCode: 'logistics', category: 'setup', name: 'Logistique : transporteurs et expéditions', description: 'Transporteurs, grille de tarifs, suivi des livraisons.', price: 450, priceUnit: 'one_time' },
  { sectorCode: 'education', category: 'setup', name: 'Formation : inscriptions et mensualités', description: 'Catalogue de formations, échéanciers, relances.', price: 350, priceUnit: 'one_time' },
  { sectorCode: 'manufacturing', category: 'setup', name: 'Industrie : matières et produits finis', description: 'Catégories de stock, coûts, circuit d’achat.', price: 500, priceUnit: 'one_time' },
  { sectorCode: 'services', category: 'setup', name: 'Services : prestations et facturation', description: 'Catalogue d’honoraires, modèles de devis et de factures.', price: 300, priceUnit: 'one_time' },
];

export const DEFAULT_PAYMENT_METHODS = ['bank_transfer', 'cash', 'cheque', 'd17'];
export const PAYMENT_METHODS = ['bank_transfer', 'cash', 'cheque', 'd17', 'card', 'other'] as const;
