import { db, usersTable, barbershopsTable, barbersTable, servicesTable, productsTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const adminHash = await bcrypt.hash("admin123", 10);
  const [admin] = await db.insert(usersTable).values({
    name: "Admin User",
    email: "admin@lineup.com",
    passwordHash: adminHash,
    role: "admin",
    phone: "+38344000000",
  }).onConflictDoNothing().returning();
  console.log("Admin:", admin?.id ?? "already exists");

  const ownerHash = await bcrypt.hash("owner123", 10);
  const [owner] = await db.insert(usersTable).values({
    name: "Artan Krasniqi",
    email: "artan@lineup.com",
    passwordHash: ownerHash,
    role: "owner",
    phone: "+38344111222",
  }).onConflictDoNothing().returning();

  const userHash = await bcrypt.hash("user123", 10);
  await db.insert(usersTable).values({
    name: "Besim Gashi",
    email: "besim@gmail.com",
    passwordHash: userHash,
    role: "user",
    phone: "+38344333444",
  }).onConflictDoNothing();

  const shops = [
    {
      name: "The Barber Lab",
      city: "Prishtina",
      address: "Rr. Nënë Tereza Nr. 15",
      description: "High-end grooming studio me teknikat më të fundit dhe produktet premium. Eksperienca #1 në Prishtinë.",
      phone: "+38344400500",
      imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800",
      latitude: "42.6680",
      longitude: "21.1684",
      openTime: "09:00",
      closeTime: "21:00",
      rating: "4.9",
      totalReviews: 203,
      status: "active" as const,
      barbers: [
        { name: "Visar Berisha", bio: "Master barber me 12 vjet përvojë, specialist në fades dhe prerje moderne", specialties: "Fades, Modern Cuts, Beard Sculpting", avatarUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200" },
        { name: "Liridon Hoxha", bio: "Ekspert në prerje klasike dhe rregullim mjekre, hot towel specialist", specialties: "Classic Cuts, Beard Grooming, Hot Towel Shave", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
        { name: "Faton Kelmendi", bio: "Specialist në skin fades dhe hair art designs", specialties: "Skin Fades, Hair Art, Color Treatments", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200" },
      ],
      services: [
        { name: "Haircut Premium", description: "Prerje flokësh me konsultë stilisti dhe finishim profesional", price: "12.00", durationMinutes: 45 },
        { name: "Beard Sculpting", description: "Formim dhe skulpturim mjekre me brisk", price: "8.00", durationMinutes: 30 },
        { name: "Haircut + Beard Combo", description: "Paketa e plotë — prerje + mjekra", price: "18.00", durationMinutes: 60 },
        { name: "Hot Towel Shave", description: "Rrojë luksoze me peshqir të nxehtë dhe brisk", price: "15.00", durationMinutes: 45 },
        { name: "Hair Color", description: "Ngjyrosje profesionale e flokëve", price: "30.00", durationMinutes: 90 },
        { name: "Kid's Cut", description: "Prerje e butë për fëmijë deri në 12 vjeç", price: "6.00", durationMinutes: 25 },
      ],
    },
    {
      name: "LineUp Prishtina",
      city: "Prishtina",
      address: "Rr. Bill Clinton Nr. 42",
      description: "Premium barber experience në zemër të Prishtinës. Prerje profesionale, rregullim mjekre dhe shërbime grooming.",
      phone: "+38344100200",
      imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800",
      latitude: "42.6629",
      longitude: "21.1655",
      openTime: "09:00",
      closeTime: "20:00",
      rating: "4.8",
      totalReviews: 142,
      status: "active" as const,
      barbers: [
        { name: "Artan Krasniqi", bio: "Pronar dhe master barber, 15 vjet në industri", specialties: "Fades, Classic Cuts, Beard Grooming", avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200" },
        { name: "Blerim Morina", bio: "Specialist në prerje moderne dhe line-up", specialties: "Modern Cuts, Line Up, Fades", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
      ],
      services: [
        { name: "Haircut", description: "Prerje klasike ose moderne sipas stilit tuaj", price: "8.00", durationMinutes: 30 },
        { name: "Beard Trim", description: "Rregullim preciz i mjekres", price: "5.00", durationMinutes: 20 },
        { name: "Haircut + Beard", description: "Paketa e plotë prerje dhe mjekra", price: "12.00", durationMinutes: 45 },
        { name: "Hot Towel Shave", description: "Rrojë luksoze me peshqir të nxehtë", price: "10.00", durationMinutes: 40 },
        { name: "Hair Wash + Cut", description: "Larje, kondicionim dhe prerje", price: "10.00", durationMinutes: 40 },
        { name: "Kid's Haircut", description: "Prerje e butë për fëmijë", price: "5.00", durationMinutes: 25 },
      ],
    },
    {
      name: "Gentlemen's Corner",
      city: "Prishtina",
      address: "Rr. Agim Ramadani Nr. 22",
      description: "Eksperienca më e mirë grooming për burrat modernt. Ambiente premium, shërbim 5 yje.",
      phone: "+38344500600",
      imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800",
      latitude: "42.4631",
      longitude: "21.4694",
      openTime: "09:00",
      closeTime: "19:00",
      rating: "4.7",
      totalReviews: 88,
      status: "active" as const,
      barbers: [
        { name: "Granit Sylaj", bio: "Barber specialist me trajnim ndërkombëtar, ekspert fade", specialties: "Fades, Skin Fades, Beard Design", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" },
        { name: "Mentor Gashi", bio: "Classic barbering enthusiast me passion për hot towel", specialties: "Classic Shave, Beard Grooming, Razor Work", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200" },
      ],
      services: [
        { name: "Premium Haircut", description: "Prerje premium me konsultë dhe finishim", price: "10.00", durationMinutes: 35 },
        { name: "Beard Design", description: "Dizajn dhe skulpturim mjekre", price: "8.00", durationMinutes: 30 },
        { name: "Full Grooming", description: "Paketa e plotë grooming — prerje + mjekra + lavazh", price: "20.00", durationMinutes: 75 },
        { name: "Classic Shave", description: "Rrojë klasike me sapun dhe brisk", price: "12.00", durationMinutes: 40 },
      ],
    },
    {
      name: "Classic Cuts Prizren",
      city: "Prizren",
      address: "Sheshi i Lirisë Nr. 7",
      description: "Berbernicë tradicionale me teknika moderne në Prizrenin historik. Familja dhe tradita e mirëpret.",
      phone: "+38344200300",
      imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800",
      latitude: "42.2139",
      longitude: "20.7397",
      openTime: "08:00",
      closeTime: "19:00",
      rating: "4.6",
      totalReviews: 98,
      status: "active" as const,
      barbers: [
        { name: "Shkumbin Berisha", bio: "Barber me traditë familjare, 20 vjet përvojë", specialties: "Classic Cuts, Traditional Shave, Beard Grooming", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200" },
        { name: "Driton Krasniqi", bio: "Specialist i prerjes moderne dhe fades", specialties: "Fades, Modern Cuts, Line Up", avatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200" },
      ],
      services: [
        { name: "Haircut", description: "Prerje klasike tradicionale", price: "6.00", durationMinutes: 30 },
        { name: "Beard Trim", description: "Rregullim dhe formim mjekre", price: "4.00", durationMinutes: 20 },
        { name: "Haircut + Beard", description: "Paketa komplete", price: "9.00", durationMinutes: 45 },
        { name: "Traditional Shave", description: "Rrojë tradicionale me krem dhe brisk", price: "7.00", durationMinutes: 35 },
        { name: "Kid's Cut", description: "Prerje për fëmijë", price: "4.00", durationMinutes: 20 },
      ],
    },
    {
      name: "Sharp Cuts Peja",
      city: "Peja",
      address: "Rr. Mbretëresha Teutë Nr. 12",
      description: "Berbernicë moderne me shërbime premium grooming në Pejë. Ambienti i rehatshëm dhe stafi profesional.",
      phone: "+38344300400",
      imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800",
      latitude: "42.6596",
      longitude: "20.2889",
      openTime: "09:00",
      closeTime: "19:00",
      rating: "4.5",
      totalReviews: 67,
      status: "active" as const,
      barbers: [
        { name: "Agon Berisha", bio: "Barber kreativ me specializim në modern cuts dhe hair art", specialties: "Modern Cuts, Hair Art, Fades", avatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200" },
        { name: "Hekuran Morina", bio: "Ekspert në beard grooming dhe hot towel shave", specialties: "Beard Grooming, Hot Towel, Classic Shave", avatarUrl: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=200" },
      ],
      services: [
        { name: "Haircut", description: "Prerje profesionale flokësh", price: "7.00", durationMinutes: 30 },
        { name: "Fade", description: "Fade profesional me finishim të pastër", price: "8.00", durationMinutes: 35 },
        { name: "Beard Trim", description: "Rregullim mjekre", price: "5.00", durationMinutes: 20 },
        { name: "Combo Deal", description: "Haircut + Beard combo", price: "11.00", durationMinutes: 45 },
        { name: "Hot Towel Shave", description: "Rrojë luksoze", price: "9.00", durationMinutes: 35 },
      ],
    },
    {
      name: "BarberKing Ferizaj",
      city: "Ferizaj",
      address: "Rr. Adem Jashari Nr. 3",
      description: "Shërbime premium me bazë besnikërie klientësh në Ferizaj. Cilësia e lartë me çmime të arsyeshme.",
      phone: "+38344600700",
      imageUrl: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=800",
      latitude: "42.3703",
      longitude: "21.1553",
      openTime: "08:30",
      closeTime: "19:30",
      rating: "4.4",
      totalReviews: 44,
      status: "active" as const,
      barbers: [
        { name: "Kushtrim Aliu", bio: "Barber i ri me energji dhe passion për stilet moderne", specialties: "Modern Cuts, Fades, Beard Styling", avatarUrl: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=200" },
      ],
      services: [
        { name: "Haircut", description: "Prerje flokësh cilësore", price: "6.00", durationMinutes: 30 },
        { name: "Beard Trim", description: "Rregullim mjekre", price: "4.00", durationMinutes: 20 },
        { name: "Haircut + Beard", description: "Paketa e plotë", price: "9.00", durationMinutes: 45 },
        { name: "Kid's Cut", description: "Prerje për fëmijë", price: "4.00", durationMinutes: 20 },
      ],
    },
  ];

  const ownerId = owner?.id ?? 1;
  let totalShops = 0;

  for (const shopData of shops) {
    const { barbers, services, ...shopFields } = shopData;
    const [shop] = await db.insert(barbershopsTable).values({
      ...shopFields,
      ownerId,
      subdomain: shopFields.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      subscriptionStatus: "active",
    }).onConflictDoNothing().returning();

    if (!shop) continue;
    totalShops++;

    for (const b of barbers) {
      await db.insert(barbersTable).values({ shopId: shop.id, ...b }).onConflictDoNothing();
    }
    for (const s of services) {
      await db.insert(servicesTable).values({ shopId: shop.id, ...s }).onConflictDoNothing();
    }
  }

  console.log("Shops seeded:", totalShops);

  // Products (from first shop)
  const firstShop = await db.query.barbershopsTable.findFirst();
  if (firstShop) {
    const products = [
      { name: "Pomade Strong Hold", description: "Premium pomade për stil gjatë gjithë ditës", price: "12.00", stock: 50, category: "Styling", imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400" },
      { name: "Beard Oil Cedar", description: "Vaj mjekre me dëllinjë dhe argan", price: "9.00", stock: 30, category: "Beard Care", imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400" },
      { name: "Sea Salt Spray", description: "Spray teksturizues për pamje natyrale", price: "11.00", stock: 40, category: "Styling", imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400" },
      { name: "Matte Clay", description: "Argjilë me mbajtje mesatare dhe finish mat", price: "14.00", stock: 25, category: "Styling", imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400" },
      { name: "Shave Cream", description: "Krem rroje i pasur për rrojë të lëmuar", price: "8.00", stock: 60, category: "Shaving", imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400" },
      { name: "After Shave Balm", description: "Balzam qetësues pas-rroje me aloe vera", price: "10.00", stock: 45, category: "Shaving", imageUrl: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=400" },
    ];
    for (const p of products) {
      await db.insert(productsTable).values({ shopId: firstShop.id, ...p }).onConflictDoNothing();
    }
    console.log("Products seeded for:", firstShop.name);
  }

  console.log("\n=== Seed Complete ===");
  console.log("Accounts:");
  console.log("  Admin:  admin@lineup.com / admin123");
  console.log("  Owner:  artan@lineup.com / owner123");
  console.log("  User:   besim@gmail.com / user123");
}

seed()
  .then(() => { console.log("Done!"); process.exit(0); })
  .catch(err => { console.error("Seed failed:", err); process.exit(1); });
