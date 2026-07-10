import { Router } from "express";
import {
  db, appointmentsTable, barbershopsTable, barbersTable,
  servicesTable, usersTable, notificationsTable, activityLogTable,
} from "@workspace/db";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { requireAuth, generateOtp, type AuthRequest } from "../lib/auth";
import { sendOtpEmail, sendBookingConfirmedEmail } from "../lib/email";
import { sendVerificationSms, checkVerificationSms } from "../lib/sms";

const router = Router();

function formatAppointment(a: any) {
  return {
    ...a,
    totalPrice: a.totalPrice != null ? parseFloat(a.totalPrice) : null,
  };
}

function shopCanTakeBookings(shop: any) {
  return shop?.status === "active" && shop?.subscriptionStatus === "active";
}

function inactiveSubscriptionMessage() {
  return "Ky barbershop nuk ka abonim aktiv. Rezervimet jane ndalur perkohesisht.";
}

router.get("/appointments", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (req.user!.role === "user") conditions.push(eq(appointmentsTable.userId, req.user!.id));
  if (req.user!.role === "barber") {
    const [barberRow] = await db
      .select({ barber: barbersTable, shop: barbershopsTable })
      .from(barbersTable)
      .innerJoin(barbershopsTable, eq(barbersTable.shopId, barbershopsTable.id))
      .where(eq((barbersTable as any).userId, req.user!.id));
    if (!barberRow) { res.status(404).json({ error: "Barber profile not found" }); return; }
    if (!shopCanTakeBookings(barberRow.shop)) { res.status(402).json({ error: inactiveSubscriptionMessage() }); return; }
    conditions.push(eq(appointmentsTable.barberId, barberRow.barber.id));
  }
  else if (req.query.userId) conditions.push(eq(appointmentsTable.userId, parseInt(req.query.userId as string)));
  if (req.query.shopId) conditions.push(eq(appointmentsTable.shopId, parseInt(req.query.shopId as string)));
  if (req.query.barberId) conditions.push(eq(appointmentsTable.barberId, parseInt(req.query.barberId as string)));
  if (req.query.status) conditions.push(eq(appointmentsTable.status, req.query.status as any));

  const appts = await db.select({
    appointment: appointmentsTable,
    user: { id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, phone: usersTable.phone, avatarUrl: usersTable.avatarUrl, createdAt: usersTable.createdAt },
    barbershop: barbershopsTable,
    barber: barbersTable,
    service: servicesTable,
  }).from(appointmentsTable)
    .leftJoin(usersTable, eq(appointmentsTable.userId, usersTable.id))
    .leftJoin(barbershopsTable, eq(appointmentsTable.shopId, barbershopsTable.id))
    .leftJoin(barbersTable, eq(appointmentsTable.barberId, barbersTable.id))
    .leftJoin(servicesTable, eq(appointmentsTable.serviceId, servicesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(appointmentsTable.scheduledAt))
    .limit(limit).offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json({
    data: appts.map(a => ({
      ...formatAppointment(a.appointment),
      user: a.user, barbershop: a.barbershop ? { ...a.barbershop, rating: a.barbershop.rating ? parseFloat(a.barbershop.rating as string) : null, latitude: a.barbershop.latitude ? parseFloat(a.barbershop.latitude as string) : null, longitude: a.barbershop.longitude ? parseFloat(a.barbershop.longitude as string) : null } : null,
      barber: a.barber ? { ...a.barber, rating: a.barber.rating ? parseFloat(a.barber.rating as string) : null } : null,
      service: a.service ? { ...a.service, price: parseFloat(a.service.price) } : null,
    })),
    total: count,
  });
});

