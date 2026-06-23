import { db, usersTable, barbershopsTable, barbersTable, servicesTable, productsTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  const [admin] = await db.insert(usersTable).values({
    name: "Admin User",
    email: "admin@trimkosova.com",
    passwordHash: adminHash,
    role: "admin",
    phone: "+38344000000",
  }).onConflictDoNothing().returning();
  console.log("Admin:", admin?.id ?? "already exists");

  // Owner user
  const ownerHash = await bcrypt.hash("owner123", 10);
  const [owner] = await db.insert(usersTable).values({
    name: "Artan Krasniqi",
    email: "artan@trimkosova.com",
    passwordHash: ownerHash,
    role: "owner",
    phone: "+38344111222",
  }).onConflictDoNothing().returning();

  // Regular user
  const userHash = await bcrypt.hash("user123", 10);
  await db.insert(usersTable).values({
    name: "Besim Gashi",
    email: "besim@gmail.com",
    passwordHash: userHash,
    role: "user",
    phone: "+38344333444",
  }).onConflictDoNothing();

  // Barbershops
  const shops = [
    {
      name: "TRIM Prishtina",
      city: "Prishtina",
      address: "Rr. Bill Clinton Nr. 42",
      description: "Premium barber experience in the heart of Prishtina. Professional cuts, beard trims, and grooming services.",
      phone: "+38344100200",
      imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800",
      latitude: "42.6629",
      longitude: "21.1655",
      openTime: "09:00",
      closeTime: "20:00",
      rating: "4.8",
      totalReviews: 142,
      status: "active" as const,
    },
    {
      name: "Classic Cuts Prizren",
      city: "Prizren",
      address: "Sheshi i Lirisë Nr. 7",
      description: "Traditional barbershop with modern techniques in historic Prizren.",
      phone: "+38344200300",
      imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800",
      latitude: "42.2139",
      longitude: "20.7397",
      openTime: "08:00",
      closeTime: "19:00",
      rating: "4.6",
      totalReviews: 98,
      status: "active" as const,
    },
    {
      name: "Sharp Cuts Peja",
      city: "Peja",
      address: "Rr. Mbretëresha Teutë Nr. 12",
      description: "Modern barbershop offering premium grooming services in Peja.",
      phone: "+38344300400",
      imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800",
      latitude: "42.6596",
      longitude: "20.2889",
      openTime: "09:00",
      closeTime: "19:00",
      rating: "4.5",
      totalReviews: 67,
      status: "active" as const,
    },
    {
      name: "The Barber Lab",
      city: "Prishtina",
      address: "Rr. Nënë Tereza Nr. 15",
      description: "High-end grooming studio with the latest techniques and premium products.",
      phone: "+38344400500",
      imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800",
      latitude: "42.6680",
      longitude: "21.1684",
      openTime: "10:00",
      closeTime: "21:00",
      rating: "4.9",
      totalReviews: 203,
      status: "active" as const,
    },
    {
      name: "Gentlemen's Corner",
      city: "Gjilan",
      address: "Bulevardi i Ri Nr. 5",
      description: "The finest barbershop in Gjilan, offering tailored grooming experiences.",
      phone: "+38344500600",
      imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800",
      latitude: "42.4631",
      longitude: "21.4694",
      openTime: "09:00",
      closeTime: "19:00",
      rating: "4.7",
      totalReviews: 55,
      status: "active" as const,
    },
    {
      name: "BarberKing Ferizaj",
      city: "Ferizaj",
      address: "Rr. Adem Jashari Nr. 3",
      description: "Premium barber services with a loyal customer base in Ferizaj.",
      phone: "+38344600700",
      imageUrl: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=800",
      latitude: "42.3703",
      longitude: "21.1553",
      openTime: "08:30",
      closeTime: "19:30",
      rating: "4.4",
      totalReviews: 44,
      status: "active" as const,
    },
  ];

  const ownerId = owner?.id ?? 1;
  const insertedShops = [];
  for (const shop of shops) {
    const [s] = await db.insert(barbershopsTable).values({
      ...shop,
      ownerId,
      subdomain: shop.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      subscriptionStatus: "active",
    }).onConflictDoNothing().returning();
    if (s) insertedShops.push(s);
  }
  console.log("Shops inserted:", insertedShops.length);

  if (insertedShops.length > 0) {
    const shop = insertedShops[0];

    // Barbers for first shop
    const barberData = [
      { name: "Visar Berisha", bio: "10+ years of experience, specializing in fades and modern cuts", specialties: "Fades, Modern Cuts, Beard Sculpting", avatarUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=200" },
      { name: "Liridon Hoxha", bio: "Expert in classic cuts and beard grooming", specialties: "Classic Cuts, Beard Grooming, Hot Towel Shave", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
      { name: "Faton Kelmendi", bio: "Specialist in skin fades and hair art designs", specialties: "Skin Fades, Hair Art, Color Treatments", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200" },
    ];
    for (const b of barberData) {
      await db.insert(barbersTable).values({ shopId: shop.id, ...b }).onConflictDoNothing();
    }

    // Services
    const serviceData = [
      { name: "Haircut", description: "Classic or modern haircut tailored to your style", price: "8.00", durationMinutes: 30 },
      { name: "Beard Trim", description: "Precision beard shaping and trimming", price: "5.00", durationMinutes: 20 },
      { name: "Haircut + Beard", description: "Full haircut and beard grooming combo", price: "12.00", durationMinutes: 45 },
      { name: "Hot Towel Shave", description: "Luxurious hot towel straight razor shave", price: "10.00", durationMinutes: 40 },
      { name: "Hair Wash + Cut", description: "Shampoo, conditioning, and haircut", price: "10.00", durationMinutes: 40 },
      { name: "Kid's Haircut", description: "Gentle haircut for kids under 12", price: "5.00", durationMinutes: 25 },
      { name: "Hair Color", description: "Professional hair coloring service", price: "25.00", durationMinutes: 90 },
    ];
    for (const s of serviceData) {
      await db.insert(servicesTable).values({ shopId: shop.id, ...s }).onConflictDoNothing();
    }

    // Products
    const productData = [
      { name: "Pomade Strong Hold", description: "Premium strong-hold pomade for all-day style", price: "12.00", stock: 50, category: "Styling", imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400" },
      { name: "Beard Oil Cedar", description: "Nourishing beard oil with cedar and argan", price: "9.00", stock: 30, category: "Beard Care", imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400" },
      { name: "Sea Salt Spray", description: "Texturizing spray for a natural beachy look", price: "11.00", stock: 40, category: "Styling", imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400" },
      { name: "Matte Clay", description: "Medium hold matte finish clay for textured styles", price: "14.00", stock: 25, category: "Styling", imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400" },
      { name: "Shave Cream", description: "Rich lather shaving cream for a smooth shave", price: "8.00", stock: 60, category: "Shaving", imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400" },
      { name: "After Shave Balm", description: "Soothing post-shave balm with aloe vera", price: "10.00", stock: 45, category: "Shaving", imageUrl: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=400" },
    ];
    for (const p of productData) {
      await db.insert(productsTable).values({ shopId: shop.id, ...p }).onConflictDoNothing();
    }
    console.log("Barbers, services, and products seeded for shop:", shop.name);
  }

  console.log("\n=== Seed Complete ===");
  console.log("Accounts:");
  console.log("  Admin:  admin@trimkosova.com / admin123");
  console.log("  Owner:  artan@trimkosova.com / owner123");
  console.log("  User:   besim@gmail.com / user123");
}

seed()
  .then(() => { console.log("Done!"); process.exit(0); })
  .catch(err => { console.error("Seed failed:", err); process.exit(1); });
