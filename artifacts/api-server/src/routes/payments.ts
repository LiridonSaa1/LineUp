import { Router } from "express";
import { db, paymentsTable, barbershopsTable, ordersTable, usersTable, adsTable } from "@workspace/db";
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

  // Owners may only see payments for their own shop(s)
  if (req.user!.role === "owner") {
    const ownerShops = await db.select({ id: barbershopsTable.id })
      .from(barbershopsTable).where(eq(barbershopsTable.ownerId, req.user!.id));
    const shopIds = ownerShops.map((s) => s.id);
    if (shopIds.length === 0) { res.json({ data: [], total: 0 }); return; }
    if (req.query.shopId) {
      const requestedId = parseInt(req.query.shopId as string);
      if (!shopIds.includes(requestedId)) { res.status(403).json({ error: "Forbidden" }); return; }
      conditions.push(eq(paymentsTable.shopId, requestedId));
    } else {
      conditions.push(sql`${paymentsTable.shopId} = ANY(ARRAY[${sql.join(shopIds.map(id => sql`${id}`), sql`, `)}]::int[])`);
    }
  } else {
    if (req.query.shopId) conditions.push(eq(paymentsTable.shopId, parseInt(req.query.shopId as string)));
  }

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
  "2": { maxBarbers: 2, amountCents: 500,  name: "LineUp Starter — 2 Punëtorë" },
  "4": { maxBarbers: 4, amountCents: 1000, name: "LineUp Standard — 4 Punëtorë" },
  "6": { maxBarbers: 6, amountCents: 1500, name: "LineUp Pro — 6 Punëtorë" },
  "8": { maxBarbers: 8, amountCents: 2000, name: "LineUp Business — 8 Punëtorë" },
};

function getSubscriptionPackage(packageId: unknown) {
  return SUBSCRIPTION_PACKAGES[String(packageId)];
}

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

    /* ── Stripe Checkout Session (embedded, subscription mode) ───────────────
       The Subscriptions API no longer creates a payment_intent on invoices in
       newer API versions. Checkout Sessions always return a client_secret and
       handle subscription creation automatically on payment completion.        */
    const domains = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
    const protocol = domains.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${domains}`;

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        mode: "subscription",
        ui_mode: "embedded_page",
        customer: customer.id,
        "line_items[0][price_data][currency]": "eur",
        "line_items[0][price_data][product_data][name]": pkg.name,
        "line_items[0][price_data][product_data][description]": `${pkg.maxBarbers} punëtorë · ${businessName}`,
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][price_data][unit_amount]": pkg.amountCents.toString(),
        "line_items[0][quantity]": "1",
        return_url: `${baseUrl}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
        "metadata[shopId]": shop.id.toString(),
        "metadata[ownerName]": ownerName,
        "metadata[ownerEmail]": email,
        "metadata[shopName]": businessName,
        "metadata[packageId]": String(packageId),
        "metadata[maxBarbers]": pkg.maxBarbers.toString(),
        "metadata[amountEur]": (pkg.amountCents / 100).toFixed(2),
      }),
    });
    const sessionBody = await sessionRes.text();
    if (!sessionRes.ok) {
      let err: any = {}; try { err = JSON.parse(sessionBody); } catch {}
      await db.delete(usersTable).where(eq(usersTable.id, user.id));
      res.status(500).json({ error: err?.error?.message ?? "Gabim gjatë krijimit të sesionit të pagesës" }); return;
    }
    const session = JSON.parse(sessionBody);
    const clientSecret: string | undefined = session.client_secret;
    if (!clientSecret) {
      logger.error({ sessionId: session.id }, "Checkout session has no client_secret");
      await db.delete(usersTable).where(eq(usersTable.id, user.id));
      res.status(500).json({ error: "Stripe nuk ktheu clientSecret" }); return;
    }

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
  const { shopId, packageId = "4" } = req.body;
  const pkg = getSubscriptionPackage(packageId);
  if (!pkg) { res.status(400).json({ error: "Paketa e zgjedhur nuk është e vlefshme" }); return; }
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY to environment." }); return;
  }
  try {
    const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    // Owners may only create a subscription for their own shop
    if (shop.ownerId !== req.user!.id) { res.status(403).json({ error: "Forbidden" }); return; }
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
        "line_items[0][price_data][product_data][name]": pkg.name,
        "line_items[0][price_data][product_data][description]": `${pkg.maxBarbers} punëtorë · ${shop.name}`,
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][price_data][unit_amount]": pkg.amountCents.toString(),
        "line_items[0][quantity]": "1",
        success_url: `${baseUrl}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dashboard/subscription?cancelled=true`,
        "metadata[shopId]": shopId.toString(),
        "metadata[packageId]": String(packageId),
        "metadata[maxBarbers]": pkg.maxBarbers.toString(),
        "metadata[amountEur]": (pkg.amountCents / 100).toFixed(2),
        "subscription_data[metadata][shopId]": shop.id.toString(),
        "subscription_data[metadata][packageId]": String(packageId),
        "subscription_data[metadata][maxBarbers]": pkg.maxBarbers.toString(),
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