router.post("/appointments", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { shopId, barberId, serviceId, scheduledAt, notes } = req.body;
  if (!shopId || !barberId || !serviceId || !scheduledAt) {
    res.status(400).json({ error: "shopId, barberId, serviceId, and scheduledAt are required" }); return;
  }
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId));
  if (!service) { res.status(404).json({ error: "Service not found" }); return; }
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Barbershop not found" }); return; }
  if (!shopCanTakeBookings(shop)) { res.status(402).json({ error: inactiveSubscriptionMessage() }); return; }
  const [barber] = await db.select().from(barbersTable).where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId), eq(barbersTable.isActive, true)));
  if (!barber) { res.status(404).json({ error: "Barber not found for this shop" }); return; }
  if (service.shopId !== shopId) { res.status(400).json({ error: "Service does not belong to this shop" }); return; }

  const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  const useSms = Boolean(userRow?.phone);
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const [appt] = await db.insert(appointmentsTable).values({
    userId: req.user!.id,
    shopId, barberId, serviceId,
    scheduledAt: new Date(scheduledAt),
    status: "pending_otp",
    otpCode: otp,
    otpExpiresAt,
    otpChannel: useSms ? "sms" : "email",
    notes: notes ?? null,
    totalPrice: service.price,
  }).returning();

  await db.insert(notificationsTable).values({
    userId: req.user!.id,
    title: "Appointment Booked",
    message: `Your appointment is booked for ${new Date(scheduledAt).toLocaleString()}. OTP: ${otp}`,
    type: "booking_confirmed",
    relatedId: appt.id,
    relatedType: "appointment",
  });

  await db.insert(activityLogTable).values({
    type: "appointment_booked",
    description: `New appointment booked`,
    userId: req.user!.id,
    shopId,
  });

  req.log.info({ appointmentId: appt.id, channel: appt.otpChannel }, "Appointment booked, OTP generated");

  // Send OTP via SMS or email (fire-and-forget)
  const [shopRow] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  const [barberRow] = await db.select().from(barbersTable).where(eq(barbersTable.id, barberId));
  if (userRow && shopRow && barberRow) {
    if (useSms && userRow.phone) {
      sendVerificationSms(userRow.phone).catch(() => {});
    } else {
      sendOtpEmail({
        to: { email: userRow.email, name: userRow.name },
        otp,
        shopName: shopRow.name,
        scheduledAt: appt.scheduledAt,
        serviceName: service.name,
        barberName: barberRow.name,
      }).catch(() => {});
    }
  }

  res.status(201).json(formatAppointment(appt));
});

// Books several services back-to-back for the same barber/date under a single shared OTP,
// so the customer only has to check one email / enter one code to confirm the whole booking.
router.post("/appointments/batch", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { shopId, barberId, serviceIds, scheduledAt, notes } = req.body;
  if (!shopId || !barberId || !Array.isArray(serviceIds) || serviceIds.length === 0 || !scheduledAt) {
    res.status(400).json({ error: "shopId, barberId, serviceIds, and scheduledAt are required" }); return;
  }

  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Barbershop not found" }); return; }
  if (!shopCanTakeBookings(shop)) { res.status(402).json({ error: inactiveSubscriptionMessage() }); return; }
  const [barber] = await db.select().from(barbersTable).where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId), eq(barbersTable.isActive, true)));
  if (!barber) { res.status(404).json({ error: "Barber not found for this shop" }); return; }

  const services = await db.select().from(servicesTable).where(eq(servicesTable.shopId, shopId));
  const servicesById = new Map(services.map(s => [s.id, s]));
  const orderedServices = serviceIds.map((id: number) => servicesById.get(id)).filter(Boolean) as typeof services;
  if (orderedServices.length !== serviceIds.length) {
    res.status(404).json({ error: "One or more services not found for this shop" }); return;
  }

  const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  const useSms = Boolean(userRow?.phone);
  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  let cursor = new Date(scheduledAt);
  const created: (typeof appointmentsTable.$inferSelect)[] = [];

  for (const service of orderedServices) {
    const [appt] = await db.insert(appointmentsTable).values({
      userId: req.user!.id,
      shopId, barberId, serviceId: service.id,
      scheduledAt: new Date(cursor),
      status: "pending_otp",
      otpCode: otp,
      otpExpiresAt,
      otpChannel: useSms ? "sms" : "email",
      notes: notes ?? null,
      totalPrice: service.price,
    }).returning();
    created.push(appt);
    cursor = new Date(cursor.getTime() + (service.durationMinutes ?? 30) * 60 * 1000);

    await db.insert(activityLogTable).values({
      type: "appointment_booked",
      description: `New appointment booked`,
      userId: req.user!.id,
      shopId,
    });
  }

  await db.insert(notificationsTable).values({
    userId: req.user!.id,
    title: "Appointment Booked",
    message: `Your appointment(s) are booked starting ${new Date(scheduledAt).toLocaleString()}. OTP: ${otp}`,
    type: "booking_confirmed",
    relatedId: created[0].id,
    relatedType: "appointment",
  });

  req.log.info({ appointmentIds: created.map(a => a.id), channel: useSms ? "sms" : "email" }, "Batch appointments booked, shared OTP generated");

  if (userRow) {
    if (useSms && userRow.phone) {
      sendVerificationSms(userRow.phone).catch(() => {});
    } else {
      sendOtpEmail({
        to: { email: userRow.email, name: userRow.name },
        otp,
        shopName: shop.name,
        scheduledAt: created[0].scheduledAt,
        serviceName: orderedServices.map(s => s.name).join(", "),
        barberName: barber.name,
      }).catch(() => {});
    }
  }

  res.status(201).json({ data: created.map(formatAppointment), total: created.length });
});

