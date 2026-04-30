// Alphabet drops visually-confusable characters (0/O, 1/I/l) so a code read
// off a screen onto a phone is unambiguous. 50 chars ^ 4 = 6.25M codes —
// plenty of headroom over a guest list of a few hundred.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";

export function generateShortCode(length = 4): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

// Length 4 is treated as the canonical short code; 36-char UUIDs (with dashes)
// remain valid in `/t/[code]` and `/api/scan` for tickets issued before this
// shortener landed.
export function isShortCode(s: string): boolean {
  return /^[A-Za-z0-9]{4,8}$/.test(s);
}
