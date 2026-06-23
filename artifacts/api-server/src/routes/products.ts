import { Router } from "express";
import { db, productsTable, barbershopsTable } from "@workspace/db";
import { eq, and, ilike, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

function formatProduct(p: any) {
  return { ...p, price: parseFloat(p.price) };
}

router.get("/products", async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const conditions = [eq(productsTable.isAvailable, true)];
  if (req.query.shopId) conditions.push(eq(productsTable.shopId, parseInt(req.query.shopId as string)));
  if (req.query.search) conditions.push(ilike(productsTable.name, `%${req.query.search}%`));
  const products = await db.select().from(productsTable).where(and(...conditions)).orderBy(desc(productsTable.createdAt)).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(and(...conditions));
  res.json({ data: products.map(formatProduct), total: count });
});

router.get("/barbershops/:shopId/products", async (req, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const products = await db.select().from(productsTable).where(eq(productsTable.shopId, shopId));
  res.json(products.map(formatProduct));
});

router.post("/barbershops/:shopId/products", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { name, description, price, imageUrl, stock, category } = req.body;
  if (!name || price == null) { res.status(400).json({ error: "name and price are required" }); return; }
  const [product] = await db.insert(productsTable).values({
    shopId, name, description: description ?? null, price: price.toString(),
    imageUrl: imageUrl ?? null, stock: stock ?? 0, category: category ?? null,
  }).returning();
  res.status(201).json(formatProduct(product));
});

router.patch("/barbershops/:shopId/products/:productId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const productId = parseInt(Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { name, description, price, imageUrl, stock, category, isAvailable } = req.body;
  const updateData: any = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price != null) updateData.price = price.toString();
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (stock !== undefined) updateData.stock = stock;
  if (category !== undefined) updateData.category = category;
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
  const [product] = await db.update(productsTable).set(updateData).where(and(eq(productsTable.id, productId), eq(productsTable.shopId, shopId))).returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(formatProduct(product));
});

router.delete("/barbershops/:shopId/products/:productId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const shopId = parseInt(Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId);
  const productId = parseInt(Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId);
  const [shop] = await db.select().from(barbershopsTable).where(eq(barbershopsTable.id, shopId));
  if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
  if (req.user!.role !== "admin" && shop.ownerId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  await db.delete(productsTable).where(and(eq(productsTable.id, productId), eq(productsTable.shopId, shopId)));
  res.sendStatus(204);
});

export default router;
