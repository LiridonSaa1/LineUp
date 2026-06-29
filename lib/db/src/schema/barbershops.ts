import { pgTable, text, serial, timestamp, pgEnum, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const shopStatusEnum = pgEnum("shop_status", ["pending", "active", "rejected", "suspended"]);
export const shopGenderEnum = pgEnum("shop_gender", ["male", "female", "both"]);

export const barbershopsTable = pgTable("barbershops", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  description: text("description"),
  phone: text("phone"),
  imageUrl: text("image_url"),
  status: shopStatusEnum("status").notNull().default("pending"),
  subdomain: text("subdomain").unique(),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  totalReviews: integer("total_reviews").notNull().default(0),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  openTime: text("open_time"),
  closeTime: text("close_time"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  maxBarbers: integer("max_barbers").notNull().default(2),
  businessNumber: text("business_number"),
  gender: shopGenderEnum("gender"),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  iban: text("iban"),
  photos: text("photos").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBarbershopSchema = createInsertSchema(barbershopsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBarbershop = z.infer<typeof insertBarbershopSchema>;
export type Barbershop = typeof barbershopsTable.$inferSelect;
