CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"ticket_code" uuid DEFAULT gen_random_uuid() NOT NULL,
	"scheduled" text,
	"paid" text,
	"notes" text,
	"checked_in_at" timestamp with time zone,
	"sms_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_ticket_code_unique" UNIQUE("ticket_code")
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact_phone" text,
	"contact_email" text,
	"is_individual" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guests_sponsor_idx" ON "guests" USING btree ("sponsor_id");--> statement-breakpoint
CREATE INDEX "guests_name_idx" ON "guests" USING btree ("name");--> statement-breakpoint
CREATE INDEX "guests_phone_idx" ON "guests" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "guests_ticket_idx" ON "guests" USING btree ("ticket_code");--> statement-breakpoint
CREATE INDEX "sponsors_name_idx" ON "sponsors" USING btree ("name");