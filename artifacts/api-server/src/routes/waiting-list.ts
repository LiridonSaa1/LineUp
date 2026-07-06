import { Router } from "express";
import { db, waitingListTable, barbershopsTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../lib/auth";

const router = Router();

function p(v: string | string[]): string {
  return Array.isArray(v) ? v[0] : v;
}

// Get waiting list entries (user sees own; owner/admin sees their shop's)
router.get("/waiting-list", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { shopId } = req.query;
  const conditions: ReturnType<typeof eq>[] = [];

  if (req.user!.role === "user") {
    conditions.push(eq(waitingListTable.userId, req.user!.id));
  } else if (shopId) {
    // Owner: verify they own this shop before listing
    if (req.user!.role === "owner") {
      const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, parseInt(p(shopId as string))));
      if (!shop || shop.ownerId !== req.user!.id) {
        res.status(403).json({ error: "Forbidden" }); return;
      }
    }
    conditions.push(eq(waitingListTable.shopId, parseInt(p(shopId as string))));
  }

  const entries = await db.select().from(waitingListTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(waitingListTable.createdAt));

  res.json(entries);
});

// Join waiting list (any authenticated user)
router.post("/waiting-list", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { shopId, barberId, serviceId, preferredDate, notes } = req.body;
  if (!shopId || !preferredDate) {
    res.status(400).json({ error: "shopId and preferredDate are required" }); return;
  }

  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, parseInt(shopId)));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }

  const [entry] = await db.insert(waitingListTable).values({
    userId: req.user!.id,
    shopId: parseInt(shopId),
    barberId: barberId ? parseInt(barberId) : null,
    serviceId: serviceId ? parseInt(serviceId) : null,
    preferredDate: String(preferredDate),
    notes: notes || null,
    status: "waiting",
  }).returning();

  res.status(201).json(entry);
});

// Remove from waiting list
router.delete("/waiting-list/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(p(req.params.id));
  const [entry] = await db.select().from(waitingListTable).where(eq(waitingListTable.id, id));
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }

  // Users can only delete their own entries
  if (req.user!.role === "user" && entry.userId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  // Owners can only delete entries from their own shop
  if (req.user!.role === "owner") {
    const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, entry.shopId));
    if (!shop || shop.ownerId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" }); return;
    }
  }

  await db.delete(waitingListTable).where(eq(waitingListTable.id, id));
  res.sendStatus(204);
});

// Notify waiting list users that a slot opened (owner/admin only, shop must be theirs)
router.post(
  "/waiting-list/notify",
  requireAuth,
  requireRole("owner", "admin"),
  async (req: AuthRequest, res): Promise<void> => {
    const { shopId, preferredDate } = req.body;
    if (!shopId || !preferredDate) {
      res.status(400).json({ error: "shopId and preferredDate are required" }); return;
    }

    // Owners must own the shop
    if (req.user!.role === "owner") {
      const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, parseInt(shopId)));
      if (!shop || shop.ownerId !== req.user!.id) {
        res.status(403).json({ error: "Forbidden" }); return;
      }
    }

    const waiting = await db.select().from(waitingListTable).where(
      and(
        eq(waitingListTable.shopId, parseInt(shopId)),
        eq(waitingListTable.preferredDate, String(preferredDate)),
        eq(waitingListTable.status, "waiting"),
      )
    );

    for (const entry of waiting) {
      await db.insert(notificationsTable).values({
        userId: entry.userId,
        title: "Vend i liruar!",
        message: `Një vend u lirua për datën ${preferredDate}. Rezervoni shpejt!`,
        type: "general",
        relatedId: entry.shopId,
        relatedType: "barbershop",
      });
      await db.update(waitingListTable)
        .set({ status: "notified", notifiedAt: new Date() })
        .where(eq(waitingListTable.id, entry.id));
    }

    res.json({ notified: waiting.length });
  }
);

export default router;
