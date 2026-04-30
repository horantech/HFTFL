import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = neon(url);
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";

function gen(len = 4) {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

// 1) Ensure column + indexes exist (idempotent — safe to re-run).
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS short_code text`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS guests_short_code_unique ON guests (short_code)`;
await sql`CREATE INDEX IF NOT EXISTS guests_short_code_idx ON guests (short_code)`;

// 2) Backfill rows missing a short code, retrying on collision.
const rows = await sql`SELECT id FROM guests WHERE short_code IS NULL`;
console.log(`Backfilling ${rows.length} guest(s)…`);

let assigned = 0, retries = 0;
for (const r of rows) {
  for (let attempt = 0; attempt < 25; attempt++) {
    const code = gen(4);
    try {
      await sql`UPDATE guests SET short_code = ${code} WHERE id = ${r.id}`;
      assigned++;
      break;
    } catch (err) {
      // unique violation — try a different code
      if (String(err).includes("unique")) { retries++; continue; }
      throw err;
    }
  }
}

console.log(`Done. Assigned: ${assigned}. Retries (collisions): ${retries}.`);
const [{ count }] = await sql`SELECT count(*)::int AS count FROM guests WHERE short_code IS NULL`;
if (count > 0) {
  console.error(`WARNING: ${count} guest(s) still missing short_code`);
  process.exit(1);
}
