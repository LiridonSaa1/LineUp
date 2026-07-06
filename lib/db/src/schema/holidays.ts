import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { barbershopsTable } from "./barbershops";
import { barbersTable } from "./barbers";

export const holidaysTable = pgTable("holidays", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().references(() => barbershopsTable.id, { onDelete: "cascade" }),
  barberId: integer("barber_id").references(() => barbersTable.id, { onDelete: "cascade" }), // null = whole shop
  date: text("date").notNull(), // YYYY-MM-DD
  reason: text("reason"),
  isFullDay: boolean("is_full_day").notNull().default(true),
  startTime: text("start_time"), // HH:MM if partial day
  endTime: text("end_time"),   // HH:MM if partial day
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Holiday = typeof holidaysTable.$inferSelect;
