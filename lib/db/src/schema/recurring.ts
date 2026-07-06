import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { barbershopsTable } from "./barbershops";
import { barbersTable } from "./barbers";
import { servicesTable } from "./services";

export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "weekly",
  "biweekly",
  "monthly",
]);

export const recurringRulesTable = pgTable("recurring_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  shopId: integer("shop_id").notNull().references(() => barbershopsTable.id, { onDelete: "cascade" }),
  barberId: integer("barber_id").notNull().references(() => barbersTable.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").notNull().references(() => servicesTable.id, { onDelete: "cascade" }),
  frequency: recurringFrequencyEnum("frequency").notNull(),
  preferredTime: text("preferred_time").notNull(), // HH:MM
  startDate: text("start_date").notNull(),         // YYYY-MM-DD
  endDate: text("end_date"),                       // YYYY-MM-DD or null
  isActive: integer("is_active").notNull().default(1),
  lastGeneratedDate: text("last_generated_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type RecurringRule = typeof recurringRulesTable.$inferSelect;
