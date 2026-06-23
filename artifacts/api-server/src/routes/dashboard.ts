import { Router } from "express";
import {
  db, usersTable, barbershopsTable, appointmentsTable, paymentsTable,
  barbersTable, productsTable, activityLogTable,
} from "@workspace/db";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../lib/auth";

const router = Router();

router.get("/dashboard/stats", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const [users] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [shops] = await db.select({ count: sql<number>`count(*)::int` }).from(barbershopsTable);
  const [appts] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable);
  const [pending] = await db.select({ count: sql<number>`count(*)::int` }).from(barbershopsTable).where(eq(barbershopsTable.status, "pending"));
  const [active] = await db.select({ count: sql<number>`count(*)::int` }).from(barbershopsTable).where(eq(barbershopsTable.status, "active"));
  const [revenue] = await db.select({ total: sql<number>`coalesce(sum(amount::numeric), 0)::float` }).from(paymentsTable).where(eq(paymentsTable.status, "completed"));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [todayAppts] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable).where(gte(appointmentsTable.scheduledAt, today));

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const [monthRev] = await db.select({ total: sql<number>`coalesce(sum(amount::numeric), 0)::float` }).from(paymentsTable).where(and(eq(paymentsTable.status, "completed"), gte(paymentsTable.createdAt, monthStart)));

  res.json({
    totalUsers: users.count,
    totalBarbershops: shops.count,
    totalAppointments: appts.count,
    totalRevenue: revenue.total || 0,
    pendingApprovals: pending.count,
    activeShops: active.count,
    todayAppointments: todayAppts.count,
    monthRevenue: monthRev.total || 0,
  });
});

router.get("/dashboard/owner-stats", requireAuth, requireRole("owner", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(req.query.shopId as string);
  if (!shopId) { res.status(400).json({ error: "shopId is required" }); return; }

  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const [allAppts] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable).where(eq(appointmentsTable.shopId, shopId));
  const [confirmed] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable).where(and(eq(appointmentsTable.shopId, shopId), eq(appointmentsTable.status, "confirmed")));
  const [cancelled] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable).where(and(eq(appointmentsTable.shopId, shopId), eq(appointmentsTable.status, "cancelled")));
  const [revenue] = await db.select({ total: sql<number>`coalesce(sum(amount::numeric), 0)::float` }).from(paymentsTable).where(and(eq(paymentsTable.shopId, shopId), eq(paymentsTable.status, "completed")));
  const [barbers] = await db.select({ count: sql<number>`count(*)::int` }).from(barbersTable).where(eq(barbersTable.shopId, shopId));
  const [products] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(eq(productsTable.shopId, shopId));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [todayAppts] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable).where(and(eq(appointmentsTable.shopId, shopId), gte(appointmentsTable.scheduledAt, today)));

  res.json({
    totalAppointments: allAppts.count,
    confirmedAppointments: confirmed.count,
    cancelledAppointments: cancelled.count,
    totalRevenue: revenue.total || 0,
    todayAppointments: todayAppts.count,
    totalBarbers: barbers.count,
    totalProducts: products.count,
    rating: shop.rating ? parseFloat(shop.rating as string) : null,
    subscriptionActive: shop.subscriptionStatus === "active",
  });
});

router.get("/dashboard/recent-activity", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 10;
  const conditions = [];
  if (req.query.shopId) conditions.push(eq(activityLogTable.shopId, parseInt(req.query.shopId as string)));

  const activity = await db.select().from(activityLogTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(activityLogTable.createdAt))
    .limit(limit);
  res.json(activity);
});

router.get("/dashboard/appointments-by-day", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const days = parseInt(req.query.days as string) || 7;
  const shopId = req.query.shopId ? parseInt(req.query.shopId as string) : null;
  const since = new Date(); since.setDate(since.getDate() - days);

  const conditions = [gte(appointmentsTable.scheduledAt, since)];
  if (shopId) conditions.push(eq(appointmentsTable.shopId, shopId));

  const rows = await db.select({
    date: sql<string>`DATE(${appointmentsTable.scheduledAt})::text`,
    count: sql<number>`count(*)::int`,
  }).from(appointmentsTable).where(and(...conditions)).groupBy(sql`DATE(${appointmentsTable.scheduledAt})`).orderBy(sql`DATE(${appointmentsTable.scheduledAt})`);

  res.json(rows);
});

router.get("/dashboard/revenue-by-month", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const months = parseInt(req.query.months as string) || 6;
  const shopId = req.query.shopId ? parseInt(req.query.shopId as string) : null;
  const since = new Date(); since.setMonth(since.getMonth() - months);

  const conditions = [gte(paymentsTable.createdAt, since), eq(paymentsTable.status, "completed")];
  if (shopId) conditions.push(eq(paymentsTable.shopId, shopId));

  const rows = await db.select({
    month: sql<string>`TO_CHAR(${paymentsTable.createdAt}, 'YYYY-MM')`,
    revenue: sql<number>`coalesce(sum(amount::numeric), 0)::float`,
  }).from(paymentsTable).where(and(...conditions)).groupBy(sql`TO_CHAR(${paymentsTable.createdAt}, 'YYYY-MM')`).orderBy(sql`TO_CHAR(${paymentsTable.createdAt}, 'YYYY-MM')`);

  res.json(rows);
});

export default router;
