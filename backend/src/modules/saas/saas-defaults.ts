/**
 * Contenu de départ de la plateforme : formules, secteurs, catalogue de suggestions, prestations.
 *
 *  - Formules : créées PUBLIÉES, en dollars (USD), hors taxes. Le client choisit sa formule et la paie en ligne par
 *    carte, sans intervention de l'administrateur — qui peut toujours modifier les prix (Administration › Formules).
 *  - Prestations (mise en service, formation…) : créées en BROUILLON, à relire avant publication.
 *  - Catalogue par secteur : exemples chiffrés, en dinars, pour montrer le calcul « coût d'achat + marge = prix de
 *    vente » dans l'ERP du client. Ce ne sont PAS des prix de marché : chaque ligne porte sa base de calcul (`basis`),
 *    et chaque société remplace ces valeurs par les siennes.
 *  - La TVA n'est pas renseignée par article : c'est le taux par défaut de la société qui s'applique (modifiable).
 *
 * Ce contenu n'est inséré qu'une fois (platform_settings.defaultsSeeded) ; ensuite tout se gère depuis l'administration.
 * Quand ce fichier évolue (nouveaux secteurs, modules d'un secteur, prix), CATALOG_VERSION augmente et
 * SaasSettingsService.upgradeDefaults() reporte les nouveautés dans les bases déjà installées, SANS toucher à ce que
 * l'administrateur a modifié (voir CATALOG_V1 et CATALOG_V2 plus bas).
 *
 * ⚠️  Le site public affiche le même catalogue : frontend/lib/catalog.ts. Les deux fichiers se modifient ensemble.
 */

/** Version du contenu de départ ci-dessous (platform_settings.catalogVersion). */
export const CATALOG_VERSION = 3;

