import { Router } from "express";
import { db, adsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../lib/auth";

const router = Router();

router.get("/ads", async (_req, res): Promise<void> => {
  const now = new Date();
  const ads = await db
    .select()
    .from(adsTable)
    .where(and(eq(adsTable.status, "active")));

  const active = ads.filter(
    (a) =>
      (!a.startsAt || a.startsAt <= now) &&
      (!a.expiresAt || a.expiresAt >= now),
  );

  res.json(active);
});

router.post("/ads", async (req, res): Promise<void> => {
  const { business, contact, city, address, message, headline, badge, cta, imageUrl, pkg, stripePaymentId } = req.body;
  if (!business || !contact) {
    res.status(400).json({ error: "business and contact are required" });
    return;
  }

  const DURATIONS: Record<string, number> = {
    basic: 7,
    standard: 30,
    premium: 30,
  };
  const days = DURATIONS[pkg] ?? 30;
  const startsAt = new Date();
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const [ad] = await db
    .insert(adsTable)
    .values({
      business,
      contact,
      city: city ?? null,
      address: address ?? null,
      message: message ?? null,
      headline: headline ?? null,
      badge: badge ?? null,
      cta: cta ?? null,
      imageUrl: imageUrl ?? null,
      package: pkg ?? "standard",
      status: "active",
      stripePaymentId: stripePaymentId ?? null,
      startsAt,
      expiresAt,
    })
    .returning();

  res.status(201).json(ad);
});

router.patch("/ads/:id/status", requireAuth, requireRole("admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  if (!["pending", "active", "expired", "rejected"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const [ad] = await db
    .update(adsTable)
    .set({ status })
    .where(eq(adsTable.id, id))
    .returning();
  res.json(ad);
});

export default router;
