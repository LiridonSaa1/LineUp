import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, sql } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../lib/auth";

const router = Router();

const userFields = {
  id: usersTable.id,
  name: usersTable.name,
  email: usersTable.email,
  role: usersTable.role,
  phone: usersTable.phone,
  avatarUrl: usersTable.avatarUrl,
  createdAt: usersTable.createdAt,
};

router.get("/users", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const role = req.query.role as string | undefined;

  const conditions = role ? eq(usersTable.role, role as "admin" | "owner" | "user") : undefined;
  const query = db.select(userFields).from(usersTable);
  if (conditions) query.where(conditions);

  const users = await query.limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  res.json({ data: users, total: count });
});

router.get("/users/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (req.user!.role !== "admin" && req.user!.id !== id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const [user] = await db.select(userFields).from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

router.patch("/users/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (req.user!.role !== "admin" && req.user!.id !== id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { name, phone, avatarUrl } = req.body;
  const [user] = await db.update(usersTable)
    .set({ ...(name && { name }), phone: phone ?? undefined, avatarUrl: avatarUrl ?? undefined })
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatarUrl: user.avatarUrl, createdAt: user.createdAt });
});

router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

export default router;