router.get("/appointments/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [row] = await db.select({
    appointment: appointmentsTable,
    user: { id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, phone: usersTable.phone, avatarUrl: usersTable.avatarUrl, createdAt: usersTable.createdAt },
    barbershop: barbershopsTable,
    barber: barbersTable,
    service: servicesTable,
  }).from(appointmentsTable)
    .leftJoin(usersTable, eq(appointmentsTable.userId, usersTable.id))
    .leftJoin(barbershopsTable, eq(appointmentsTable.shopId, barbershopsTable.id))
    .leftJoin(barbersTable, eq(appointmentsTable.barberId, barbersTable.id))
    .leftJoin(servicesTable, eq(appointmentsTable.serviceId, servicesTable.id))
    .where(eq(appointmentsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    ...formatAppointment(row.appointment),
    user: row.user,
    barbershop: row.barbershop ? { ...row.barbershop, rating: row.barbershop.rating ? parseFloat(row.barbershop.rating as string) : null, latitude: row.barbershop.latitude ? parseFloat(row.barbershop.latitude as string) : null, longitude: row.barbershop.longitude ? parseFloat(row.barbershop.longitude as string) : null } : null,
    barber: row.barber ? { ...row.barber, rating: row.barber.rating ? parseFloat(row.barber.rating as string) : null } : null,
    service: row.service ? { ...row.service, price: parseFloat(row.service.price) } : null,
  });
});

router.patch("/appointments/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { status, notes } = req.body;
  const [existing] = await db.select({
    appointment: appointmentsTable,
    shop: barbershopsTable,
  }).from(appointmentsTable)
    .leftJoin(barbershopsTable, eq(appointmentsTable.shopId, barbershopsTable.id))
    .where(eq(appointmentsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (req.user!.role !== "admin" && !shopCanTakeBookings(existing.shop)) {
    res.status(402).json({ error: inactiveSubscriptionMessage() }); return;
  }
  const updateData: any = {};
  if (status) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  const [appt] = await db.update(appointmentsTable).set(updateData).where(eq(appointmentsTable.id, id)).returning();
  if (!appt) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatAppointment(appt));
});

router.delete("/appointments/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) { res.status(404).json({ error: "Not found" }); return; }
  if (req.user!.role === "user" && appt.userId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  await db.update(appointmentsTable).set({ status: "cancelled" }).where(eq(appointmentsTable.id, id));
  res.sendStatus(204);
});

router.post("/appointments/:id/confirm-otp", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { otpCode } = req.body;
  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) { res.status(404).json({ error: "Not found" }); return; }
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, appt.shopId));
  if (!shopCanTakeBookings(shop)) { res.status(402).json({ error: inactiveSubscriptionMessage() }); return; }

  // If already confirmed (e.g. sibling in a batch was confirmed first), return it immediately.
  if (appt.status === "confirmed") {
    res.json(formatAppointment(appt)); return;
  }

  if (appt.otpChannel === "sms") {
    const [apptUser] = await db.select().from(usersTable).where(eq(usersTable.id, appt.userId));
    if (!apptUser?.phone) { res.status(400).json({ error: "Invalid OTP" }); return; }
    const valid = await checkVerificationSms(apptUser.phone, otpCode);
    if (!valid) { res.status(400).json({ error: "Invalid OTP" }); return; }

    // Twilio Verify is consumed on first check — confirm ALL pending_otp SMS
    // appointments for this user so batch siblings don't fail on their check.
    await db.update(appointmentsTable)
      .set({ status: "confirmed", otpCode: null, otpExpiresAt: null })
      .where(and(
        eq(appointmentsTable.userId, appt.userId),
        eq(appointmentsTable.status, "pending_otp"),
        eq(appointmentsTable.otpChannel, "sms"),
      ));
  } else {
    if (appt.otpCode !== otpCode) { res.status(400).json({ error: "Invalid OTP" }); return; }
    if (appt.otpExpiresAt && new Date() > appt.otpExpiresAt) {
      res.status(400).json({ error: "OTP expired" }); return;
    }
    await db.update(appointmentsTable)
      .set({ status: "confirmed", otpCode: null, otpExpiresAt: null })
      .where(eq(appointmentsTable.id, id));
  }

  const [updated] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  await db.insert(activityLogTable).values({ type: "appointment_confirmed", description: "Appointment confirmed", userId: appt.userId, shopId: appt.shopId });

  // Send booking confirmed email (fire-and-forget)
  const [confUser] = await db.select().from(usersTable).where(eq(usersTable.id, appt.userId));
  const [confShop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, appt.shopId));
  const [confBarber] = await db.select().from(barbersTable).where(eq(barbersTable.id, appt.barberId));
  const [confService] = await db.select().from(servicesTable).where(eq(servicesTable.id, appt.serviceId));
  if (confUser && confShop && confBarber && confService) {
    sendBookingConfirmedEmail({
      to: { email: confUser.email, name: confUser.name },
      shopName: confShop.name,
      scheduledAt: appt.scheduledAt,
      serviceName: confService.name,
      barberName: confBarber.name,
      totalPrice: appt.totalPrice ? parseFloat(appt.totalPrice as string) : 0,
    }).catch(() => {});
  }

  res.json(formatAppointment(updated));
});

