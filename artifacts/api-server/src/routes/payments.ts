import { Router } from "express";
import { db, paymentsTable, barbershopsTable, ordersTable, usersTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest, generateToken, hashPassword } from "../lib/auth";
import { logger } from "../lib/logger";
import { sendWelcomeEmail } from "../lib/email";

const router = Router();

function formatPayment(p: any) {
  return { ...p, amount: parseFloat(p.amount) };
}

router.get("/payments", requireAuth, requireRole("admin", "owner"), async (req: AuthRequest, res): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const conditions = [];
  if (req.query.shopId) conditions.push(eq(paymentsTable.shopId, parseInt(req.query.shopId as string)));
  if (req.query.type) conditions.push(eq(paymentsTable.type, req.query.type as any));

  const payments = await db.select().from(paymentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(paymentsTable.createdAt))
    .limit(limit).offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(paymentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  res.json({ data: payments.map(formatPayment), total: count });
});

const SUBSCRIPTION_PACKAGES: Record<string, { maxBarbers: number; amountCents: number; name: string }> = {
  "2": { maxBarbers: 2, amountCents: 500,  name: "TRIM Starter — 2 Punëtorë" },
  "4": { maxBarbers: 4, amountCents: 1000, name: "TRIM Standard — 4 Punëtorë" },
  "6": { maxBarbers: 6, amountCents: 1500, name: "TRIM Pro — 6 Punëtorë" },
  "8": { maxBarbers: 8, amountCents: 2000, name: "TRIM Business — 8 Punëtorë" },
};

router.post("/payments/register-owner-subscription", async (req, res): Promise<void> => {
  const { ownerName, email, password, phone, businessName, city, address, packageId } = req.body;
  if (!ownerName || !email || !password || !businessName || !city || !address || !packageId) {
    res.status(400).json({ error: "Fushat e detyrueshme mungojnë" }); return;
  }
  const pkg = SUBSCRIPTION_PACKAGES[String(packageId)];
  if (!pkg) { res.status(400).json({ error: "Paketa e zgjedhur nuk është e vlefshme" }); return; }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe nuk është konfiguruar." }); return;
  }

  let userId: number | null = null;
  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) { res.status(400).json({ error: "Ky email është i regjistruar tashmë" }); return; }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      name: ownerName, email, passwordHash, role: "owner", phone: phone ?? null,
    }).returning();
    userId = user.id;

    const subdomain = businessName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const [shop] = await db.insert(barbershopsTable).values({
      ownerId: user.id, name: businessName, city, address,
      phone: phone ?? null, subdomain, status: "pending", gender: "both",
      maxBarbers: pkg.maxBarbers,
    }).returning();

    /* ── Stripe Customer ─────────────────────────────────── */
    const custRes = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email, name: ownerName, "metadata[shopId]": shop.id.toString() }),
    });
    const custBody = await custRes.text();
    if (!custRes.ok) {
      let err: any = {}; try { err = JSON.parse(custBody); } catch {}
      await db.delete(usersTable).where(eq(usersTable.id, user.id));
      res.status(500).json({ error: err?.error?.message ?? "Gabim gjatë krijimit të klientit Stripe" }); return;
    }
    const customer = JSON.parse(custBody);

    await db.update(barbershopsTable).set({ stripeCustomerId: customer.id }).where(eq(barbershopsTable.id, shop.id));

    /* ── Stripe Subscription ─────────────────────────────── */
    const subParams = new URLSearchParams({
      customer: customer.id,
      payment_behavior: "default_incomplete",
      "items[0][price_data][currency]": "eur",
      "items[0][price_data][product_data][name]": pkg.name,
      "items[0][price_data][product_data][description]": `${pkg.maxBarbers} punëtorë · ${businessName}`,
      "items[0][price_data][recurring][interval]": "month",
      "items[0][price_data][unit_amount]": pkg.amountCents.toString(),
      "items[0][quantity]": "1",
      "metadata[shopId]": shop.id.toString(),
      "metadata[ownerName]": ownerName,
      "metadata[ownerEmail]": email,
      "metadata[shopName]": businessName,
      "metadata[packageId]": String(packageId),
      "metadata[amountEur]": (pkg.amountCents / 100).toFixed(2),
      "expand[]": "latest_invoice.payment_intent",
    });

    const subRes = await fetch("https://api.stripe.com/v1/subscriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: subParams,
    });
    const subBody = await subRes.text();
    if (!subRes.ok) {
      let err: any = {}; try { err = JSON.parse(subBody); } catch {}
      await db.delete(usersTable).where(eq(usersTable.id, user.id));
      res.status(500).json({ error: err?.error?.message ?? "Gabim gjatë krijimit të abonimit" }); return;
    }
    const sub = JSON.parse(subBody) as any;
    const clientSecret: string | undefined = sub.latest_invoice?.payment_intent?.client_secret;
    if (!clientSecret) {
      await db.delete(usersTable).where(eq(usersTable.id, user.id));
      res.status(500).json({ error: "Stripe nuk ktheu clientSecret — provoni përsëri" }); return;
    }

    await db.update(barbershopsTable)
      .set({ stripeSubscriptionId: sub.id })
      .where(eq(barbershopsTable.id, shop.id));

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    sendWelcomeEmail({ to: { email: user.email, name: user.name }, role: "owner" }).catch(() => {});

    res.status(201).json({
      clientSecret,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      shopId: shop.id,
    });
  } catch (err: any) {
    if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId)).catch(() => {});
    logger.error({ err }, "Unexpected error in register-owner-subscription");
    res.status(500).json({ error: err?.message ?? "Gabim i brendshëm" });
  }
});

