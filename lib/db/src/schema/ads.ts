import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adStatusEnum = pgEnum("ad_status", ["pending", "active", "expired", "rejected"]);
export const adPackageEnum = pgEnum("ad_package", ["basic", "standard", "premium"]);

export const adsTable = pgTable("ads", {
  id: serial("id").primaryKey(),
  business: text("business").notNull(),
  contact: text("contact").notNull(),
  city: text("city"),
  address: text("address"),
  message: text("message"),
  headline: text("headline"),
  badge: text("badge"),
  cta: text("cta"),
  imageUrl: text("image_url"),
  package: adPackageEnum("package").notNull().default("standard"),
  status: adStatusEnum("status").notNull().default("pending"),
  stripePaymentId: text("stripe_payment_id"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdSchema = createInsertSchema(adsTable).omit({ id: true, createdAt: true });
export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof adsTable.$inferSelect;
