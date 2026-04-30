-- Track the outcome of the most recent SMS reminder attempt per guest, so
-- staff can see at a glance which guests' phones failed (no service, opt-out,
-- bad number) without scrubbing logs.
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "sms_last_status" text;
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "sms_last_error" text;
