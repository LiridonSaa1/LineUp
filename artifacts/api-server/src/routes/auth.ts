import { Router } from "express";
import { db, usersTable, barbersTable, barbershopsTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import { generateToken, hashPassword, comparePassword, requireAuth, type AuthRequest } from "../lib/auth";
import { logger } from "../lib/logger";
import { sendWelcomeEmail } from "../lib/email";

const router = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password, role, phone, shopId, businessName, companyName, shopName, specialties, bio, avatarUrl } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, and password are required" });
    return;
  }
  const normalizedRole = role === "owner" ? "owner" : role === "barber" ? "barber" : "user";
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  let barberShop: typeof barbershopsTable.$inferSelect | null = null;
  if (normalizedRole === "barber") {
    if (shopId) {
      const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, parseInt(String(shopId))));
      barberShop = shop ?? null;
    } else {
      const firmName = businessName ?? companyName ?? shopName;
      if (firmName) {
        const [shop] = await db.select().from(barbershopsTable).where(ilike(barbershopsTable.name, String(firmName))).limit(1);
        barberShop = shop ?? null;
      }
    }

    if (!barberShop) {
      res.status(400).json({ error: "Barber registration requires a valid shopId or existing business name" });
      return;
    }
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
    role: normalizedRole,
    phone: phone ?? null,
    avatarUrl: avatarUrl ?? null,
  }).returning();

  let barber = null;
  if (normalizedRole === "barber" && barberShop) {
    try {
      const [createdBarber] = await db.insert(barbersTable).values({
        shopId: barberShop.id,
        userId: user.id,
        name,
        bio: bio ?? null,
        avatarUrl: avatarUrl ?? null,
        specialties: specialties ?? null,
      } as any).returning();
      barber = createdBarber;
    } catch (err) {
      await db.delete(usersTable).where(eq(usersTable.id, user.id));
      logger.error({ err, userId: user.id }, "Failed to create barber profile during registration");
      res.status(500).json({ error: "Could not create barber profile" });
      return;
    }
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  req.log.info({ userId: user.id }, "User registered");

  // Send welcome email (fire-and-forget)
  sendWelcomeEmail({ to: { email: user.email, name: user.name }, role: user.role }).catch(() => {});

  res.status(201).json({
    token,
    user: {
      id: user.id, name: user.name, email: user.email, role: user.role,
      phone: user.phone, avatarUrl: user.avatarUrl, createdAt: user.createdAt,
    },
    barber,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  req.log.info({ userId: user.id }, "User logged in");
  res.json({
    token,
    user: {
      id: user.id, name: user.name, email: user.email, role: user.role,
      phone: user.phone, avatarUrl: user.avatarUrl, createdAt: user.createdAt,
    },
  });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  res.json({
    id: user.id, name: user.name, email: user.email, role: user.role,
    phone: user.phone, avatarUrl: user.avatarUrl, createdAt: user.createdAt,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logged out" });
});


router.post("/auth/change-password", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" }); return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" }); return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user || !user.passwordHash) { res.status(404).json({ error: "User not found" }); return; }
  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) { res.status(400).json({ error: "Fjalëkalimi aktual është i gabuar" }); return; }
  const hashed = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash: hashed }).where(eq(usersTable.id, req.user!.id));
  res.json({ message: "Password changed successfully" });
});

export default router;
