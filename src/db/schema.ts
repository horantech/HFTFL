import { pgTable, text, timestamp, uuid, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const sponsors = pgTable(
  "sponsors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    isIndividual: boolean("is_individual").notNull().default(false),
    paid: boolean("paid").notNull().default(false),
    notes: text("notes"),
    assignedTo: text("assigned_to"),
    bank: text("bank"),
    rsvp: text("rsvp"),
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
    scheduled: text("scheduled"),
    paid: text("paid"),
    notes: text("notes"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    smsSentAt: timestamp("sms_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("guests_sponsor_idx").on(t.sponsorId),
    index("guests_name_idx").on(t.name),
    index("guests_phone_idx").on(t.phone),
    index("guests_ticket_idx").on(t.ticketCode),
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

export type Sponsor = typeof sponsors.$inferSelect;
export type NewSponsor = typeof sponsors.$inferInsert;
export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