router.post("/appointments/:id/resend-otp", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) { res.status(404).json({ error: "Not found" }); return; }
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, appt.shopId));
  if (!shopCanTakeBookings(shop)) { res.status(402).json({ error: inactiveSubscriptionMessage() }); return; }

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await db.update(appointmentsTable).set({ otpCode: otp, otpExpiresAt }).where(eq(appointmentsTable.id, id));

  const [apptUser] = await db.select().from(usersTable).where(eq(usersTable.id, appt.userId));
  const [apptShop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, appt.shopId));
  const [apptBarber] = await db.select().from(barbersTable).where(eq(barbersTable.id, appt.barberId));
  const [apptService] = await db.select().from(servicesTable).where(eq(servicesTable.id, appt.serviceId));

  if (apptUser && apptShop && apptBarber && apptService) {
    if (appt.otpChannel === "sms" && apptUser.phone) {
      sendVerificationSms(apptUser.phone).catch(() => {});
      req.log.info({ appointmentId: id }, "OTP resent via SMS");
    } else {
      sendOtpEmail({
        to: { email: apptUser.email, name: apptUser.name },
        otp,
        shopName: apptShop.name,
        scheduledAt: appt.scheduledAt,
        serviceName: apptService.name,
        barberName: apptBarber.name,
      }).catch(() => {});
      req.log.info({ appointmentId: id }, "OTP resent via email");
    }
  }
  res.json({ message: "OTP resent successfully" });
});

router.get("/available-slots", async (req, res): Promise<void> => {
  const shopId = parseInt(req.query.shopId as string);
  const barberId = parseInt(req.query.barberId as string);
  const date = req.query.date as string;
  if (!shopId || !barberId || !date) {
    res.status(400).json({ error: "shopId, barberId, and date are required" }); return;
  }
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Barbershop not found" }); return; }
  if (!shopCanTakeBookings(shop)) { res.status(402).json({ error: inactiveSubscriptionMessage() }); return; }
  const [barber] = await db.select().from(barbersTable).where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId), eq(barbersTable.isActive, true)));
  if (!barber) { res.status(404).json({ error: "Barber not found for this shop" }); return; }
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);
  const bookedAppts = await db.select({ scheduledAt: appointmentsTable.scheduledAt })
    .from(appointmentsTable)
    .where(and(
      eq(appointmentsTable.barberId, barberId),
      gte(appointmentsTable.scheduledAt, dayStart),
      lte(appointmentsTable.scheduledAt, dayEnd),
      sql`${appointmentsTable.status} NOT IN ('cancelled')`,
    ));
  const bookedTimes = new Set(bookedAppts.map(a => a.scheduledAt.toISOString().slice(11, 16)));
  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayKey = dayKeys[dayStart.getUTCDay()];
  const schedule = (barber as any).weeklySchedule?.[dayKey];
  const daySchedule = schedule ?? { active: true, start: "09:00", end: "19:00" };

  const slots = [];
  if (daySchedule.active) {
    const [startH, startM] = daySchedule.start.split(":").map(Number);
    const [endH, endM] = daySchedule.end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    for (let mins = startMinutes; mins < endMinutes; mins += 30) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      if (bookedTimes.has(timeStr)) continue;
      if (isToday && mins <= nowMinutes) continue;
      slots.push(timeStr);
    }
  }
  res.json({ date, slots });
});

export default router;
