/**
 * Reconnaît une image d'après ses premiers octets — jamais d'après le nom ou le type annoncé par le navigateur, que
 * n'importe qui peut falsifier. Renvoie l'extension du format reconnu, ou null.
 */
export function sniffImage(head: Buffer): 'jpg' | 'png' | 'gif' | 'webp' | null {
  if (!head || head.length < 12) return null;
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpg';
  if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  const sig = head.subarray(0, 6).toString('latin1');
  if (sig === 'GIF87a' || sig === 'GIF89a') return 'gif';
  if (head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}
