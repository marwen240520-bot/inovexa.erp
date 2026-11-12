/**
 * Photos réelles des produits de démonstration : liens vers Unsplash (licence Unsplash, usage gratuit,
 * y compris commercial, attribution non obligatoire — aucune photo Unsplash+ / premium).
 * L'ordre suit la liste PRODUCTS de demo-data.ts. Le domaine images.unsplash.com est autorisé
 * dans la politique de sécurité du frontend (frontend/proxy.ts, directive img-src).
 *
 * Paramètres : image recadrée en carré 400×400, compressée, format choisi par le navigateur (WebP/AVIF).
 */
const UNSPLASH_PARAMS = '?w=400&h=400&fit=crop&crop=entropy&q=70&auto=format';

/** [identifiant de la photo, page Unsplash de la photo (source)] */
const PHOTOS: Array<[string, string]> = [
  ['photo-1736576660096-744a1dae8e03', 'https://unsplash.com/photos/a-laptop-computer-sitting-on-top-of-a-desk-qkKQFsgcwak'], // Ordinateur portable 15"
  ['photo-1612103198005-b238154f4590', 'https://unsplash.com/photos/black-android-smartphone-on-brown-wooden-table-KEMb3TSbZBc'], // Smartphone 128 Go
  ['photo-1667404202905-4335b5370d96', 'https://unsplash.com/photos/a-white-refrigerator-with-a-black-handle-k7WP9oPThOI'], // Réfrigérateur 300 L
  ['photo-1677100091694-a09a1e468a7b', 'https://unsplash.com/photos/a-wooden-desk-topped-with-a-computer-monitor-and-keyboard-QNch8putqnU'], // Bureau ajustable
  ['photo-1553013983-15241ab69e57', 'https://unsplash.com/photos/white-printer-papers-on-tray-skQTL_S7-NE'], // Ramette papier A4 (x5)
  ['photo-1560824438-0a9f61ad5a48', 'https://unsplash.com/photos/ground-coffee-on-stainless-steel-cup-EgTjc4Hqbgk'], // Café moulu 1 kg
  ['photo-1720468750651-71bf110a05e5', 'https://unsplash.com/photos/a-group-of-four-water-bottles-sitting-on-top-of-a-table-NEfnQu_yz_g'], // Eau minérale (pack 6)
  ['photo-1519666251146-8e16c5518edd', 'https://unsplash.com/photos/a-bottle-of-soap-sitting-on-top-of-a-table-hn5yKk3gtK8'], // Gel hydroalcoolique 500 ml
  ['photo-1565503117139-7fd9677544e9', 'https://unsplash.com/photos/mens-gray-striped-collared-shirt-FD59Y8viCyU'], // Chemise coton homme
  ['photo-1571008887538-b36bb32f4571', 'https://unsplash.com/photos/pair-of-blue-and-white-adidas-running-shoes-XiZ7pRvCzro'], // Baskets running
  ['photo-1763004871583-4183d64096b1', 'https://unsplash.com/photos/two-rolled-yoga-mats-stand-against-a-wall-YmaOkRjoBVc'], // Tapis de yoga
  ['photo-1494059980473-813e73ee784b', 'https://unsplash.com/photos/stack-of-jigsaw-puzzle-pieces-3y1zF4hIPCg'], // Puzzle 1000 pièces
  ['photo-1593307315564-c96172dc89dc', 'https://unsplash.com/photos/black-and-red-cordless-hand-drill-ILBrHd6PFJA'], // Perceuse sans fil 18V
  ['photo-1635614986085-bf0d7a4ae4da', 'https://unsplash.com/photos/a-lawn-mower-sitting-on-top-of-a-dry-grass-field-zRCNMoW-goc'], // Tondeuse électrique
  ['photo-1635437536607-b8572f443763', 'https://unsplash.com/photos/a-couple-of-bottles-of-motor-oil-sitting-on-the-ground-IwPT9tPchsA'], // Huile moteur 5L
  ['photo-1615486511369-31ff08672204', 'https://unsplash.com/photos/white-and-blue-thermometer-at-36-9-WcJBDf_ATCc'], // Thermomètre infrarouge
  ['photo-1642683496509-121deffa9cf0', 'https://unsplash.com/photos/a-small-jar-of-cream-sitting-on-top-of-a-white-table-3g7YZVUV0A0'], // Crème hydratante 50 ml
  ['photo-1621695066793-fa220541b62a', 'https://unsplash.com/photos/white-book-on-brown-wooden-table-SBuIwMO8CKs'], // Roman policier poche
  ['photo-1524820801657-fd59673fbb05', 'https://unsplash.com/photos/grey-desk-lamp-on-top-of-office-desk-U6EXlQCZ938'], // Lampe LED bureau
  ['photo-1514792368985-f80e9d482a02', 'https://unsplash.com/photos/pile-of-cardboard-boxes-7eQlPra81zQ'], // Carton d'emballage (x50)
];

export const DEMO_PRODUCT_IMAGES: string[] = PHOTOS.map(([id]) => `https://images.unsplash.com/${id}${UNSPLASH_PARAMS}`);

/** Page Unsplash d'origine de chaque photo (même ordre), pour citer la source si besoin. */
export const DEMO_PRODUCT_IMAGE_SOURCES: string[] = PHOTOS.map(([, page]) => page);
