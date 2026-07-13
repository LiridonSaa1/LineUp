import { Router } from "express";
import {
  db, appointmentsTable, barbershopsTable, barbersTable,
  servicesTable, usersTable, notificationsTable, activityLogTable, holidaysTable,
} from "@workspace/db";
import { eq, and, sql, gte, lte, desc, inArray } from "drizzle-orm";
import { requireAuth, generateOtp, type AuthRequest } from "../lib/auth";
import { sendOtpEmail, sendBookingConfirmedEmail } from "../lib/email";

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
  const { shopId, barberId, serviceId, serviceIds, scheduledAt, notes } = req.body;
  const selectedServiceIds = Array.isArray(serviceIds)
    ? serviceIds.map((id) => parseInt(id, 10)).filter((id) => Number.isFinite(id))
    : serviceId
      ? [parseInt(serviceId, 10)]
      : [];

  if (!shopId || !barberId || selectedServiceIds.length === 0 || !scheduledAt) {
    res.status(400).json({ error: "shopId, barberId, serviceId/serviceIds, and scheduledAt are required" }); return;
  }
  const uniqueServiceIds = [...new Set(selectedServiceIds)];
  const serviceRows = await db.select().from(servicesTable).where(inArray(servicesTable.id, uniqueServiceIds));
  if (serviceRows.length !== uniqueServiceIds.length) { res.status(404).json({ error: "One or more services were not found" }); return; }
  const servicesById = new Map(serviceRows.map((service) => [service.id, service]));
  const selectedServices = selectedServiceIds.map((id) => servicesById.get(id)).filter(Boolean) as typeof serviceRows;
  const [service] = selectedServices;
  const totalPrice = selectedServices.reduce((sum, item) => sum + parseFloat(item.price as string), 0);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Barbershop not found" }); return; }
  if (!shopCanTakeBookings(shop)) { res.status(402).json({ error: inactiveSubscriptionMessage() }); return; }
  const [barber] = await db.select().from(barbersTable).where(and(eq(barbersTable.id, barberId), eq(barbersTable.shopId, shopId), eq(barbersTable.isActive, true)));
  if (!barber) { res.status(404).json({ error: "Barber not found for this shop" }); return; }
  if (selectedServices.some((item) => item.shopId !== shopId)) { res.status(400).json({ error: "One or more services do not belong to this shop" }); return; }

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const packageNote = selectedServices.length > 1
    ? `Sherbimet e zgjedhura: ${selectedServices.map((item) => item.name).join(", ")}`
    : null;
  const appointmentNotes = [notes, packageNote].filter(Boolean).join("\n") || null;

  const [appt] = await db.insert(appointmentsTable).values({
    userId: req.user!.id,
    shopId, barberId, serviceId: service.id,
    scheduledAt: new Date(scheduledAt),
    status: "pending_otp",
    otpCode: otp,
    otpExpiresAt,
    notes: appointmentNotes,
    totalPrice: totalPrice.toFixed(2),
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

  req.log.info({ appointmentId: appt.id, otp }, "Appointment booked, OTP generated");

  // Send OTP email (fire-and-forget)
  const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  const [shopRow] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  const [barberRow] = await db.select().from(barbersTable).where(eq(barbersTable.id, barberId));
  if (userRow && shopRow && barberRow) {
    sendOtpEmail({
      to: { email: userRow.email, name: userRow.name },
      otp,
      shopName: shopRow.name,
      scheduledAt: appt.scheduledAt,
      serviceName: selectedServices.map((item) => item.name).join(", "),
      barberName: barberRow.name,
    }).catch(() => {});
  }

  res.status(201).json(formatAppointment(appt));
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
  if (appt.otpCode !== otpCode) { res.status(400).json({ error: "Invalid OTP" }); return; }
  if (appt.otpExpiresAt && new Date() > appt.otpExpiresAt) {
    res.status(400).json({ error: "OTP expired" }); return;
  }
  const [updated] = await db.update(appointmentsTable)
    .set({ status: "confirmed", otpCode: null, otpExpiresAt: null })
    .where(eq(appointmentsTable.id, id)).returning();
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
  req.log.info({ appointmentId: id, otp }, "OTP resent");
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
  const holidays = await db.select().from(holidaysTable).where(and(eq(holidaysTable.shopId, shopId), eq(holidaysTable.date, date)));
  const relevantHolidays = holidays.filter((holiday) => !holiday.barberId || holiday.barberId === barberId);
  const fullDayHoliday = relevantHolidays.find((holiday) => holiday.isFullDay);
  if (fullDayHoliday) {
    res.json({ date, slots: [], unavailableReason: fullDayHoliday.reason || "Pushim" });
    return;
  }
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
  const slots = [];
  for (let h = 9; h < 19; h++) {
    for (const m of [0, 30]) {
      const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const isHolidayTime = relevantHolidays.some((holiday) =>
        !holiday.isFullDay && holiday.startTime && holiday.endTime && timeStr >= holiday.startTime && timeStr < holiday.endTime
      );
      if (!bookedTimes.has(timeStr) && !isHolidayTime) slots.push(timeStr);
    }
  }
  res.json({ date, slots });
});

export default router;
