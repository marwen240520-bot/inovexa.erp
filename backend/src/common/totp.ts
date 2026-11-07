import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/** TOTP (RFC 6238, SHA-1, 6 chiffres, pas de 30 s) compatible Google Authenticator, Microsoft Authenticator, Authy… */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

export function hotp(secret: string, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', base32Decode(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(code % 10 ** digits).padStart(digits, '0');
}

export function totp(secret: string, atMs = Date.now(), stepSeconds = 30): string {
  return hotp(secret, Math.floor(atMs / 1000 / stepSeconds));
}

/** Vérifie un code en tolérant ±1 pas (décalage d'horloge). Comparaison à temps constant. */
export function verifyTotp(secret: string, code: string, atMs = Date.now(), window = 1): boolean {
  const given = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(given)) return false;
  const counter = Math.floor(atMs / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const expected = hotp(secret, counter + i);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(given))) return true;
  }
  return false;
}

export function otpauthUrl(secret: string, account: string, issuer = 'Inovexa ERP'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