router.post("/payments/confirm-subscription-session", requireAuth, requireRole("owner"), async (req: AuthRequest, res): Promise<void> => {
  const { sessionId } = req.body;
  if (!sessionId) { res.status(400).json({ error: "sessionId is required" }); return; }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe nuk eshte konfiguruar." }); return;
  }

  try {
    const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(String(sessionId))}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    const sessionBody = await sessionRes.text();
    if (!sessionRes.ok) {
      let err: any = {}; try { err = JSON.parse(sessionBody); } catch {}
      res.status(500).json({ error: err?.error?.message ?? "Nuk u lexua sesioni nga Stripe" }); return;
    }

    const session = JSON.parse(sessionBody);
    const shopId = session.metadata?.shopId ? parseInt(session.metadata.shopId) : null;
    if (!shopId) { res.status(400).json({ error: "Sesioni nuk ka shopId" }); return; }

    const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    if (shop.ownerId !== req.user!.id) { res.status(403).json({ error: "Forbidden" }); return; }

    if (session.status !== "complete" || !["paid", "no_payment_required"].includes(session.payment_status)) {
      res.status(400).json({ error: "Pagesa ende nuk eshte konfirmuar nga Stripe." }); return;
    }

    const maxBarbers = session.metadata?.maxBarbers ? parseInt(session.metadata.maxBarbers) : null;
    await db
      .update(barbershopsTable)
      .set({
        subscriptionStatus: "active",
        status: "active",
        stripeSubscriptionId: session.subscription ?? shop.stripeSubscriptionId ?? null,
        ...(Number.isFinite(maxBarbers) && maxBarbers ? { maxBarbers } : {}),
      })
      .where(eq(barbershopsTable.id, shop.id));

    await db.insert(paymentsTable).values({
      shopId: shop.id,
      amount: ((session.amount_total ?? 0) / 100).toFixed(2),
      type: "subscription",
      status: "completed",
      stripePaymentId: session.id,
    }).onConflictDoNothing();

    res.json({ ok: true, shopId: shop.id, subscriptionStatus: "active" });
  } catch (err: any) {
    logger.error({ err }, "Unexpected error confirming subscription session");
    res.status(500).json({ error: err?.message ?? "Gabim i brendshem" });
  }
});

router.post("/payments/change-subscription", requireAuth, requireRole("owner"), async (req: AuthRequest, res): Promise<void> => {
  const { shopId, packageId } = req.body;
  const pkg = getSubscriptionPackage(packageId);
  if (!pkg) { res.status(400).json({ error: "Paketa e zgjedhur nuk është e vlefshme" }); return; }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe nuk është konfiguruar." }); return;
  }

  try {
    const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    if (shop.ownerId !== req.user!.id) { res.status(403).json({ error: "Forbidden" }); return; }
    if (!shop.stripeSubscriptionId || shop.subscriptionStatus !== "active") {
      res.status(400).json({ error: "Ky dyqan nuk ka subscription aktiv për ndryshim plani." }); return;
    }

    const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${shop.stripeSubscriptionId}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    const subBody = await subRes.text();
    if (!subRes.ok) {
      let err: any = {}; try { err = JSON.parse(subBody); } catch {}
      res.status(500).json({ error: err?.error?.message ?? "Nuk u lexua subscription-i nga Stripe" }); return;
    }
    const subscription = JSON.parse(subBody);
    const itemId = subscription.items?.data?.[0]?.id;
    if (!itemId) { res.status(500).json({ error: "Subscription-i nuk ka item aktiv në Stripe" }); return; }

    const priceRes = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        currency: "eur",
        unit_amount: pkg.amountCents.toString(),
        "recurring[interval]": "month",
        "product_data[name]": pkg.name,
        "product_data[metadata][packageId]": String(packageId),
        "product_data[metadata][maxBarbers]": pkg.maxBarbers.toString(),
      }),
    });
    const priceBody = await priceRes.text();
    if (!priceRes.ok) {
      let err: any = {}; try { err = JSON.parse(priceBody); } catch {}
      res.status(500).json({ error: err?.error?.message ?? "Nuk u krijua çmimi në Stripe" }); return;
    }
    const price = JSON.parse(priceBody);

    const updateRes = await fetch(`https://api.stripe.com/v1/subscriptions/${shop.stripeSubscriptionId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "items[0][id]": itemId,
        "items[0][price]": price.id,
        proration_behavior: "create_prorations",
        "metadata[shopId]": shop.id.toString(),
        "metadata[packageId]": String(packageId),
        "metadata[maxBarbers]": pkg.maxBarbers.toString(),
        "metadata[amountEur]": (pkg.amountCents / 100).toFixed(2),
        "subscription_data[metadata][shopId]": shop.id.toString(),
        "subscription_data[metadata][packageId]": String(packageId),
        "subscription_data[metadata][maxBarbers]": pkg.maxBarbers.toString(),
      }),
    });
    const updateBody = await updateRes.text();
    if (!updateRes.ok) {
      let err: any = {}; try { err = JSON.parse(updateBody); } catch {}
      res.status(500).json({ error: err?.error?.message ?? "Nuk u ndryshua subscription-i në Stripe" }); return;
    }

    await db.update(barbershopsTable).set({ maxBarbers: pkg.maxBarbers }).where(eq(barbershopsTable.id, shop.id));

    res.json({
      ok: true,
      packageId: String(packageId),
      maxBarbers: pkg.maxBarbers,
      price: pkg.amountCents / 100,
    });
  } catch (err: any) {
    logger.error({ err }, "Unexpected error changing subscription");
    res.status(500).json({ error: err?.message ?? "Gabim i brendshëm" });
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
  basic: 900,
  standard: 1900,
  premium: 3000,
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
