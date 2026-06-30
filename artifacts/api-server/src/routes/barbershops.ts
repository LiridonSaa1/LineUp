import { Router } from "express";
import { db, barbershopsTable, barbersTable, usersTable } from "@workspace/db";
import { eq, ilike, and, desc, sql, or } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../lib/auth";

const router = Router();

function formatShop(shop: any) {
  return {
    ...shop,
    rating: shop.rating != null ? parseFloat(shop.rating) : null,
    latitude: shop.latitude != null ? parseFloat(shop.latitude) : null,
    longitude: shop.longitude != null ? parseFloat(shop.longitude) : null,
  };
}

router.get("/barbershops/city-stats", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      city: barbershopsTable.city,
      shopCount: sql<number>`count(distinct ${barbershopsTable.id})::int`,
      barberCount: sql<number>`count(${barbersTable.id})::int`,
    })
    .from(barbershopsTable)
    .leftJoin(
      barbersTable,
      and(eq(barbersTable.shopId, barbershopsTable.id), eq(barbersTable.isActive, true))
    )
    .where(eq(barbershopsTable.status, "active"))
    .groupBy(barbershopsTable.city)
    .orderBy(sql`count(${barbersTable.id}) desc`);

  res.json(rows);
});

router.get("/barbershops", async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const city = req.query.city as string | undefined;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const conditions = [];
  if (city) conditions.push(eq(barbershopsTable.city, city));
  if (status) conditions.push(eq(barbershopsTable.status, status as any));
  else conditions.push(eq(barbershopsTable.status, "active"));
  if (search) conditions.push(ilike(barbershopsTable.name, `%${search}%`));

  const shops = await db.select().from(barbershopsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(barbershopsTable.createdAt))
    .limit(limit).offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(barbershopsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json({ data: shops.map(formatShop), total: count });
});

router.get("/barbershops/top", async (req, res): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 6;
  const city = req.query.city as string | undefined;
  const cond = city
    ? and(eq(barbershopsTable.status, "active"), eq(barbershopsTable.city, city))
    : eq(barbershopsTable.status, "active");

  const shops = await db.select().from(barbershopsTable)
    .where(cond)
    .orderBy(desc(barbershopsTable.rating))
    .limit(limit);
  res.json(shops.map(formatShop));
});

router.post("/barbershops", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { name, city, address, description, phone, imageUrl, latitude, longitude, openTime, closeTime, businessNumber, gender, stripeConnectAccountId, iban, photos } = req.body;
  if (!name || !city || !address) {
    res.status(400).json({ error: "name, city, and address are required" }); return;
  }
  const subdomain = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const [shop] = await db.insert(barbershopsTable).values({
    ownerId: req.user!.id,
    name, city, address,
    description: description ?? null,
    phone: phone ?? null,
    imageUrl: imageUrl ?? null,
    latitude: latitude?.toString() ?? null,
    longitude: longitude?.toString() ?? null,
    openTime: openTime ?? null,
    closeTime: closeTime ?? null,
    subdomain,
    status: "pending",
    businessNumber: businessNumber ?? null,
    gender: gender ?? null,
    stripeConnectAccountId: stripeConnectAccountId ?? null,
    iban: iban ?? null,
    photos: Array.isArray(photos) ? photos : null,
  }).returning();
  res.status(201).json(formatShop(shop));
});

router.get("/barbershops/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, id));
  if (!shop) { res.status(404).json({ error: "Barbershop not found" }); return; }
  res.json(formatShop(shop));
});

router.patch("/barbershops/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, id));
  if (!shop) { res.status(404).json({ error: "Not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { name, city, address, description, phone, imageUrl, latitude, longitude, openTime, closeTime, status } = req.body;
  const updateData: any = {};
  if (name) updateData.name = name;
  if (city) updateData.city = city;
  if (address) updateData.address = address;
  if (description !== undefined) updateData.description = description;
  if (phone !== undefined) updateData.phone = phone;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (latitude !== undefined) updateData.latitude = latitude?.toString();
  if (longitude !== undefined) updateData.longitude = longitude?.toString();
  if (openTime !== undefined) updateData.openTime = openTime;
  if (closeTime !== undefined) updateData.closeTime = closeTime;
  if (status && req.user!.role === "admin") updateData.status = status;

  const [updated] = await db.update(barbershopsTable).set(updateData).where(eq(barbershopsTable.id, id)).returning();
  res.json(formatShop(updated));
});

router.delete("/barbershops/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  await db.delete(barbershopsTable).where(eq(barbershopsTable.id, id));
  res.sendStatus(204);
});

router.patch("/barbershops/:id/approve", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [shop] = await db.update(barbershopsTable).set({ status: "active" }).where(eq(barbershopsTable.id, id)).returning();
  if (!shop) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatShop(shop));
});

router.patch("/barbershops/:id/reject", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [shop] = await db.update(barbershopsTable).set({ status: "rejected" }).where(eq(barbershopsTable.id, id)).returning();
  if (!shop) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatShop(shop));
});

export default router;