/** Modules utiles à toute société, quel que soit son secteur. */
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
    modules: [...BASE, 'stock', 'sales', 'pos', 'purchases', 'orders', 'suppliers', 'hr', 'objectives'],
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
    modules: [...BASE, 'stock', 'sales', 'pos', 'purchases', 'suppliers', 'hr', 'appointments', 'objectives'],
    recommendations: [
      'Activez le suivi par lot sur les produits périssables : les sorties se font au premier périmé (FEFO).',
      'Les alertes signalent les lots qui périment dans les 30 jours.',
      'Les prix des médicaments sont réglementés : saisissez les prix officiels en vigueur, pas des estimations.',
      'Tenez l’agenda dans Rendez-vous : un praticien ne peut pas recevoir deux patients sur le même créneau.',
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
    modules: [...BASE, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'projects', 'objectives'],
    recommendations: [
      'Créez la main-d’œuvre et les locations comme des prestations (non stockées) : elles s’ajoutent aux devis.',
      'Un devis accepté se transforme en bon de livraison puis en facture, sans ressaisie.',
      'Les prix des matériaux varient souvent : mettez à jour vos coûts à chaque achat (le coût moyen se recalcule seul).',
      'Créez un projet par chantier : budget, coût réel, étapes et retards se suivent au même endroit.',
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
    modules: [...BASE, 'sales', 'hr', 'appointments', 'objectives'],
    recommendations: [
      'Créez chaque formation comme une prestation : elle se facture sans mouvement de stock.',
      'Enregistrez chaque apprenant comme un client pour suivre ses règlements et ses relances.',
      'Les échéances d’une facture permettent d’encaisser une inscription en plusieurs mensualités.',
      'Planifiez vos séances dans Rendez-vous, par salle ou par formateur : les chevauchements sont refusés.',
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
    modules: [...BASE, 'stock', 'sales', 'pos', 'purchases', 'suppliers', 'hr', 'appointments', 'objectives'],
    recommendations: [
      'Créez vos plats et boissons pour la caisse, et vos ingrédients comme produits stockés.',
      'Coût d’un plat = somme des ingrédients ; visez un prix de vente qui laisse la marge que vous vous fixez.',
      'Suivez les lots et dates de péremption des produits frais.',
      'Notez les réservations dans Rendez-vous : la table est bloquée sur le créneau, avec le nombre de couverts.',
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
    modules: [...BASE, 'logistics', 'stock', 'sales', 'orders', 'purchases', 'suppliers', 'hr', 'objectives'],
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
    modules: [...BASE, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'production', 'hr', 'objectives'],
    recommendations: [
      'Créez un ordre de fabrication par série : la nomenclature (composants par unité) sort du stock à chaque avancement, le produit fini y entre.',
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
    modules: [...BASE, 'sales', 'hr', 'appointments', 'projects', 'objectives'],
    recommendations: [
      'Créez vos prestations (heure, jour, forfait) comme des services non stockés.',
      'La retenue à la source sur honoraires se règle par document ; validez le taux avec votre comptable.',
      'La fiche 360° d’un client réunit devis, factures, règlements et échanges.',
      'Suivez chaque mission dans Projets (budget, tâches, échéances) et vos rendez-vous clients dans l’agenda.',
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
    code: 'agrifood', name: 'Agriculture et agroalimentaire', nameEn: 'Agriculture and agri-food', nameAr: 'الفلاحة والصناعات الغذائية',
    description: 'Exploitations, huileries, conditionnement et transformation : récoltes, lots, fabrication et export.',
    modules: [...BASE, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'production', 'hr', 'objectives'],
    recommendations: [
      'Activez le suivi par lot : chaque récolte ou chaque fabrication garde sa traçabilité et sa date limite.',
      'Créez un ordre de fabrication par transformation (olives → huile, lait → fromage) : les matières sortent du stock, le produit fini y entre.',
      'Enregistrez intrants et emballages comme achats : le coût moyen se met à jour à chaque réception.',
    ],
    categories: [
      { name: 'Matières et intrants', items: [
        { name: 'Olives', unit: 'kg', cost: 2.2, lots: true }, { name: 'Bouteille en verre 75 cl', cost: 1.1 },
        { name: 'Carton d’emballage', cost: 1.5 }, { name: 'Engrais', unit: 'sac', cost: 85 },
      ] },
      { name: 'Produits finis', items: [
        { name: 'Huile d’olive vierge extra 1 l', unit: 'bouteille', cost: 18, margin: 30, lots: true }, { name: 'Dattes Deglet Nour 1 kg', unit: 'boîte', cost: 9, margin: 40, lots: true },
        { name: 'Harissa 380 g', unit: 'bocal', cost: 2.4, margin: 45, lots: true }, { name: 'Miel 500 g', unit: 'pot', cost: 14, margin: 40, lots: true },
      ] },
      { name: 'Travail à façon', items: [
        { name: 'Trituration à façon', unit: 'kg', price: 0.25, kind: 'service' }, { name: 'Conditionnement à façon', unit: 'unité', price: 0.4, kind: 'service' },
      ] },
    ],
  },
  {
    code: 'automotive', name: 'Automobile et pièces détachées', nameEn: 'Automotive and spare parts', nameAr: 'السيارات وقطع الغيار',
    description: 'Magasins de pièces, garages et ateliers : références, stock, devis de réparation et main-d’œuvre.',
    modules: [...BASE, 'stock', 'sales', 'pos', 'purchases', 'orders', 'suppliers', 'hr', 'appointments', 'objectives'],
    recommendations: [
      'Saisissez la référence constructeur dans le code de l’article : la recherche retrouve la pièce par sa référence ou par son nom.',
      'Créez la main-d’œuvre (heure d’atelier, diagnostic) comme prestation : elle s’ajoute aux pièces sur le devis et la facture.',
      'Fixez un seuil d’alerte sur les pièces à forte rotation (filtres, plaquettes, huiles).',
      'Prenez les rendez-vous d’atelier dans l’agenda, par pont ou par mécanicien : un créneau ne se réserve qu’une fois.',
    ],
    categories: [
      { name: 'Pièces d’entretien', items: [
        { name: 'Filtre à huile', cost: 9, margin: 60 }, { name: 'Filtre à air', cost: 14, margin: 55 }, { name: 'Plaquettes de frein (jeu)', unit: 'jeu', cost: 38, margin: 45 },
        { name: 'Bougie d’allumage', cost: 7, margin: 70 }, { name: 'Courroie de distribution', cost: 55, margin: 40 },
      ] },
      { name: 'Lubrifiants et liquides', items: [
        { name: 'Huile moteur 5W40 (5 l)', unit: 'bidon', cost: 78, margin: 25 }, { name: 'Liquide de refroidissement (5 l)', unit: 'bidon', cost: 16, margin: 50 },
        { name: 'Liquide de frein (500 ml)', unit: 'flacon', cost: 9, margin: 60 },
      ] },
      { name: 'Pneus et batteries', items: [
        { name: 'Pneu 195/65 R15', cost: 160, margin: 18 }, { name: 'Batterie 60 Ah', cost: 210, margin: 20 },
      ] },
      { name: 'Atelier', items: [
        { name: 'Heure de main-d’œuvre', unit: 'heure', price: 35, kind: 'service' }, { name: 'Vidange', unit: 'forfait', price: 25, kind: 'service' },
        { name: 'Diagnostic électronique', unit: 'forfait', price: 40, kind: 'service' },
      ] },
    ],
  },
  {
    code: 'ecommerce', name: 'Vente en ligne', nameEn: 'Online sales', nameAr: 'البيع عبر الإنترنت',
    description: 'Boutiques en ligne et vente sur les réseaux sociaux : commandes, stock, colis et retours.',
    modules: [...BASE, 'stock', 'sales', 'orders', 'purchases', 'suppliers', 'logistics', 'objectives'],
    recommendations: [
      'Enregistrez chaque commande reçue (site, Facebook, Instagram, TikTok) : elle devient bon de livraison puis facture, sans ressaisie.',
      'Créez vos transporteurs dans Logistique : chaque colis a son numéro de suivi et son statut de livraison.',
      'Ajoutez la livraison comme prestation pour la facturer à part.',
    ],
    categories: [
      { name: 'Mode', items: [
        { name: 'Robe', cost: 45, margin: 80 }, { name: 'Ensemble', cost: 60, margin: 70 }, { name: 'Chaussures', unit: 'paire', cost: 55, margin: 65 }, { name: 'Sac', cost: 35, margin: 90 },
      ] },
      { name: 'Beauté et accessoires', items: [
        { name: 'Coffret cadeau', cost: 28, margin: 75 }, { name: 'Parfum 50 ml', cost: 40, margin: 60 }, { name: 'Montre', cost: 50, margin: 80 },
      ] },
      { name: 'Livraison et services', items: [
        { name: 'Livraison à domicile', unit: 'colis', price: 8, kind: 'service' }, { name: 'Emballage cadeau', unit: 'unité', price: 3, kind: 'service' },
        { name: 'Frais de retour', unit: 'colis', price: 8, kind: 'service' },
      ] },
    ],
  },
  {
    code: 'textile', name: 'Textile et habillement', nameEn: 'Textile and clothing', nameAr: 'النسيج والملابس',
    description: 'Ateliers de confection, façonniers et marques : tissus, fournitures, ordres de fabrication et livraisons.',
    modules: [...BASE, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'production', 'hr', 'objectives'],
    recommendations: [
      'Créez un ordre de fabrication par modèle : la nomenclature (tissu, fil, boutons par pièce) sort du stock à chaque avancement.',
      'Séparez tissus, fournitures et produits finis en catégories pour lire la valeur du stock par famille.',
      'Facturez le travail à façon comme une prestation à la pièce.',
    ],
    categories: [
      { name: 'Tissus', items: [
        { name: 'Tissu coton', unit: 'm', cost: 7 }, { name: 'Tissu denim', unit: 'm', cost: 11 }, { name: 'Doublure', unit: 'm', cost: 3.5 },
      ] },
      { name: 'Fournitures', items: [
        { name: 'Fil à coudre', unit: 'cône', cost: 4 }, { name: 'Boutons (100)', unit: 'lot', cost: 6 }, { name: 'Fermeture éclair', cost: 0.9 }, { name: 'Étiquettes (100)', unit: 'lot', cost: 8 },
      ] },
      { name: 'Produits finis', items: [
        { name: 'Chemise', cost: 22, margin: 55 }, { name: 'Pantalon', cost: 28, margin: 50 }, { name: 'Tablier professionnel', cost: 12, margin: 60 },
      ] },
      { name: 'Travail à façon', items: [
        { name: 'Confection à façon', unit: 'pièce', price: 5, kind: 'service' }, { name: 'Coupe', unit: 'pièce', price: 0.8, kind: 'service' },
        { name: 'Repassage et emballage', unit: 'pièce', price: 0.6, kind: 'service' },
      ] },
    ],
  },
  {
    code: 'beauty', name: 'Beauté et bien-être', nameEn: 'Beauty and wellness', nameAr: 'التجميل والعناية',
    description: 'Salons de coiffure, instituts, spas et parfumeries : prestations, produits et caisse.',
    modules: [...BASE, 'stock', 'sales', 'pos', 'purchases', 'suppliers', 'hr', 'appointments', 'objectives'],
    recommendations: [
      'Créez vos soins et coupes comme prestations : ils s’encaissent à la caisse sans mouvement de stock.',
      'Enregistrez chaque cliente comme client pour suivre ses visites et ses achats.',
      'Suivez les lots des produits cosmétiques : les alertes signalent ceux qui approchent de leur date limite.',
      'Prenez les rendez-vous dans l’agenda, par coiffeuse ou par cabine : un créneau ne se réserve qu’une fois.',
    ],
    categories: [
      { name: 'Coiffure', items: [
        { name: 'Coupe femme', unit: 'prestation', price: 25, kind: 'service' }, { name: 'Brushing', unit: 'prestation', price: 15, kind: 'service' },
        { name: 'Coloration', unit: 'prestation', price: 60, kind: 'service' }, { name: 'Coupe homme', unit: 'prestation', price: 12, kind: 'service' },
      ] },
      { name: 'Soins', items: [
        { name: 'Soin du visage', unit: 'séance', price: 45, kind: 'service' }, { name: 'Manucure', unit: 'séance', price: 20, kind: 'service' },
        { name: 'Hammam et gommage', unit: 'séance', price: 35, kind: 'service' },
      ] },
      { name: 'Produits', items: [
        { name: 'Shampooing professionnel', cost: 18, margin: 60, lots: true }, { name: 'Sérum capillaire', cost: 22, margin: 70, lots: true }, { name: 'Vernis à ongles', cost: 6, margin: 100, lots: true },
      ] },
    ],
  },
  {
    code: 'other', name: 'Autre activité', nameEn: 'Other businesses', nameAr: 'نشاط آخر',
    description: 'Tous les modules sont proposés : gardez ceux qui vous servent.',
    modules: [...BASE, 'stock', 'sales', 'pos', 'purchases', 'orders', 'suppliers', 'logistics', 'production', 'hr', 'appointments', 'projects', 'objectives'],
    recommendations: [
      'Commencez par la fiche société (Paramètres › Société & fiscalité) : elle alimente vos factures.',
      'Importez vos produits et clients depuis un fichier Excel ou CSV pour démarrer vite.',
      'Activez Rendez-vous ou Projets si vous travaillez sur créneaux ou par chantier : vous choisissez vos modules vous-même.',
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

/**
 * Formules. Prix HORS TAXES en dollars (USD) : l'annuel vaut dix mensualités (deux mois offerts).
 * `modules: null` = tous les modules du secteur de la société.
 */
export const DEFAULT_PLANS = [
  {
    code: 'starter', name: 'Starter', sortOrder: 1, highlight: false, maxUsers: 3, priceMonthly: 15, priceAnnual: 150,
    description: 'Pour démarrer : ventes, caisse, stock, agenda et facturation.',
    modules: ['products', 'categories', 'stock', 'sales', 'pos', 'purchases', 'orders', 'clients', 'suppliers', 'invoices', 'appointments', 'reports'],
    features: ['Jusqu’à 3 utilisateurs', 'Ventes, caisse, achats, commandes et stock', 'Devis, factures, avoirs et règlements', 'Agenda : rendez-vous et réservations', 'Fichier TEIF pour El Fatoora', 'Rapports, exports Excel et PDF', 'Support par email'],
  },
  {
    code: 'business', name: 'Business', sortOrder: 2, highlight: true, maxUsers: 10, priceMonthly: 29, priceAnnual: 290,
    description: 'Tous les modules de votre secteur pour une PME qui grandit.',
    modules: null,
    features: ['Jusqu’à 10 utilisateurs', 'Tous les modules de votre secteur', 'Comptabilité, TVA et rapprochement bancaire', 'RH, congés et paie (CNSS, IRPP)', 'Logistique, production, projets et objectifs', 'Analyses et assistant IA', 'Support prioritaire'],
  },
  {
    code: 'enterprise', name: 'Enterprise', sortOrder: 3, highlight: false, maxUsers: null, priceMonthly: 79, priceAnnual: 790,
    description: 'Utilisateurs illimités et accompagnement dédié.',
    modules: null,
    features: ['Utilisateurs illimités', 'Tous les modules de votre secteur', 'Mise en service et reprise de données accompagnées', 'Formation de vos équipes', 'Interlocuteur dédié', 'Paramétrage sur mesure (sur devis)'],
  },
];

export const DEFAULT_SERVICE_OFFERS = [
  { sectorCode: null, category: 'setup', name: 'Mise en service standard', description: 'Paramétrage de la société, de la TVA, de la numérotation et des utilisateurs.', price: 95, priceUnit: 'one_time' },
  { sectorCode: null, category: 'migration', name: 'Reprise de données', description: 'Import de vos produits, clients, fournisseurs et soldes depuis vos fichiers.', price: null, priceUnit: 'one_time' },
  { sectorCode: null, category: 'training', name: 'Formation des utilisateurs', description: 'Session à distance ou sur site.', price: 80, priceUnit: 'per_day' },
  { sectorCode: null, category: 'support', name: 'Support et maintenance étendus', description: 'Assistance prioritaire par téléphone et suivi des mises à jour.', price: 13, priceUnit: 'per_month' },
  { sectorCode: 'commerce', category: 'setup', name: 'Commerce : configuration et gestion du stock', description: 'Catégories, codes-barres, seuils d’alerte, caisse.', price: 110, priceUnit: 'one_time' },
  { sectorCode: 'wholesale', category: 'setup', name: 'Distribution : dépôts et listes de prix', description: 'Dépôts, tarifs revendeurs, circuit bon de livraison → facture.', price: 145, priceUnit: 'one_time' },
  { sectorCode: 'restaurant', category: 'setup', name: 'Restaurant : carte, ingrédients et stock', description: 'Carte pour la caisse, ingrédients, suivi des produits frais.', price: 130, priceUnit: 'one_time' },
  { sectorCode: 'construction', category: 'setup', name: 'BTP : matériaux, main-d’œuvre et devis', description: 'Bibliothèque de matériaux et de prestations, modèles de devis.', price: 160, priceUnit: 'one_time' },
  { sectorCode: 'healthcare', category: 'setup', name: 'Santé : stock, lots et péremption', description: 'Suivi par lot, alertes de péremption, inventaire initial.', price: 145, priceUnit: 'one_time' },
  { sectorCode: 'logistics', category: 'setup', name: 'Logistique : transporteurs et expéditions', description: 'Transporteurs, grille de tarifs, suivi des livraisons.', price: 145, priceUnit: 'one_time' },
  { sectorCode: 'education', category: 'setup', name: 'Formation : inscriptions et mensualités', description: 'Catalogue de formations, échéanciers, relances.', price: 110, priceUnit: 'one_time' },
  { sectorCode: 'manufacturing', category: 'setup', name: 'Industrie : matières et produits finis', description: 'Catégories de stock, coûts, circuit d’achat.', price: 160, priceUnit: 'one_time' },
  { sectorCode: 'services', category: 'setup', name: 'Services : prestations et facturation', description: 'Catalogue d’honoraires, modèles de devis et de factures.', price: 95, priceUnit: 'one_time' },
  ...newSectorOffersV2(),
];

/** Prestations des secteurs ajoutés à la version 2 du catalogue (aussi utilisées par la mise à niveau des bases existantes). */
export function newSectorOffersV2() {
  return [
    { sectorCode: 'agrifood', category: 'setup', name: 'Agroalimentaire : lots, fabrication et traçabilité', description: 'Suivi par lot, nomenclatures de transformation, inventaire initial.', price: 160, priceUnit: 'one_time' },
    { sectorCode: 'automotive', category: 'setup', name: 'Automobile : références, stock et atelier', description: 'Reprise des références, seuils d’alerte, prestations d’atelier, caisse.', price: 130, priceUnit: 'one_time' },
    { sectorCode: 'ecommerce', category: 'setup', name: 'Vente en ligne : commandes, colis et retours', description: 'Circuit commande → livraison → facture, transporteurs, frais de livraison.', price: 110, priceUnit: 'one_time' },
    { sectorCode: 'textile', category: 'setup', name: 'Textile : nomenclatures et ordres de fabrication', description: 'Tissus et fournitures, nomenclature par modèle, travail à façon.', price: 160, priceUnit: 'one_time' },
    { sectorCode: 'beauty', category: 'setup', name: 'Beauté : prestations, produits et caisse', description: 'Carte des prestations, produits en vente, sessions de caisse.', price: 95, priceUnit: 'one_time' },
  ] as Array<{ sectorCode: string | null; category: string; name: string; description: string; price: number | null; priceUnit: string }>;
}

/**
 * Moyens de paiement d'un abonnement.
 *  - card : carte bancaire EN LIGNE, par le prestataire de paiement (Konnect). C'est le seul moyen proposé par défaut :
 *    l'accès s'ouvre automatiquement dès que le prestataire confirme l'encaissement.
 *  - les autres (virement, D17, Flouci, e-Dinar, mandat, chèque, espèces) sont des paiements HORS LIGNE, déclarés par le
 *    client puis validés par l'administrateur ; ils ne sont proposés que si l'administrateur les active
 *    (platform_settings.manualPayments).
 */
export const PAYMENT_METHODS = ['bank_transfer', 'd17', 'flouci', 'edinar', 'postal', 'cheque', 'cash', 'card', 'other'] as const;
export const DEFAULT_PAYMENT_METHODS = ['bank_transfer', 'd17', 'flouci', 'cheque', 'cash'];

/**
 * Contenu de départ de la VERSION 1 : sert uniquement à reconnaître, dans une base déjà installée, ce que
 * l'administrateur n'a pas modifié. Une valeur encore identique à celle-ci est mise à niveau ; toute autre est conservée.
 */
const BASE_V1 = ['products', 'categories', 'clients', 'invoices', 'finance', 'reports', 'analytics', 'ai'];
export const CATALOG_V1 = {
  sectorModules: {
    commerce: [...BASE_V1, 'stock', 'sales', 'pos', 'purchases', 'orders', 'suppliers', 'objectives'],
    wholesale: [...BASE_V1, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'objectives'],
    healthcare: [...BASE_V1, 'stock', 'sales', 'pos', 'purchases', 'suppliers', 'hr'],
    construction: [...BASE_V1, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'objectives'],
    education: [...BASE_V1, 'sales', 'hr', 'objectives'],
    restaurant: [...BASE_V1, 'stock', 'sales', 'pos', 'purchases', 'suppliers', 'hr'],
    logistics: [...BASE_V1, 'logistics', 'sales', 'orders', 'purchases', 'suppliers', 'hr', 'objectives'],
    manufacturing: [...BASE_V1, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'objectives'],
    services: [...BASE_V1, 'sales', 'hr', 'objectives'],
    other: [...BASE_V1, 'stock', 'sales', 'pos', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'objectives'],
  } as Record<string, string[]>,
  plans: {
    starter: { priceMonthly: 49, priceAnnual: 490, maxUsers: 3, features: ['Jusqu’à 3 utilisateurs', 'Ventes, caisse, achats et stock', 'Devis, factures et règlements', 'Rapports standard', 'Support par email'] },
    business: { priceMonthly: 99, priceAnnual: 990, maxUsers: 10, features: ['Jusqu’à 10 utilisateurs', 'Tous les modules de votre secteur', 'Comptabilité, paie et RH', 'Analyses et assistant IA', 'Support prioritaire'] },
    enterprise: { priceMonthly: null, priceAnnual: null, maxUsers: null, features: ['Utilisateurs illimités', 'Paramétrage sur mesure', 'Reprise de données accompagnée', 'Interlocuteur dédié'] },
  } as Record<string, { priceMonthly: number | null; priceAnnual: number | null; maxUsers: number | null; features: string[] }>,
  paymentMethods: ['bank_transfer', 'cash', 'cheque', 'd17'],
};

/**
 * Contenu de départ de la VERSION 2 (même rôle que CATALOG_V1, pour le passage à la version 3) : dinars, formules en
 * brouillon, sans les modules Rendez-vous et Projets.
 */
const BASE_V2 = ['products', 'categories', 'clients', 'invoices', 'finance', 'reports', 'analytics', 'ai'];
export const CATALOG_V2 = {
  sectorModules: {
    commerce: [...BASE_V2, 'stock', 'sales', 'pos', 'purchases', 'orders', 'suppliers', 'hr', 'objectives'],
    wholesale: [...BASE_V2, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'objectives'],
    healthcare: [...BASE_V2, 'stock', 'sales', 'pos', 'purchases', 'suppliers', 'hr', 'objectives'],
    construction: [...BASE_V2, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'objectives'],
    education: [...BASE_V2, 'sales', 'hr', 'objectives'],
    restaurant: [...BASE_V2, 'stock', 'sales', 'pos', 'purchases', 'suppliers', 'hr', 'objectives'],
    logistics: [...BASE_V2, 'logistics', 'stock', 'sales', 'orders', 'purchases', 'suppliers', 'hr', 'objectives'],
    manufacturing: [...BASE_V2, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'production', 'hr', 'objectives'],
    services: [...BASE_V2, 'sales', 'hr', 'objectives'],
    agrifood: [...BASE_V2, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'production', 'hr', 'objectives'],
    automotive: [...BASE_V2, 'stock', 'sales', 'pos', 'purchases', 'orders', 'suppliers', 'hr', 'objectives'],
    ecommerce: [...BASE_V2, 'stock', 'sales', 'orders', 'purchases', 'suppliers', 'logistics', 'objectives'],
    textile: [...BASE_V2, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'production', 'hr', 'objectives'],
    beauty: [...BASE_V2, 'stock', 'sales', 'pos', 'purchases', 'suppliers', 'hr', 'objectives'],
    other: [...BASE_V2, 'stock', 'sales', 'pos', 'purchases', 'orders', 'suppliers', 'logistics', 'production', 'hr', 'objectives'],
  } as Record<string, string[]>,
  plans: {
    starter: {
      priceMonthly: 49, priceAnnual: 490, maxUsers: 3, description: 'Pour démarrer : ventes, caisse, stock et facturation.',
      modules: ['products', 'categories', 'stock', 'sales', 'pos', 'purchases', 'orders', 'clients', 'suppliers', 'invoices', 'reports'],
      features: ['Jusqu’à 3 utilisateurs', 'Ventes, caisse, achats, commandes et stock', 'Devis, factures, avoirs et règlements', 'Fichier TEIF pour El Fatoora', 'Rapports, exports Excel et PDF', 'Support par email'],
    },
    business: {
      priceMonthly: 99, priceAnnual: 990, maxUsers: 10, description: 'Tous les modules de votre secteur pour une PME qui grandit.', modules: null,
      features: ['Jusqu’à 10 utilisateurs', 'Tous les modules de votre secteur', 'Comptabilité, TVA et rapprochement bancaire', 'RH, congés et paie (CNSS, IRPP)', 'Logistique, production et objectifs', 'Analyses et assistant IA', 'Support prioritaire'],
    },
    enterprise: {
      priceMonthly: 249, priceAnnual: 2490, maxUsers: null, description: 'Utilisateurs illimités et accompagnement dédié.', modules: null,
      features: ['Utilisateurs illimités', 'Tous les modules de votre secteur', 'Mise en service et reprise de données accompagnées', 'Formation de vos équipes', 'Interlocuteur dédié', 'Paramétrage sur mesure (sur devis)'],
    },
  } as Record<string, { priceMonthly: number | null; priceAnnual: number | null; maxUsers: number | null; description: string; modules: string[] | null; features: string[] }>,
  /** Prix en dinars des prestations de départ (par nom) : une prestation restée à ce prix reçoit le montant en dollars. */
  offerPrices: {
    'Mise en service standard': 300,
    'Formation des utilisateurs': 250,
    'Support et maintenance étendus': 40,
    'Commerce : configuration et gestion du stock': 350,
    'Distribution : dépôts et listes de prix': 450,
    'Restaurant : carte, ingrédients et stock': 400,
    'BTP : matériaux, main-d’œuvre et devis': 500,
    'Santé : stock, lots et péremption': 450,
    'Logistique : transporteurs et expéditions': 450,
    'Formation : inscriptions et mensualités': 350,
    'Industrie : matières et produits finis': 500,
    'Services : prestations et facturation': 300,
    'Agroalimentaire : lots, fabrication et traçabilité': 500,
    'Automobile : références, stock et atelier': 400,
    'Vente en ligne : commandes, colis et retours': 350,
    'Textile : nomenclatures et ordres de fabrication': 500,
    'Beauté : prestations, produits et caisse': 300,
  } as Record<string, number>,
  currency: 'TND',
};
