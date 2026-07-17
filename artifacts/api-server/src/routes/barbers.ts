import { Router } from "express";
import { db, barbersTable, barbershopsTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { hashPassword, requireAuth, type AuthRequest } from "../lib/auth";
import { geocodeMissingShops } from "../lib/geocode";

const router = Router();

function formatBarber(b: any) {
  return { ...b, rating: b.rating != null ? parseFloat(b.rating) : null };
}

function formatShop(shop: any) {
  return {
    ...shop,
    rating: shop.rating != null ? parseFloat(shop.rating) : null,
    latitude: shop.latitude != null ? parseFloat(shop.latitude) : null,
    longitude: shop.longitude != null ? parseFloat(shop.longitude) : null,
  };
}

router.get("/barbers", async (_req, res): Promise<void> => {
  const rows = await db.select({
    barber: barbersTable,
    shop: barbershopsTable,
  })
    .from(barbersTable)
    .innerJoin(barbershopsTable, eq(barbersTable.shopId, barbershopsTable.id))
    .where(and(eq(barbersTable.isActive, true), eq(barbershopsTable.status, "active"), eq(barbershopsTable.subscriptionStatus, "active")))
    .orderBy(desc(barbersTable.rating), desc(barbersTable.createdAt));

  const result = rows.map((row) => ({
    ...formatBarber(row.barber),
    shop: formatShop(row.shop),
  }));

  // Geocode any shops missing coordinates in the background; DB is updated for next request
  geocodeMissingShops(result.map(r => r.shop));

  res.json(result);
});

router.get("/barbershops/:shopId/barbers", async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const rows = await db
    .select({ barber: barbersTable, user: usersTable })
    .from(barbersTable)
    .leftJoin(usersTable, eq((barbersTable as any).userId, usersTable.id))
    .where(eq(barbersTable.shopId, shopId));
  res.json(rows.map((row) => ({
    ...formatBarber(row.barber),
    user: row.user ? { id: row.user.id, email: row.user.email, role: row.user.role } : null,
  })));
});

router.post("/barbershops/:shopId/barbers", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (req.user!.role !== "admin" && shop.subscriptionStatus !== "active") {
    res.status(402).json({ error: "Duhet te keni abonim aktiv per te shtuar barber." }); return;
  }
  const { firstName, lastName, name, email, password, bio, avatarUrl, specialties } = req.body;
  const fullName = name ?? [firstName, lastName].filter(Boolean).join(" ").trim();
  if (!fullName || !email || !password) {
    res.status(400).json({ error: "firstName, lastName, email, and password are required" }); return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" }); return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(barbersTable)
    .where(eq(barbersTable.shopId, shopId));
  if (count >= shop.maxBarbers) {
    res.status(400).json({ error: `Paketa juaj lejon maksimum ${shop.maxBarbers} barberë.` }); return;
  }

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingUser) {
    res.status(400).json({ error: "Ky email është i regjistruar tashmë" }); return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name: fullName,
    email,
    passwordHash,
    role: "barber",
    avatarUrl: avatarUrl ?? null,
  }).returning();

  try {
    const [barber] = await db.insert(barbersTable).values({
      shopId,
      userId: user.id,
      name: fullName,
      bio: bio ?? null,
      avatarUrl: avatarUrl ?? null,
      specialties: specialties ?? null,
    } as any).returning();
    res.status(201).json({
      ...formatBarber(barber),
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    await db.delete(usersTable).where(eq(usersTable.id, user.id));
    throw err;
  }
});

router.get("/barbershops/:shopId/barbers/:barberId", async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const barberId = parseInt(Array.isArray(req.params.barberId) ? req.params.barberId[0] : req.params.barberId);
  const [barber] = await db.select().from(barbersTable).where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId)));
  if (!barber) { res.status(404).json({ error: "Barber not found" }); return; }
  res.json(formatBarber(barber));
});

router.patch("/barbershops/:shopId/barbers/:barberId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const barberId = parseInt(Array.isArray(req.params.barberId) ? req.params.barberId[0] : req.params.barberId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { name, bio, avatarUrl, specialties, isActive, weeklySchedule } = req.body;
  const updateData: any = {};
  if (name) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  if (specialties !== undefined) updateData.specialties = specialties;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (weeklySchedule !== undefined) updateData.weeklySchedule = weeklySchedule;
  const [barber] = await db.update(barbersTable).set(updateData).where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId))).returning();
  if (!barber) { res.status(404).json({ error: "Barber not found" }); return; }
  res.json(formatBarber(barber));
});

router.post("/barbershops/:shopId/barbers/:barberId/user", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const barberId = parseInt(Array.isArray(req.params.barberId) ? req.params.barberId[0] : req.params.barberId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (req.user!.role !== "admin" && shop.subscriptionStatus !== "active") {
    res.status(402).json({ error: "Duhet te keni abonim aktiv per te krijuar llogari per barber." }); return;
  }

  const [barber] = await db.select().from(barbersTable).where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId)));
  if (!barber) { res.status(404).json({ error: "Barber not found" }); return; }
  if ((barber as any).userId) { res.status(400).json({ error: "Ky barber tashmë ka llogari user." }); return; }

  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: "email and password are required" }); return; }
  if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters" }); return; }

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingUser) { res.status(400).json({ error: "Ky email është i regjistruar tashmë" }); return; }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name: barber.name,
    email,
    passwordHash,
    role: "barber",
    avatarUrl: barber.avatarUrl ?? null,
  }).returning();

  const [updatedBarber] = await db.update(barbersTable)
    .set({ userId: user.id } as any)
    .where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId)))
    .returning();

  res.status(201).json({
    ...formatBarber(updatedBarber),
    user: { id: user.id, email: user.email, role: user.role },
  });
});

router.delete("/barbershops/:shopId/barbers/:barberId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const barberId = parseInt(Array.isArray(req.params.barberId) ? req.params.barberId[0] : req.params.barberId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const [barber] = await db.select().from(barbersTable).where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId)));
  await db.delete(barbersTable).where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId)));
  if ((barber as any)?.userId) {
    await db.delete(usersTable).where(eq(usersTable.id, (barber as any).userId));
  }
  res.sendStatus(204);
});

export default router;
