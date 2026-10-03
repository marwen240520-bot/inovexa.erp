/**
 * Photos de produits : réduction côté navigateur avant envoi.
 *
 * Les photos sont stockées en base (champ imageUrl, « data URL »). On les réduit donc à ~480 px et on les
 * recompresse en JPEG : une photo de téléphone de 4 Mo devient ~30 Ko, ce qui garde les listes rapides.
 */

export const IMAGE_MAX_SIDE = 480;
export const IMAGE_QUALITY = 0.78;
export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

/** "Écran 24\"_v2.JPG" -> "ecran24v2" : pour rapprocher un nom de fichier d'un SKU ou d'un nom de produit */
export const normalizeKey = (v: string): string =>
  String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export const fileStem = (name: string): string => name.replace(/\.[^.]+$/, "");

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image illisible")); };
    img.src = url;
  });
}

/** Réduit une image (côté le plus long = maxSide) et renvoie une data URL JPEG. */
export async function resizeImageToDataUrl(file: File, maxSide = IMAGE_MAX_SIDE, quality = IMAGE_QUALITY): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Le fichier n'est pas une image");
  const img = await loadImage(file);
  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Traitement d'image indisponible");
  ctx.fillStyle = "#ffffff"; // fond blanc pour les PNG transparents (JPEG n'a pas de transparence)
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
