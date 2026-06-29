import { Router } from "express";
import { db, paymentsTable, barbershopsTable, ordersTable, usersTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest, generateToken, hashPassword } from "../lib/auth";
import { logger } from "../lib/logger";
import { sendSubscriptionInvoiceEmail, sendWelcomeEmail } from "../lib/email";
import crypto from "crypto";

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

router.post("/payments/register-owner-subscription", async (req, res): Promise<void> => {
  const { ownerName, email, password, phone, businessName, businessNumber, city, address, description, imageUrl, photos } = req.body;
  if (!ownerName || !email || !password || !businessName || !city || !address) {
    res.status(400).json({ error: "Fushat e detyrueshme mungojnë" }); return;
  }
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe nuk është konfiguruar. Shto STRIPE_SECRET_KEY." }); return;
  }
  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) { res.status(400).json({ error: "Ky email është i regjistruar tashmë" }); return; }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      name: ownerName, email, passwordHash, role: "owner", phone: phone ?? null,
    }).returning();

    const subdomain = businessName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const [shop] = await db.insert(barbershopsTable).values({
      ownerId: user.id, name: businessName, city, address,
      description: description ?? null, phone: phone ?? null,
      imageUrl: imageUrl ?? null,
      photos: Array.isArray(photos) && photos.length > 0 ? photos : null,
      businessNumber: businessNumber ?? null,
      subdomain, status: "pending", gender: "both",
    }).returning();

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
        "line_items[0][price_data][product_data][name]": "TRIM Pro — Abonim Mujor",
        "line_items[0][price_data][product_data][description]": `Barbershop: ${businessName}`,
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][price_data][unit_amount]": "500",
        "line_items[0][quantity]": "1",
        customer_email: email,
        success_url: `${baseUrl}/dashboard?sub_success=true`,
        cancel_url: `${baseUrl}/register?cancelled=true`,
        "metadata[shopId]": shop.id.toString(),
        "metadata[ownerName]": ownerName,
        "metadata[ownerEmail]": email,
        "metadata[shopName]": businessName,
      }),
    });

    const stripeBody = await stripeRes.text();
    if (!stripeRes.ok) {
      let err: any = {};
      try { err = JSON.parse(stripeBody); } catch {}
      logger.error({ err }, "Stripe error creating owner subscription");
      await db.delete(usersTable).where(eq(usersTable.id, user.id));
      res.status(500).json({ error: err?.error?.message ?? "Gabim gjatë krijimit të sesionit Stripe" }); return;
    }
    const session = JSON.parse(stripeBody);
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    sendWelcomeEmail({ to: { email: user.email, name: user.name }, role: "owner" }).catch(() => {});

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      stripeUrl: session.url,
    });
  } catch (err: any) {
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

router.post("/payments/webhook", async (req, res): Promise<void> => {
  logger.info("Stripe webhook received");
  const event = req.body;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.metadata?.shopId) {
      const shopId = parseInt(session.metadata.shopId);
      await db.update(barbershopsTable)
        .set({ subscriptionStatus: "active", stripeSubscriptionId: session.subscription })
        .where(eq(barbershopsTable.id, shopId));
      await db.insert(paymentsTable).values({
        shopId, amount: "5.00", type: "subscription", status: "completed", stripePaymentId: session.id,
      });

      const invoiceNumber = `INV-${Date.now()}-${shopId}`;
      const ownerEmail = session.metadata?.ownerEmail ?? session.customer_email;
      const ownerName  = session.metadata?.ownerName  ?? "Pronar";
      const shopName   = session.metadata?.shopName   ?? "Saloni";

      if (ownerEmail) {
        sendSubscriptionInvoiceEmail({
          to: { email: ownerEmail, name: ownerName },
          shopName,
          amount: "5.00",
          invoiceDate: new Date(),
          invoiceNumber,
        }).catch(() => {});
      }
    }
    if (session.metadata?.orderId) {
      await db.update(ordersTable)
        .set({ status: "paid", stripeSessionId: session.id })
        .where(eq(ordersTable.id, parseInt(session.metadata.orderId)));
    }
  }
  res.json({ received: true });
});

export default router;
