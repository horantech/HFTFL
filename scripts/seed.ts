import "dotenv/config";
import { db } from "@/db";
import { sponsors, guests } from "@/db/schema";

async function main() {
  const sample = await db.select().from(sponsors).limit(1);
  if (sample.length > 0) {
    console.log("DB already has data; skipping seed.");
    return;
  }
  const [demo] = await db
    .insert(sponsors)
    .values({
      name: "Demo Co.",
      contactPhone: "+251911000001",
      isIndividual: false,
      notes: "Demo sponsor — feel free to delete.",
    })
    .returning({ id: sponsors.id });
  await db.insert(guests).values([
    { sponsorId: demo.id, name: "Almaz Tesfaye", phone: "+251911000002" },
    { sponsorId: demo.id, name: "Bereket Alemu", phone: "+251911000003" },
  ]);
  console.log("Seeded demo sponsor with 2 guests.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
