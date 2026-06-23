import { Router } from "express";
import { db, servicesTable, barbershopsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

function formatService(s: any) {
  return { ...s, price: parseFloat(s.price) };
}

router.get("/barbershops/:shopId/services", async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const services = await db.select().from(servicesTable).where(eq(servicesTable.shopId, shopId));
  res.json(services.map(formatService));
});

router.post("/barbershops/:shopId/services", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { name, description, price, durationMinutes } = req.body;
  if (!name || price == null || durationMinutes == null) {
    res.status(400).json({ error: "name, price, and durationMinutes are required" }); return;
  }
  const [service] = await db.insert(servicesTable).values({ shopId, name, description: description ?? null, price: price.toString(), durationMinutes }).returning();
  res.status(201).json(formatService(service));
});

router.patch("/barbershops/:shopId/services/:serviceId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const serviceId = parseInt(Array.isArray(req.params.serviceId) ? req.params.serviceId[0] : req.params.serviceId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { name, description, price, durationMinutes } = req.body;
  const updateData: any = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price != null) updateData.price = price.toString();
  if (durationMinutes != null) updateData.durationMinutes = durationMinutes;
  const [service] = await db.update(servicesTable).set(updateData).where(and(eq(servicesTable.id, serviceId), eq(servicesTable.shopId, shopId))).returning();
  if (!service) { res.status(404).json({ error: "Service not found" }); return; }
  res.json(formatService(service));
});

router.delete("/barbershops/:shopId/services/:serviceId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const serviceId = parseInt(Array.isArray(req.params.serviceId) ? req.params.serviceId[0] : req.params.serviceId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  await db.delete(servicesTable).where(and(eq(servicesTable.id, serviceId), eq(servicesTable.shopId, shopId)));
  res.sendStatus(204);
});

export default router;
