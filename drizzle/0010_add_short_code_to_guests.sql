-- Short, human-friendly code used in SMS URLs so each reminder fits in 1
-- segment. Backfilled by scripts/backfill-short-codes.mjs after migration.
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "short_code" text;
CREATE UNIQUE INDEX IF NOT EXISTS "guests_short_code_unique" ON "guests" ("short_code");
CREATE INDEX IF NOT EXISTS "guests_short_code_idx" ON "guests" ("short_code");
