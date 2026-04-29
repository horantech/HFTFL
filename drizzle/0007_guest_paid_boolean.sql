-- Convert guests.paid from text (unused, leftover from import) to boolean.
ALTER TABLE "guests" DROP COLUMN IF EXISTS "paid";
ALTER TABLE "guests" ADD COLUMN "paid" boolean NOT NULL DEFAULT false;
