import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull(),
  iconName: text("icon_name").notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
