import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Source it from .env.local or your shell.");
  process.exit(1);
}

const sql = neon(url);

const statements = [
  `ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "sms_sent_at" timestamp with time zone`,
  `ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "assigned_to" text`,
  `ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "bank" text`,
  `ALTER TABLE "guests"   ADD COLUMN IF NOT EXISTS "whatsapp_phone" text`,
  `ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "rsvp" text`,
  `ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "table_number" text`,
];

for (const stmt of statements) {
  process.stdout.write(`→ ${stmt} … `);
  try {
    await sql(stmt);
    console.log("ok");
  } catch (e) {
    console.log("FAILED");
    console.error(e);
    process.exit(1);
  }
}

console.log("\nAll columns are present. You can now refresh the app.");
