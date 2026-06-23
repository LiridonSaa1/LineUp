import { Router } from "express";
import { db, barbersTable, barbershopsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

function formatBarber(b: any) {
  return { ...b, rating: b.rating != null ? parseFloat(b.rating) : null };
}

router.get("/barbershops/:shopId/barbers", async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const barbers = await db.select().from(barbersTable).where(eq(barbersTable.shopId, shopId));
  res.json(barbers.map(formatBarber));
});

router.post("/barbershops/:shopId/barbers", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { name, bio, avatarUrl, specialties } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [barber] = await db.insert(barbersTable).values({ shopId, name, bio: bio ?? null, avatarUrl: avatarUrl ?? null, specialties: specialties ?? null }).returning();
  res.status(201).json(formatBarber(barber));
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
  const { name, bio, avatarUrl, specialties, isActive } = req.body;
  const updateData: any = {};
  if (name) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  if (specialties !== undefined) updateData.specialties = specialties;
  if (isActive !== undefined) updateData.isActive = isActive;
  const [barber] = await db.update(barbersTable).set(updateData).where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId))).returning();
  if (!barber) { res.status(404).json({ error: "Barber not found" }); return; }
  res.json(formatBarber(barber));
});

router.delete("/barbershops/:shopId/barbers/:barberId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const barberId = parseInt(Array.isArray(req.params.barberId) ? req.params.barberId[0] : req.params.barberId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  await db.delete(barbersTable).where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId)));
  res.sendStatus(204);
});

export default router;
