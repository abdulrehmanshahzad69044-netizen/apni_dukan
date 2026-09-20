import { and, asc, eq, isNull, like, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import {
  categories,
  companies,
  products,
  stockBatches,
  stockLedger,
  variants,
} from "../database/schema";
import type {
  CreateProductInput,
  Product,
  ProductListQuery,
  UpdateProductInput,
} from "../shared/types/product";

function toDto(row: {
  id: number;
  name: string;
  categoryId: number | null;
  companyId: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  categoryName: string | null;
  companyName: string | null;
}): Product {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    companyId: row.companyId,
    companyName: row.companyName,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1000) : null,
  };
}

const productSelect = {
  id: products.id,
  name: products.name,
  categoryId: products.categoryId,
  companyId: products.companyId,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
  deletedAt: products.deletedAt,
  categoryName: sql<string | null>`cat.name`,
  companyName: sql<string | null>`comp.name`,
};

function baseJoin(query: ReturnType<typeof getDb>["select"]) {
  return query
    .from(products)
    .leftJoin(sql`categories AS cat`, sql`cat.id = ${products.categoryId}`)
    .leftJoin(sql`companies AS comp`, sql`comp.id = ${products.companyId}`);
}

export const productService = {
  async list(query: ProductListQuery): Promise<Product[]> {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(products.deletedAt));
    if (query.search) {
      conditions.push(like(products.name, `%${query.search}%`));
    }
    if (query.categoryId) {
      conditions.push(eq(products.categoryId, query.categoryId));
    }
    if (query.companyId) {
      conditions.push(eq(products.companyId, query.companyId));
    }

    const rows = await baseJoin(db.select(productSelect))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(products.name))
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toDto);
  },

  async getById(id: number): Promise<Product | null> {
    const db = getDb();
    const rows = await baseJoin(db.select(productSelect))
      .where(eq(products.id, id))
      .limit(1);
    return rows[0] ? toDto(rows[0]) : null;
  },

  async create(input: CreateProductInput): Promise<Product> {
    const db = getDb();
    const [inserted] = await db
      .insert(products)
      .values({
        name: input.name,
        categoryId: input.categoryId ?? null,
        companyId: input.companyId ?? null,
      })
      .returning({ id: products.id });

    const created = await this.getById(inserted.id);
    if (!created) throw new Error("Failed to load created product");
    return created;
  },
    /**
   * Create a product + variant + opening stock batch in ONE transaction.
   * Used by the "Add Full Product" screen.
   */
  async createFull(input: {
    productName: string;
    categoryId?: number | null;
    companyId?: number | null;
    variantName: string;
    baseUnitId: number;
    purchaseUnitId?: number | null;
    purchaseUnitFactor?: number | null;
    lowStockThreshold?: number | null;
    openingQuantity: number;
    openingCost: number;
    suggestedRetailPrice?: number | null;
    suggestedWholesalePrice?: number | null;
  }): Promise<Product> {
    const db = getDb();
    const now = new Date();

    const productId = db.transaction((tx) => {
      // 1. Product
      const [product] = tx
        .insert(products)
        .values({
          name: input.productName,
          categoryId: input.categoryId ?? null,
          companyId: input.companyId ?? null,
        })
        .returning({ id: products.id })
        .all();

      // 2. Variant
      const [variant] = tx
        .insert(variants)
        .values({
          productId: product.id,
          name: input.variantName,
          baseUnitId: input.baseUnitId,
          purchaseUnitId: input.purchaseUnitId ?? null,
          purchaseUnitFactor: input.purchaseUnitFactor ?? null,
          lowStockThreshold: input.lowStockThreshold ?? null,
          isQuickItem: false,
        })
        .returning({ id: variants.id })
        .all();

      // 3. Opening stock batch
      const [batch] = tx
        .insert(stockBatches)
        .values({
          variantId: variant.id,
          purchaseId: null,
          purchasePrice: input.openingCost,
          suggestedRetailPrice: input.suggestedRetailPrice ?? null,
          suggestedWholesalePrice: input.suggestedWholesalePrice ?? null,
          quantityPurchased: input.openingQuantity,
          remainingQuantity: input.openingQuantity,
          purchaseDate: now,
          source: "opening",
        })
        .returning({ id: stockBatches.id })
        .all();

      // 4. Ledger entry
      tx.insert(stockLedger)
        .values({
          batchId: batch.id,
          variantId: variant.id,
          quantityChange: input.openingQuantity,
          unitCost: input.openingCost,
          movementType: "purchase",
          referenceType: null,
          referenceId: null,
          notes: "Opening stock from full product setup",
        })
        .run();

      return product.id;
    });

    const created = await this.getById(productId);
    if (!created) throw new Error("Failed to load created product");
    return created;
  },

  async update(input: UpdateProductInput): Promise<Product> {
    const db = getDb();
    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.categoryId !== undefined)
      updateValues.categoryId = input.categoryId ?? null;
    if (input.companyId !== undefined)
      updateValues.companyId = input.companyId ?? null;

    await db
      .update(products)
      .set(updateValues)
      .where(eq(products.id, input.id));

    const updated = await this.getById(input.id);
    if (!updated) throw new Error(`Product ${input.id} not found`);
    return updated;
  },

  async softDelete(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(products.id, id));
  },

  async restore(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(products)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(products.id, id));
  },

  async count(
    query: Pick<ProductListQuery, "search" | "includeDeleted" | "categoryId" | "companyId">
  ): Promise<number> {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(products.deletedAt));
    if (query.search) conditions.push(like(products.name, `%${query.search}%`));
    if (query.categoryId) conditions.push(eq(products.categoryId, query.categoryId));
    if (query.companyId) conditions.push(eq(products.companyId, query.companyId));

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return row?.count ?? 0;
  },
};