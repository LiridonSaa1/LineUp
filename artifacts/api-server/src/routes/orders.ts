import { Router } from "express";
import { db, ordersTable, orderItemsTable, productsTable, usersTable, activityLogTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

function formatOrder(o: any, items: any[] = []) {
  return {
    ...o,
    totalAmount: parseFloat(o.totalAmount),
    items: items.map(i => ({ ...i, unitPrice: parseFloat(i.unitPrice), product: i.product ? { ...i.product, price: parseFloat(i.product.price) } : null })),
  };
}

router.get("/orders", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const conditions = [];
  if (req.user!.role === "user") conditions.push(eq(ordersTable.userId, req.user!.id));
  else if (req.query.userId) conditions.push(eq(ordersTable.userId, parseInt(req.query.userId as string)));
  if (req.query.status) conditions.push(eq(ordersTable.status, req.query.status as any));

  const orders = await db.select().from(ordersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit).offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const result = await Promise.all(orders.map(async order => {
    const items = await db.select({ item: orderItemsTable, product: productsTable })
      .from(orderItemsTable)
      .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
      .where(eq(orderItemsTable.orderId, order.id));
    return formatOrder(order, items.map(i => ({ ...i.item, product: i.product })));
  }));

  res.json({ data: result, total: count });
});

router.post("/orders", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "items are required" }); return;
  }

  let total = 0;
  const enrichedItems = [];
  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) { res.status(404).json({ error: `Product ${item.productId} not found` }); return; }
    const unitPrice = parseFloat(product.price);
    total += unitPrice * item.quantity;
    enrichedItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: unitPrice.toString() });
  }

  const [order] = await db.insert(ordersTable).values({ userId: req.user!.id, status: "pending", totalAmount: total.toString() }).returning();

  for (const item of enrichedItems) {
    await db.insert(orderItemsTable).values({ orderId: order.id, ...item });
  }

  await db.insert(activityLogTable).values({ type: "product_ordered", description: "Product order placed", userId: req.user!.id });

  const orderItems = await db.select({ item: orderItemsTable, product: productsTable })
    .from(orderItemsTable)
    .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, order.id));

  res.status(201).json(formatOrder(order, orderItems.map(i => ({ ...i.item, product: i.product }))));
});

router.get("/orders/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  if (req.user!.role === "user" && order.userId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const items = await db.select({ item: orderItemsTable, product: productsTable })
    .from(orderItemsTable).leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, id));
  res.json(formatOrder(order, items.map(i => ({ ...i.item, product: i.product }))));
});

router.patch("/orders/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { status } = req.body;

  // Fetch the order first to enforce ownership / role checks
  const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  // Regular users can only cancel their own orders; admins can update any order
  if (req.user!.role === "user") {
    if (existing.userId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    // Users may only cancel, not set arbitrary statuses
    if (status !== "cancelled") {
      res.status(403).json({ error: "Forbidden" }); return;
    }
  }

  const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatOrder(order));
});

export default router;
