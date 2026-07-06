import { pgTable, serial, integer, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { barbershopsTable } from "./barbershops";
import { barbersTable } from "./barbers";
import { servicesTable } from "./services";

export const waitingListStatusEnum = pgEnum("waiting_list_status", [
  "waiting",
  "notified",
  "booked",
  "expired",
]);

export const waitingListTable = pgTable("waiting_list", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  shopId: integer("shop_id").notNull().references(() => barbershopsTable.id, { onDelete: "cascade" }),
  barberId: integer("barber_id").references(() => barbersTable.id, { onDelete: "set null" }),
  serviceId: integer("service_id").references(() => servicesTable.id, { onDelete: "set null" }),
  preferredDate: text("preferred_date").notNull(), // YYYY-MM-DD
  notes: text("notes"),
  status: waitingListStatusEnum("status").notNull().default("waiting"),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type WaitingListEntry = typeof waitingListTable.$inferSelect;
