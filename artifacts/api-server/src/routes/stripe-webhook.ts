import type { RequestHandler } from "express";
import crypto from "crypto";
import { db, paymentsTable, barbershopsTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

function isStripeSubscriptionActive(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

async function updateShopSubscriptionState({
  shopId,
  stripeSubscriptionId,
  subscriptionStatus,
  maxBarbers,
}: {
  shopId?: number | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus: string;
  maxBarbers?: number | null;
}) {
  const active = isStripeSubscriptionActive(subscriptionStatus);
  const updateData: any = {
    subscriptionStatus,
    status: active ? "active" : "suspended",
    ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
    ...(Number.isFinite(maxBarbers) && maxBarbers ? { maxBarbers } : {}),
  };

  if (shopId) {
    await db.update(barbershopsTable).set(updateData).where(eq(barbershopsTable.id, shopId));
    return;
  }

  if (stripeSubscriptionId) {
    await db
      .update(barbershopsTable)
      .set(updateData)
      .where(eq(barbershopsTable.stripeSubscriptionId, stripeSubscriptionId));
  }
}

function verifyStripeSignature(rawBody: Buffer, header: string, secret: string): boolean {
  const parts = header.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [key, ...rest] = part.split("=");
    if (!acc[key]) acc[key] = [];
    acc[key].push(rest.join("="));
    return acc;
  }, {});

  const timestamp = parts["t"]?.[0];
  const signatures = parts["v1"] ?? [];

  if (!timestamp || signatures.length === 0) return false;

  const tolerance = 300;
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > tolerance) {
    logger.warn({ timestamp }, "Stripe webhook timestamp too old (replay attack guard)");
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  return signatures.some((sig) => {
    try {
      const a = Buffer.from(sig, "hex");
      const b = Buffer.from(expected, "hex");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

const stripeWebhookHandler: RequestHandler = async (req, res): Promise<void> => {
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  if (!STRIPE_WEBHOOK_SECRET) {
    logger.warn("STRIPE_WEBHOOK_SECRET not set — rejecting webhook");
    res.status(400).json({ error: "Webhook secret not configured" });
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
    res.status(400).json({ error: "Empty or non-raw body — check middleware order" });
    return;
  }

  let valid = false;
  try {
    valid = verifyStripeSignature(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error({ err }, "Stripe signature verification threw");
    res.status(400).json({ error: "Signature verification error" });
    return;
  }

  if (!valid) {
    logger.warn("Stripe webhook: invalid signature");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  let event: any;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  logger.info({ type: event.type, id: event.id }, "Stripe webhook verified");

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.metadata?.shopId) {
          const shopId = parseInt(session.metadata.shopId);
          const maxBarbers = session.metadata.maxBarbers ? parseInt(session.metadata.maxBarbers) : null;
          await db
            .update(barbershopsTable)
            .set({
              subscriptionStatus: "active",
              status: "active",
              stripeSubscriptionId: session.subscription ?? null,
              ...(Number.isFinite(maxBarbers) && maxBarbers ? { maxBarbers } : {}),
            })
            .where(eq(barbershopsTable.id, shopId));

          await db.insert(paymentsTable).values({
            shopId,
            amount: ((session.amount_total ?? 0) / 100).toFixed(2),
            type: "subscription",
            status: "completed",
            stripePaymentId: session.id,
          });

          logger.info({ shopId }, "checkout.session.completed → subscription activated");
        }

        if (session.metadata?.orderId) {
          const orderId = parseInt(session.metadata.orderId);
          await db
            .update(ordersTable)
            .set({ status: "paid", stripeSessionId: session.id })
            .where(eq(ordersTable.id, orderId));

          logger.info({ orderId }, "checkout.session.completed → order marked paid");
        }

        if (session.metadata?.ad_package) {
          logger.info(
            {
              business: session.metadata.business,
              package: session.metadata.ad_package,
              contact: session.metadata.contact,
            },
            "checkout.session.completed → ad package payment received",
          );
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const shopId = subscription.metadata?.shopId ? parseInt(subscription.metadata.shopId) : null;
        const maxBarbers = subscription.metadata?.maxBarbers ? parseInt(subscription.metadata.maxBarbers) : null;

        // "incomplete" is a transient state that appears immediately after checkout
        // before the first invoice payment is confirmed. Skipping it here prevents
        // it from overwriting the "active" status already set by checkout.session.completed
        // or confirm-subscription-session. invoice.payment_succeeded handles the
        // transition to "active" once the payment clears.
        if (subscription.status === "incomplete" || subscription.status === "incomplete_expired") {
          logger.info({ shopId, subscriptionId: subscription.id, status: subscription.status }, "Stripe subscription incomplete — skipping DB write (handled by checkout.session.completed)");
          break;
        }

        await updateShopSubscriptionState({
          shopId,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          maxBarbers,
        });

        logger.info({ shopId, subscriptionId: subscription.id, status: subscription.status }, "Stripe subscription state synced");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const shopId = subscription.metadata?.shopId ? parseInt(subscription.metadata.shopId) : null;

        await updateShopSubscriptionState({
          shopId,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: "canceled",
        });

        logger.info({ shopId, subscriptionId: subscription.id }, "Stripe subscription canceled");
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;

        if (subscriptionId) {
          await updateShopSubscriptionState({
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "active",
          });
        }

        logger.info({ subscriptionId, invoiceId: invoice.id }, "Stripe invoice payment succeeded");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;

        if (subscriptionId) {
          await updateShopSubscriptionState({
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "past_due",
          });
        }

        logger.warn({ subscriptionId, invoiceId: invoice.id }, "Stripe invoice payment failed");
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object;
        logger.info(
          { paymentIntentId: pi.id, amountReceived: pi.amount_received, currency: pi.currency },
          "payment_intent.succeeded",
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        logger.warn(
          {
            paymentIntentId: pi.id,
            errorCode: pi.last_payment_error?.code,
            errorMessage: pi.last_payment_error?.message,
          },
          "payment_intent.payment_failed",
        );
        break;
      }

      default:
        logger.info({ type: event.type }, "Stripe webhook: unhandled event type (ignored)");
    }
  } catch (err) {
    logger.error({ err, eventType: event.type }, "Error processing Stripe event — returning 200 to avoid retry flood");
  }

  res.status(200).json({ received: true });
};

export default stripeWebhookHandler;
