import { Router } from "express";
import { db, holidaysTable, barbershopsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../lib/auth";

const router = Router();

function p(v: string | string[]): string {
  return Array.isArray(v) ? v[0] : v;
}

// Get holidays for a shop (public — used to block slots in booking)
router.get("/barbershops/:shopId/holidays", async (req, res): Promise<void> => {
  const shopId = parseInt(p(req.params.shopId));
  const { month } = req.query;

  const holidays = await db.select().from(holidaysTable).where(eq(holidaysTable.shopId, shopId));

  const filtered = month
    ? holidays.filter(h => h.date.startsWith(p(month as string)))
    : holidays;

  res.json(filtered);
});

// Create holiday / day-off (owner must own the shop; admin can do any)
router.post(
  "/barbershops/:shopId/holidays",
  requireAuth,
  requireRole("owner", "admin"),
  async (req: AuthRequest, res): Promise<void> => {
    const shopId = parseInt(p(req.params.shopId));
    const { barberId, date, reason, isFullDay, startTime, endTime } = req.body;

    if (!date) { res.status(400).json({ error: "date is required" }); return; }

    const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const [holiday] = await db.insert(holidaysTable).values({
      shopId,
      barberId: barberId ? parseInt(String(barberId)) : null,
      date: String(date),
      reason: reason || null,
      isFullDay: isFullDay !== false,
      startTime: startTime || null,
      endTime: endTime || null,
    }).returning();

    res.status(201).json(holiday);
  }
);

// Delete holiday (owner must own the shop; admin can do any)
router.delete(
  "/barbershops/:shopId/holidays/:holidayId",
  requireAuth,
  requireRole("owner", "admin"),
  async (req: AuthRequest, res): Promise<void> => {
    const shopId = parseInt(p(req.params.shopId));
    const holidayId = parseInt(p(req.params.holidayId));

    const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    await db.delete(holidaysTable).where(
      and(eq(holidaysTable.id, holidayId), eq(holidaysTable.shopId, shopId))
    );
    res.sendStatus(204);
  }
);

export default router;
