import { Router } from "express";
import { db, paymentsTable, barbershopsTable, ordersTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../lib/auth";
import { logger } from "../lib/logger";

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

router.post("/payments/create-subscription", requireAuth, requireRole("owner"), async (req: AuthRequest, res): Promise<void> => {
  const { shopId } = req.body;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY to environment." }); return;
  }
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
  if (!stripeRes.ok) {
    const err = await stripeRes.json();
    logger.error({ err }, "Stripe error creating subscription");
    res.status(500).json({ error: "Failed to create Stripe session" }); return;
  }
  const session = await stripeRes.json() as any;
  res.json({ sessionId: session.id, url: session.url });
});

router.post("/payments/create-checkout", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { orderId } = req.body;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY to environment." }); return;
  }
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
  if (!stripeRes.ok) {
    const err = await stripeRes.json();
    logger.error({ err }, "Stripe error creating checkout");
    res.status(500).json({ error: "Failed to create Stripe session" }); return;
  }
  const session = await stripeRes.json() as any;
  res.json({ sessionId: session.id, url: session.url });
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

router.post("/payments/create-ad-checkout", async (req, res): Promise<void> => {
  const { package: pkg, business, contact, city } = req.body;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY to environment." }); return;
  }
  const amountCents = AD_PACKAGE_PRICES[pkg];
  if (!amountCents) { res.status(400).json({ error: "Invalid package" }); return; }

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
  if (!stripeRes.ok) {
    const err = await stripeRes.json() as any;
    logger.error({ err }, "Stripe error creating ad checkout");
    res.status(500).json({ error: "Failed to create Stripe session" }); return;
  }
  const session = await stripeRes.json() as any;
  res.json({ sessionId: session.id, url: session.url });
});

router.post("/payments/webhook", async (req, res): Promise<void> => {
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  logger.info("Stripe webhook received");
  const event = req.body;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.metadata?.shopId) {
      await db.update(barbershopsTable).set({ subscriptionStatus: "active", stripeSubscriptionId: session.subscription }).where(eq(barbershopsTable.id, parseInt(session.metadata.shopId)));
      await db.insert(paymentsTable).values({ shopId: parseInt(session.metadata.shopId), amount: "10.00", type: "subscription", status: "completed", stripePaymentId: session.id });
    }
    if (session.metadata?.orderId) {
      await db.update(ordersTable).set({ status: "paid", stripeSessionId: session.id }).where(eq(ordersTable.id, parseInt(session.metadata.orderId)));
    }
  }
  res.json({ received: true });
});

export default router;
