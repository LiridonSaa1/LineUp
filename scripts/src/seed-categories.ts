import { db, categoriesTable } from "@workspace/db";

export const DEFAULT_CATEGORIES = [
  { id: 1, name: "Të gjitha", iconName: "Grid", slug: "all", displayOrder: 1 },
  { id: 2, name: "Haircut & Styling", iconName: "Scissors", slug: "haircut-styling", displayOrder: 2 },
  { id: 3, name: "Hair Coloring", iconName: "Sparkles", slug: "hair-coloring", displayOrder: 3 },
  { id: 4, name: "Hair Treatment", iconName: "Zap", slug: "hair-treatment", displayOrder: 4 },
  { id: 5, name: "Beard & Grooming", iconName: "User", slug: "beard-grooming", displayOrder: 5 },
  { id: 6, name: "Nails", iconName: "Hand", slug: "nails", displayOrder: 6 },
  { id: 7, name: "Makeup", iconName: "Smile", slug: "makeup", displayOrder: 7 },
  { id: 8, name: "Brows & Lashes", iconName: "Eye", slug: "brows-lashes", displayOrder: 8 },
  { id: 9, name: "Skin Care", iconName: "Shield", slug: "skin-care", displayOrder: 9 },
  { id: 10, name: "Body Care", iconName: "Waves", slug: "body-care", displayOrder: 10 }
];

async function seedCategories() {
  console.log("Seeding default categories into Supabase service_categories table...");

  try {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.insert(categoriesTable).values(cat).onConflictDoNothing();
    }
    console.log("Successfully seeded default categories into Supabase!");
  } catch (err) {
    console.error("Seeding categories error:", err);
  }
}

seedCategories();
