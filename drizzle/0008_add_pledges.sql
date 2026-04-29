CREATE TABLE IF NOT EXISTS "pledges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "phone" text,
  "amount" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "pledges_created_idx" ON "pledges" USING btree ("created_at");
