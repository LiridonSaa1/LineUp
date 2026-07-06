import { Router } from "express";
import {
  db, loyaltyAccountsTable, loyaltyTransactionsTable, loyaltyProgramsTable, barbershopsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../lib/auth";

const router = Router();

function p(v: string | string[]): string {
  return Array.isArray(v) ? v[0] : v;
}

// Get loyalty program config for a shop (public)
router.get("/barbershops/:shopId/loyalty/program", async (req, res): Promise<void> => {
  const shopId = parseInt(p(req.params.shopId));
  const [program] = await db.select().from(loyaltyProgramsTable).where(eq(loyaltyProgramsTable.shopId, shopId));
  res.json(program ?? null);
});

// Create/update loyalty program (owner must own the shop)
router.put(
  "/barbershops/:shopId/loyalty/program",
  requireAuth,
  requireRole("owner", "admin"),
  async (req: AuthRequest, res): Promise<void> => {
    const shopId = parseInt(p(req.params.shopId));
    const { pointsPerEuro, pointsToRedeem, minPointsRedeem, isActive } = req.body;

    const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const [existing] = await db.select().from(loyaltyProgramsTable).where(eq(loyaltyProgramsTable.shopId, shopId));

    if (existing) {
      const [updated] = await db.update(loyaltyProgramsTable).set({
        pointsPerEuro: pointsPerEuro ?? existing.pointsPerEuro,
        pointsToRedeem: pointsToRedeem ?? existing.pointsToRedeem,
        minPointsRedeem: minPointsRedeem ?? existing.minPointsRedeem,
        isActive: isActive !== undefined ? (isActive ? 1 : 0) : existing.isActive,
      }).where(eq(loyaltyProgramsTable.shopId, shopId)).returning();
      res.json(updated);
    } else {
      const [created] = await db.insert(loyaltyProgramsTable).values({
        shopId,
        pointsPerEuro: pointsPerEuro ?? 10,
        pointsToRedeem: pointsToRedeem ?? 100,
        minPointsRedeem: minPointsRedeem ?? 100,
        isActive: isActive !== false ? 1 : 0,
      }).returning();
      res.status(201).json(created);
    }
  }
);

// Get user's loyalty balance for a shop (authenticated)
router.get("/barbershops/:shopId/loyalty/balance", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(p(req.params.shopId));
  const userId = req.user!.id;

  const [account] = await db.select().from(loyaltyAccountsTable).where(
    and(eq(loyaltyAccountsTable.userId, userId), eq(loyaltyAccountsTable.shopId, shopId))
  );
  const [program] = await db.select().from(loyaltyProgramsTable).where(eq(loyaltyProgramsTable.shopId, shopId));

  const points = account?.totalPoints ?? 0;
  const euroValue = program ? Math.floor(points / program.pointsToRedeem) : 0;

  res.json({
    points,
    lifetimePoints: account?.lifetimePoints ?? 0,
    euroValue,
    program: program ?? null,
  });
});

// Get loyalty transaction history (authenticated, own records only)
router.get("/barbershops/:shopId/loyalty/transactions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(p(req.params.shopId));
  const userId = req.user!.id;

  const txs = await db.select().from(loyaltyTransactionsTable).where(
    and(eq(loyaltyTransactionsTable.userId, userId), eq(loyaltyTransactionsTable.shopId, shopId))
  ).orderBy(desc(loyaltyTransactionsTable.createdAt)).limit(50);

  res.json(txs);
});

// Internal helper — award loyalty points after appointment
export async function awardLoyaltyPoints(
  userId: number,
  shopId: number,
  appointmentId: number,
  amountEuros: number
) {
  const [program] = await db.select().from(loyaltyProgramsTable).where(eq(loyaltyProgramsTable.shopId, shopId));
  if (!program || !program.isActive) return;

  const points = Math.floor(amountEuros * program.pointsPerEuro);
  if (points <= 0) return;

  const [existing] = await db.select().from(loyaltyAccountsTable).where(
    and(eq(loyaltyAccountsTable.userId, userId), eq(loyaltyAccountsTable.shopId, shopId))
  );

  if (existing) {
    await db.update(loyaltyAccountsTable).set({
      totalPoints: existing.totalPoints + points,
      lifetimePoints: existing.lifetimePoints + points,
    }).where(eq(loyaltyAccountsTable.id, existing.id));
  } else {
    await db.insert(loyaltyAccountsTable).values({
      userId, shopId, totalPoints: points, lifetimePoints: points,
    });
  }

  await db.insert(loyaltyTransactionsTable).values({
    userId, shopId, points,
    type: "earned",
    appointmentId,
    description: `Fituat ${points} pikë nga takimi`,
  });
}

// Redeem loyalty points (deduct from balance)
router.post("/barbershops/:shopId/loyalty/redeem", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(p(req.params.shopId));
  const userId = req.user!.id;
  const { pointsToRedeem } = req.body;

  if (!pointsToRedeem || parseInt(pointsToRedeem) <= 0) {
    res.status(400).json({ error: "pointsToRedeem must be positive" }); return;
  }

  const pts = parseInt(pointsToRedeem);

  const [program] = await db.select().from(loyaltyProgramsTable).where(eq(loyaltyProgramsTable.shopId, shopId));
  if (!program || !program.isActive) {
    res.status(400).json({ error: "Loyalty program not active" }); return;
  }

  if (pts < program.minPointsRedeem) {
    res.status(400).json({ error: `Minimumi për shpërbliim është ${program.minPointsRedeem} pikë` }); return;
  }

  const [account] = await db.select().from(loyaltyAccountsTable).where(
    and(eq(loyaltyAccountsTable.userId, userId), eq(loyaltyAccountsTable.shopId, shopId))
  );

  if (!account || account.totalPoints < pts) {
    res.status(400).json({ error: "Pikë të pamjaftueshme" }); return;
  }

  const euroValue = parseFloat((pts / program.pointsToRedeem).toFixed(2));

  await db.update(loyaltyAccountsTable).set({
    totalPoints: account.totalPoints - pts,
  }).where(eq(loyaltyAccountsTable.id, account.id));

  await db.insert(loyaltyTransactionsTable).values({
    userId, shopId, points: -pts,
    type: "redeemed",
    description: `Shpërblyet ${pts} pikë = €${euroValue}`,
  });

  res.json({ redeemedPoints: pts, euroValue });
});

export default router;
