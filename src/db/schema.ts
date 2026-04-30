import { pgTable, text, timestamp, uuid, boolean, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const sponsors = pgTable(
  "sponsors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    isIndividual: boolean("is_individual").notNull().default(false),
    sponsorType: text("sponsor_type").notNull().default("representative"),
    paid: boolean("paid").notNull().default(false),
    notes: text("notes"),
    assignedTo: text("assigned_to"),
    bank: text("bank"),
    rsvp: text("rsvp"),
    tableNumber: text("table_number"),
    smsSentAt: timestamp("sms_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sponsors_name_idx").on(t.name)],
);

export const guests = pgTable(
  "guests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sponsorId: uuid("sponsor_id")
      .notNull()
      .references(() => sponsors.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    whatsappPhone: text("whatsapp_phone"),
    email: text("email"),
    ticketCode: uuid("ticket_code").notNull().defaultRandom().unique(),
    // 4-char human-friendly code used in SMS URLs to keep messages in 1
    // segment. Resolved alongside ticketCode in /t/[code] and /api/scan.
    shortCode: text("short_code").unique(),
    scheduled: text("scheduled"),
    paid: boolean("paid").notNull().default(false),
    notes: text("notes"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    smsSentAt: timestamp("sms_sent_at", { withTimezone: true }),
    smsLastStatus: text("sms_last_status"),
    smsLastError: text("sms_last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("guests_sponsor_idx").on(t.sponsorId),
    index("guests_name_idx").on(t.name),
    index("guests_phone_idx").on(t.phone),
    index("guests_ticket_idx").on(t.ticketCode),
    index("guests_short_code_idx").on(t.shortCode),
  ],
);

export const sponsorsRelations = relations(sponsors, ({ many }) => ({
  guests: many(guests),
}));

export const guestsRelations = relations(guests, ({ one }) => ({
  sponsor: one(sponsors, {
    fields: [guests.sponsorId],
    references: [sponsors.id],
  }),
}));

export const pledges = pgTable(
  "pledges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phone: text("phone"),
    amount: integer("amount").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pledges_created_idx").on(t.createdAt)],
);

export type Sponsor = typeof sponsors.$inferSelect;
export type NewSponsor = typeof sponsors.$inferInsert;
export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
export type Pledge = typeof pledges.$inferSelect;
export type NewPledge = typeof pledges.$inferInsert;
