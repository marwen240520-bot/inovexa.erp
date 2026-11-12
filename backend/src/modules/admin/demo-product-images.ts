/**
 * Photos catalogue des produits de démonstration : produit seul sur fond blanc ou uni, liens vers Unsplash.
 * Licence Unsplash : usage gratuit, y compris commercial, attribution non obligatoire
 * (uniquement des photos images.unsplash.com, aucune photo Unsplash+ / premium).
 * L'ordre suit la liste PRODUCTS de demo-data.ts. Le domaine images.unsplash.com est autorisé
 * dans la politique de sécurité du frontend (frontend/proxy.ts, directive img-src).
 *
 * Paramètres : carré 600×600 recadré au centre (le produit y est placé), compressé,
 * format choisi par le navigateur (WebP/AVIF).
 */
const UNSPLASH_PARAMS = '?w=600&h=600&fit=crop&crop=center&q=75&auto=format';

/** [identifiant de la photo Unsplash, produit correspondant] */
const PHOTOS: Array<[string, string]> = [
  ['photo-1692729928780-dc35089aaaa1', 'Smartphone 128 Go'],
  ['photo-1583394838336-acd977736f90', 'Casque Bluetooth à réduction de bruit'],
  ['photo-1699456537728-3ecee54c84d5', 'Enceinte portable'],
  ['photo-1669884210028-81aa4c7442e5', 'Clavier sans fil'],
  ['photo-1772531606450-0dd023c265d7', 'Souris sans fil'],
  ['photo-1613600143671-234a54c236eb', 'Appareil photo hybride'],
  ['photo-1677086522121-f6702cdbf07b', 'Montre classique bracelet acier'],
  ['photo-1708799366365-a24608103bed', 'Lunettes de soleil'],
  ['photo-1594299447935-e5b840f54b9b', 'Sac à dos urbain'],
  ['photo-1624538000860-24716b9050f2', 'Portefeuille en cuir'],
  ['photo-1581655353564-df123a1eb820', 'T-shirt coton blanc'],
  ['photo-1645266729222-17cd32e06fd0', 'Casquette'],
  ['photo-1600185365926-3a2ce3cdb9eb', 'Baskets running'],
  ['photo-1694179023466-cb438ce7ae0b', 'Eau de parfum 100 ml'],
  ['photo-1740046701720-1601d477326a', 'Shampooing 400 ml'],
  ['photo-1713768704571-6aeb0d0e5105', 'Sérum visage 30 ml'],
  ['photo-1616241673111-508b4662c707', 'Mug céramique'],
  ['photo-1746393877488-1dfd62264775', 'Plante en pot'],
  ['photo-1616118132534-381148898bb4', 'Gourde 750 ml'],
  ['photo-1549869638-10ef712893a7', 'Gel douche 250 ml'],
];

export const DEMO_PRODUCT_IMAGES: string[] = PHOTOS.map(([id]) => `https://images.unsplash.com/${id}${UNSPLASH_PARAMS}`);

/** Nom du produit associé à chaque photo (même ordre) — sert à vérifier la correspondance avec PRODUCTS. */
export const DEMO_PRODUCT_IMAGE_NAMES: string[] = PHOTOS.map(([, name]) => name);
