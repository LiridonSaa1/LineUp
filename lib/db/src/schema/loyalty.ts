import { pgTable, serial, integer, numeric, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { barbershopsTable } from "./barbershops";

export const loyaltyTransactionTypeEnum = pgEnum("loyalty_transaction_type", [
  "earned",
  "redeemed",
  "expired",
  "adjusted",
]);

// Per-shop loyalty account balance for each user
export const loyaltyAccountsTable = pgTable("loyalty_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  shopId: integer("shop_id").notNull().references(() => barbershopsTable.id, { onDelete: "cascade" }),
  totalPoints: integer("total_points").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Individual transactions (earn/redeem events)
export const loyaltyTransactionsTable = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  shopId: integer("shop_id").notNull().references(() => barbershopsTable.id, { onDelete: "cascade" }),
  points: integer("points").notNull(), // positive = earned, negative = redeemed
  type: loyaltyTransactionTypeEnum("type").notNull(),
  appointmentId: integer("appointment_id"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Shop loyalty program configuration (points per €, redemption rate)
export const loyaltyProgramsTable = pgTable("loyalty_programs", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().references(() => barbershopsTable.id, { onDelete: "cascade" }).unique(),
  pointsPerEuro: integer("points_per_euro").notNull().default(10),   // 10 pts per €1 spent
  pointsToRedeem: integer("points_to_redeem").notNull().default(100), // 100 pts = €1 off
  minPointsRedeem: integer("min_points_redeem").notNull().default(100),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type LoyaltyAccount = typeof loyaltyAccountsTable.$inferSelect;
export type LoyaltyTransaction = typeof loyaltyTransactionsTable.$inferSelect;
export type LoyaltyProgram = typeof loyaltyProgramsTable.$inferSelect;
