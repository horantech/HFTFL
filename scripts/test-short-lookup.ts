import "dotenv/config";
import { db } from "../src/db";
import { guests, sponsors } from "../src/db/schema";
import { eq, or } from "drizzle-orm";

const code = process.argv[2] ?? "HjBf";
const isUuid = /^[0-9a-f-]{36}$/i.test(code);
const where = isUuid
  ? or(eq(guests.ticketCode, code), eq(guests.shortCode, code))
  : eq(guests.shortCode, code);

async function main() {
  const rows = await db
    .select({ id: guests.id, name: guests.name, sponsorName: sponsors.name, shortCode: guests.shortCode })
    .from(guests)
    .innerJoin(sponsors, eq(sponsors.id, guests.sponsorId))
    .where(where)
    .limit(1);
  console.log(`Lookup ${code} (isUuid=${isUuid}) →`, rows);
}
main();
