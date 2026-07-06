import { Router } from "express";
import { db, couponsTable, couponUsagesTable, barbershopsTable } from "@workspace/db";
import { eq, and, or, isNull } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../lib/auth";

const router = Router();

function p(v: string | string[]): string {
  return Array.isArray(v) ? v[0] : v;
}

async function assertShopOwner(req: AuthRequest, shopId: number, res: any): Promise<boolean> {
  if (req.user!.role === "admin") return true;
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop || shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return false;
  }
  return true;
}

// List coupons for a shop (owner must own the shop; admin sees any shopId)
router.get("/coupons", requireAuth, requireRole("owner", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const { shopId } = req.query;

  if (!shopId) {
    if (req.user!.role !== "admin") {
      res.status(400).json({ error: "shopId is required" }); return;
    }
    const all = await db.select().from(couponsTable).orderBy(couponsTable.createdAt);
    res.json(all.map(formatCoupon)); return;
  }

  const sid = parseInt(p(shopId as string));
  if (!(await assertShopOwner(req, sid, res))) return;

  const list = await db.select().from(couponsTable)
    .where(eq(couponsTable.shopId, sid))
    .orderBy(couponsTable.createdAt);

  res.json(list.map(formatCoupon));
});

function formatCoupon(c: typeof couponsTable.$inferSelect) {
  return {
    ...c,
    discountValue: parseFloat(c.discountValue as unknown as string),
    minAmount: c.minAmount ? parseFloat(c.minAmount as unknown as string) : 0,
  };
}

// Validate & preview a coupon code (authenticated users)
router.post("/coupons/validate", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { code, shopId, amount } = req.body;
  if (!code) { res.status(400).json({ error: "code is required" }); return; }

  const [coupon] = await db.select().from(couponsTable).where(
    and(
      eq(couponsTable.code, String(code).toUpperCase()),
      eq(couponsTable.isActive, true),
      or(isNull(couponsTable.shopId), shopId ? eq(couponsTable.shopId, parseInt(shopId)) : isNull(couponsTable.shopId))
    )
  );

  if (!coupon) { res.status(404).json({ error: "Kuponi nuk u gjet ose nuk është aktiv" }); return; }
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    res.status(400).json({ error: "Kuponi ka skaduar" }); return;
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    res.status(400).json({ error: "Kuponi ka arritur limitin e përdorimit" }); return;
  }

  const orderAmount = parseFloat(amount) || 0;
  const minAmount = coupon.minAmount ? parseFloat(coupon.minAmount as unknown as string) : 0;
  if (orderAmount < minAmount) {
    res.status(400).json({ error: `Shuma minimale për këtë kupon është €${minAmount.toFixed(2)}` }); return;
  }

  const discountValue = parseFloat(coupon.discountValue as unknown as string);
  const discountAmount = coupon.discountType === "percentage"
    ? (orderAmount * discountValue) / 100
    : Math.min(discountValue, orderAmount);

  res.json({
    coupon: formatCoupon(coupon),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    finalAmount: parseFloat(Math.max(0, orderAmount - discountAmount).toFixed(2)),
  });
});

// Create coupon (owner must own the shop)
router.post("/coupons", requireAuth, requireRole("owner", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const { shopId, code, description, discountType, discountValue, minAmount, maxUses, expiresAt } = req.body;
  if (!code || discountValue == null) {
    res.status(400).json({ error: "code and discountValue are required" }); return;
  }

  if (shopId) {
    if (!(await assertShopOwner(req, parseInt(shopId), res))) return;
  }

  const [coupon] = await db.insert(couponsTable).values({
    shopId: shopId ? parseInt(shopId) : null,
    code: String(code).toUpperCase(),
    description: description || null,
    discountType: discountType || "percentage",
    discountValue: String(discountValue),
    minAmount: minAmount != null ? String(minAmount) : "0",
    maxUses: maxUses || null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    isActive: true,
  }).returning();

  res.status(201).json(formatCoupon(coupon));
});

// Toggle coupon active/inactive (owner must own the coupon's shop)
router.patch("/coupons/:id", requireAuth, requireRole("owner", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(p(req.params.id));
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.id, id));
  if (!coupon) { res.status(404).json({ error: "Not found" }); return; }

  if (coupon.shopId && !(await assertShopOwner(req, coupon.shopId, res))) return;

  const { isActive } = req.body;
  const [updated] = await db.update(couponsTable).set({ isActive }).where(eq(couponsTable.id, id)).returning();
  res.json(formatCoupon(updated));
});

// Delete coupon (owner must own the coupon's shop)
router.delete("/coupons/:id", requireAuth, requireRole("owner", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(p(req.params.id));
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.id, id));
  if (!coupon) { res.status(404).json({ error: "Not found" }); return; }

  if (coupon.shopId && !(await assertShopOwner(req, coupon.shopId, res))) return;

  await db.delete(couponUsagesTable).where(eq(couponUsagesTable.couponId, id));
  await db.delete(couponsTable).where(eq(couponsTable.id, id));
  res.sendStatus(204);
});

export default router;
