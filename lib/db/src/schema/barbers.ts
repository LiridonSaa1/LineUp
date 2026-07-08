import { pgTable, text, serial, timestamp, integer, numeric, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { barbershopsTable } from "./barbershops";
import { usersTable } from "./users";

export const barbersTable = pgTable("barbers", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().references(() => barbershopsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  specialties: text("specialties"),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  userIdUnique: uniqueIndex("barbers_user_id_unique").on(table.userId),
}));

export const insertBarberSchema = createInsertSchema(barbersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBarber = z.infer<typeof insertBarberSchema>;
export type Barber = typeof barbersTable.$inferSelect;