router.post("/payments/create-subscription", requireAuth, requireRole("owner"), async (req: AuthRequest, res): Promise<void> => {
  const { shopId } = req.body;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY to environment." }); return;
  }
  try {
    const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    const domains = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
    const protocol = domains.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${domains}`;

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "subscription",
        "line_items[0][price_data][currency]": "eur",
        "line_items[0][price_data][product_data][name]": "Barbershop Monthly Subscription",
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][price_data][unit_amount]": "1000",
        "line_items[0][quantity]": "1",
        success_url: `${baseUrl}/dashboard/subscription?success=true`,
        cancel_url: `${baseUrl}/dashboard/subscription?cancelled=true`,
        "metadata[shopId]": shopId.toString(),
      }),
    });
    const stripeBody = await stripeRes.text();
    if (!stripeRes.ok) {
      let err: any = {};
      try { err = JSON.parse(stripeBody); } catch {}
      logger.error({ err }, "Stripe error creating subscription");
      res.status(500).json({ error: err?.error?.message ?? "Failed to create Stripe session" }); return;
    }
    const session = JSON.parse(stripeBody);
    res.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    logger.error({ err }, "Unexpected error creating subscription");
    res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

router.post("/payments/create-checkout", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { orderId } = req.body;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY to environment." }); return;
  }
  try {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    // Only the order owner or an admin may create a checkout session for it
    if (req.user!.role === "user" && order.userId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    const domains = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
    const protocol = domains.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${domains}`;

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "line_items[0][price_data][currency]": "eur",
        "line_items[0][price_data][product_data][name]": `Order #${orderId}`,
        "line_items[0][price_data][unit_amount]": Math.round(parseFloat(order.totalAmount) * 100).toString(),
        "line_items[0][quantity]": "1",
        success_url: `${baseUrl}/orders?success=true`,
        cancel_url: `${baseUrl}/orders`,
        "metadata[orderId]": orderId.toString(),
      }),
    });
    const stripeBody = await stripeRes.text();
    if (!stripeRes.ok) {
      let err: any = {};
      try { err = JSON.parse(stripeBody); } catch {}
      logger.error({ err }, "Stripe error creating checkout");
      res.status(500).json({ error: err?.error?.message ?? "Failed to create Stripe session" }); return;
    }
    const session = JSON.parse(stripeBody);
    res.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    logger.error({ err }, "Unexpected error creating checkout");
    res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

const AD_PACKAGE_PRICES: Record<string, number> = {
  basic: 2900,
  standard: 7900,
  premium: 14900,
};

const AD_PACKAGE_NAMES: Record<string, string> = {
  basic: "Paketë Reklame Basic (7 ditë)",
  standard: "Paketë Reklame Standard (30 ditë)",
  premium: "Paketë Reklame Premium (30 ditë)",
};

router.get("/payments/stripe-config", (_req, res): void => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) { res.status(503).json({ error: "Stripe not configured" }); return; }
  res.json({ publishableKey });
});

router.post("/payments/create-ad-payment-intent", async (req, res): Promise<void> => {
  const { package: pkg, business, contact, city, address } = req.body;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe not configured" }); return;
  }
  const amountCents = AD_PACKAGE_PRICES[pkg];
  if (!amountCents) { res.status(400).json({ error: "Invalid package" }); return; }
  try {
    const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: amountCents.toString(),
        currency: "eur",
        "payment_method_types[]": "card",
        "metadata[ad_package]": pkg ?? "",
        "metadata[business]": business ?? "",
        "metadata[contact]": contact ?? "",
        "metadata[city]": city ?? "",
        "metadata[address]": address ?? "",
      }),
    });
    const stripeBody = await stripeRes.text();
    if (!stripeRes.ok) {
      let err: any = {};
      try { err = JSON.parse(stripeBody); } catch {}
      logger.error({ err }, "Stripe error creating PaymentIntent for ad");
      res.status(500).json({ error: err?.error?.message ?? "Failed to create payment" }); return;
    }
    const intent = JSON.parse(stripeBody);
    res.json({ clientSecret: intent.client_secret });
  } catch (err: any) {
    logger.error({ err }, "Unexpected error creating ad payment intent");
    res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

router.post("/payments/create-ad-checkout", async (req, res): Promise<void> => {
  const { package: pkg, business, contact, city } = req.body;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY to environment." }); return;
  }
  const amountCents = AD_PACKAGE_PRICES[pkg];
  if (!amountCents) { res.status(400).json({ error: "Invalid package" }); return; }
  try {
    const domains = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
    const protocol = domains.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${domains}`;

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "line_items[0][price_data][currency]": "eur",
        "line_items[0][price_data][product_data][name]": AD_PACKAGE_NAMES[pkg] ?? "Paketë Reklame",
        "line_items[0][price_data][product_data][description]": `Biznesi: ${business} · Kontakt: ${contact}${city ? ` · Qyteti: ${city}` : ""}`,
        "line_items[0][price_data][unit_amount]": amountCents.toString(),
        "line_items[0][quantity]": "1",
        success_url: `${baseUrl}/?ad_success=true`,
        cancel_url: `${baseUrl}/`,
        "metadata[ad_package]": pkg,
        "metadata[business]": business,
        "metadata[contact]": contact,
      }),
    });
    const stripeBody = await stripeRes.text();
    if (!stripeRes.ok) {
      let err: any = {};
      try { err = JSON.parse(stripeBody); } catch {}
      logger.error({ err }, "Stripe error creating ad checkout");
      res.status(500).json({ error: err?.error?.message ?? "Failed to create Stripe session" }); return;
    }
    const session = JSON.parse(stripeBody);
    res.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    logger.error({ err }, "Unexpected error creating ad checkout");
    res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

export default router;
