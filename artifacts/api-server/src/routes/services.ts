import { Router } from "express";
import { db, servicesTable, barbershopsTable, barbersTable } from "@workspace/db";
import { eq, and, isNull, or } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

function formatService(s: any) {
  return { ...s, price: parseFloat(s.price) };
}

router.get("/barbershops/:shopId/services", async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const barberId = req.query.barberId ? parseInt(req.query.barberId as string) : null;
  const services = await db.select().from(servicesTable).where(
    barberId
      ? and(eq(servicesTable.shopId, shopId), or(isNull(servicesTable.barberId), eq(servicesTable.barberId, barberId)))
      : eq(servicesTable.shopId, shopId),
  );
  res.json(services.map(formatService));
});

router.post("/barbershops/:shopId/services", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { name, description, price, durationMinutes, barberId } = req.body;
  if (!name || price == null || durationMinutes == null) {
    res.status(400).json({ error: "name, price, and durationMinutes are required" }); return;
  }
  let serviceBarberId: number | null = null;
  if (barberId) {
    const [barber] = await db.select().from(barbersTable).where(and(eq(barbersTable.id, parseInt(String(barberId))), eq(barbersTable.shopId, shopId)));
    if (!barber) { res.status(404).json({ error: "Barber not found for this shop" }); return; }
    serviceBarberId = barber.id;
  }
  const [service] = await db.insert(servicesTable).values({ shopId, barberId: serviceBarberId, name, description: description ?? null, price: price.toString(), durationMinutes }).returning();
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
  const { name, description, price, durationMinutes, barberId } = req.body;
  const updateData: any = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price != null) updateData.price = price.toString();
  if (durationMinutes != null) updateData.durationMinutes = durationMinutes;
  if (barberId !== undefined) {
    if (barberId === null || barberId === "" || barberId === "shop") {
      updateData.barberId = null;
    } else {
      const [barber] = await db.select().from(barbersTable).where(and(eq(barbersTable.id, parseInt(String(barberId))), eq(barbersTable.shopId, shopId)));
      if (!barber) { res.status(404).json({ error: "Barber not found for this shop" }); return; }
      updateData.barberId = barber.id;
    }
  }
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
