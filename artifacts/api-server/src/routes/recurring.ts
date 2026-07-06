import { Router } from "express";
import {
  db, recurringRulesTable, barbershopsTable, barbersTable, servicesTable,
  appointmentsTable, usersTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

function p(v: string | string[]): string {
  return Array.isArray(v) ? v[0] : v;
}

// Get user's recurring rules
router.get("/recurring", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rows = await db.select({
    rule: recurringRulesTable,
    barbershop: { id: barbershopsTable.id, name: barbershopsTable.name, city: barbershopsTable.city },
    barber: { id: barbersTable.id, name: barbersTable.name },
    service: { id: servicesTable.id, name: servicesTable.name, price: servicesTable.price, durationMinutes: servicesTable.durationMinutes },
  }).from(recurringRulesTable)
    .leftJoin(barbershopsTable, eq(recurringRulesTable.shopId, barbershopsTable.id))
    .leftJoin(barbersTable, eq(recurringRulesTable.barberId, barbersTable.id))
    .leftJoin(servicesTable, eq(recurringRulesTable.serviceId, servicesTable.id))
    .where(eq(recurringRulesTable.userId, req.user!.id))
    .orderBy(desc(recurringRulesTable.createdAt));

  res.json(rows.map(r => ({
    ...r.rule,
    barbershop: r.barbershop,
    barber: r.barber,
    service: r.service ? { ...r.service, price: parseFloat(r.service.price as unknown as string) } : null,
  })));
});

// Create recurring rule
router.post("/recurring", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { shopId, barberId, serviceId, frequency, preferredTime, startDate, endDate, notes } = req.body;

  if (!shopId || !barberId || !serviceId || !frequency || !preferredTime || !startDate) {
    res.status(400).json({ error: "shopId, barberId, serviceId, frequency, preferredTime, startDate are required" }); return;
  }

  const [rule] = await db.insert(recurringRulesTable).values({
    userId: req.user!.id,
    shopId: parseInt(shopId),
    barberId: parseInt(barberId),
    serviceId: parseInt(serviceId),
    frequency: String(frequency) as "weekly" | "biweekly" | "monthly",
    preferredTime: String(preferredTime),
    startDate: String(startDate),
    endDate: endDate ? String(endDate) : null,
    notes: notes ? String(notes) : null,
    isActive: 1,
  }).returning();

  res.status(201).json(rule);
});

// Update (activate/deactivate) recurring rule (own rules only)
router.patch("/recurring/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(p(req.params.id));
  const { isActive } = req.body;

  const [rule] = await db.select().from(recurringRulesTable).where(
    and(eq(recurringRulesTable.id, id), eq(recurringRulesTable.userId, req.user!.id))
  );
  if (!rule) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db.update(recurringRulesTable)
    .set({ isActive: isActive ? 1 : 0 })
    .where(eq(recurringRulesTable.id, id))
    .returning();

  res.json(updated);
});

// Delete recurring rule (own rules only)
router.delete("/recurring/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(p(req.params.id));
  const [rule] = await db.select().from(recurringRulesTable).where(
    and(eq(recurringRulesTable.id, id), eq(recurringRulesTable.userId, req.user!.id))
  );
  if (!rule) { res.status(404).json({ error: "Not found" }); return; }
  await db.delete(recurringRulesTable).where(eq(recurringRulesTable.id, id));
  res.sendStatus(204);
});

// Preview upcoming dates for a recurring rule (own rules only)
router.get("/recurring/:id/preview", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(p(req.params.id));
  const [rule] = await db.select().from(recurringRulesTable).where(
    and(eq(recurringRulesTable.id, id), eq(recurringRulesTable.userId, req.user!.id))
  );
  if (!rule) { res.status(404).json({ error: "Not found" }); return; }

  const intervalDays = rule.frequency === "weekly" ? 7 : rule.frequency === "biweekly" ? 14 : 30;
  const dates: string[] = [];
  let current = new Date(`${rule.startDate}T${rule.preferredTime}:00Z`);
  const cutoff = rule.endDate
    ? new Date(rule.endDate)
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  while (current <= cutoff && dates.length < 12) {
    dates.push(current.toISOString().slice(0, 10));
    current = new Date(current.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  }

  res.json({ rule, upcomingDates: dates });
});

// ICS export — Google Calendar import (confirmed appointments for the current user)
router.get("/appointments/export.ics", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const appts = await db.select({
    appt: appointmentsTable,
    shop: { name: barbershopsTable.name, address: barbershopsTable.address },
    svc: { name: servicesTable.name },
  }).from(appointmentsTable)
    .leftJoin(barbershopsTable, eq(appointmentsTable.shopId, barbershopsTable.id))
    .leftJoin(servicesTable, eq(appointmentsTable.serviceId, servicesTable.id))
    .where(and(
      eq(appointmentsTable.userId, req.user!.id),
      eq(appointmentsTable.status, "confirmed"),
    ));

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LineUP//Barber Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const row of appts) {
    const start = new Date(row.appt.scheduledAt);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:lineup-appt-${row.appt.id}@trimkosova.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${row.svc?.name ?? "Takim"} @ ${row.shop?.name ?? ""}`,
      `LOCATION:${row.shop?.address ?? ""}`,
      `DESCRIPTION:Takimi konfirmuar – ${row.svc?.name ?? ""}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="lineup-appointments.ics"');
  res.send(lines.join("\r\n"));
});

export default router;
