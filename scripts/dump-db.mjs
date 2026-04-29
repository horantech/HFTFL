import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(url);

const sponsors = await sql`
  SELECT id, name, contact_phone, is_individual, sponsor_type, paid,
         assigned_to, table_number, created_at, notes
  FROM sponsors
  ORDER BY COALESCE(table_number, ''), name
`;

const guests = await sql`
  SELECT g.id, g.sponsor_id, g.name, g.phone, g.paid, g.checked_in_at, g.created_at,
         s.name AS sponsor_name
  FROM guests g
  JOIN sponsors s ON s.id = g.sponsor_id
  ORDER BY COALESCE(s.table_number, ''), s.name, g.created_at
`;

const guestsBySponsor = new Map();
for (const g of guests) {
  if (!guestsBySponsor.has(g.sponsor_id)) guestsBySponsor.set(g.sponsor_id, []);
  guestsBySponsor.get(g.sponsor_id).push(g);
}

console.log(`SPONSORS: ${sponsors.length}    GUESTS: ${guests.length}\n`);
console.log("=".repeat(100));

for (const s of sponsors) {
  const gs = guestsBySponsor.get(s.id) || [];
  const tbl = s.table_number ? `T${s.table_number}` : "—";
  const type = s.is_individual ? "ind" : s.sponsor_type;
  const paid = s.paid ? "PAID" : "unpaid";
  console.log(
    `\n[${tbl.padEnd(4)}] ${s.name}    (${type}, ${paid}, assigned=${s.assigned_to ?? "—"})`,
  );
  if (s.notes) console.log(`       notes: ${s.notes}`);
  if (gs.length === 0) {
    console.log("       (no guests)");
  } else {
    for (const g of gs) {
      const phone = g.phone ?? "—";
      const inb = g.checked_in_at ? "✓in" : "   ";
      const gp = g.paid ? "$" : " ";
      console.log(`       ${gp}${inb}  ${g.name.padEnd(30)} ${phone}`);
    }
  }
}
console.log("\n" + "=".repeat(100));
