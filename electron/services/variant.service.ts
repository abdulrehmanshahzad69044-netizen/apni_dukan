import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import {
  categories,
  products,
  stockBatches,
  stockLedger,
  units,
  variants,
} from "../database/schema";
import type {
  CreateQuickItemInput,
  CreateVariantInput,
  UpdateVariantInput,
  Variant,
  VariantListQuery,
} from "../shared/types/variant";

function toDto(row: {
  id: number;
  productId: number;
  name: string;
  baseUnitId: number;
  purchaseUnitId: number | null;
  purchaseUnitFactor: number | null;
  lowStockThreshold: number | null;
  pinned: number | boolean;
  isQuickItem: number | boolean;
  priceVolatile: number | boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  productName: string;
  baseUnitName: string;
  baseUnitShortName: string;
  purchaseUnitName: string | null;
  purchaseUnitShortName: string | null;
}): Variant {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    name: row.name,
    baseUnitId: row.baseUnitId,
    baseUnitName: row.baseUnitName,
    baseUnitShortName: row.baseUnitShortName,
    purchaseUnitId: row.purchaseUnitId,
    purchaseUnitName: row.purchaseUnitName,
    purchaseUnitShortName: row.purchaseUnitShortName,
    purchaseUnitFactor: row.purchaseUnitFactor,
    lowStockThreshold: row.lowStockThreshold,
    pinned: Boolean(row.pinned),
    isQuickItem: Boolean(row.isQuickItem),
    priceVolatile: Boolean(row.priceVolatile),
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
    deletedAt: row.deletedAt
      ? Math.floor(row.deletedAt.getTime() / 1000)
      : null,
  };
}

const variantSelect = {
  id: variants.id,
  productId: variants.productId,
  name: variants.name,
  baseUnitId: variants.baseUnitId,
  purchaseUnitId: variants.purchaseUnitId,
  purchaseUnitFactor: variants.purchaseUnitFactor,
  lowStockThreshold: variants.lowStockThreshold,
  pinned: variants.pinned,
  isQuickItem: variants.isQuickItem,
  priceVolatile: variants.priceVolatile,
  createdAt: variants.createdAt,
  updatedAt: variants.updatedAt,
  deletedAt: variants.deletedAt,
  productName: sql<string>`p.name`,
  baseUnitName: sql<string>`u.name`,
  baseUnitShortName: sql<string>`u.short_name`,
  purchaseUnitName: sql<string | null>`pu.name`,
  purchaseUnitShortName: sql<string | null>`pu.short_name`,
};

function baseJoin(query: ReturnType<typeof getDb>["select"]) {
  return query
    .from(variants)
    .innerJoin(sql`products AS p`, sql`p.id = ${variants.productId}`)
    .innerJoin(sql`units AS u`, sql`u.id = ${variants.baseUnitId}`)
    .leftJoin(sql`units AS pu`, sql`pu.id = ${variants.purchaseUnitId}`);
}

export const variantService = {
  async list(query: VariantListQuery): Promise<Variant[]> {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(variants.deletedAt));
    if (query.productId) {
      conditions.push(eq(variants.productId, query.productId));
    }
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(variants.name, term), like(sql`p.name`, term))
      );
    }

    const rows = await baseJoin(db.select(variantSelect))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        desc(variants.pinned),
        asc(variants.productId),
        asc(variants.name)
      )
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toDto);
  },

  async getById(id: number): Promise<Variant | null> {
    const db = getDb();
    const rows = await baseJoin(db.select(variantSelect))
      .where(eq(variants.id, id))
      .limit(1);
    return rows[0] ? toDto(rows[0]) : null;
  },

  async create(input: CreateVariantInput): Promise<Variant> {
    const db = getDb();
    const [inserted] = await db
      .insert(variants)
      .values({
        productId: input.productId,
        name: input.name,
        baseUnitId: input.baseUnitId,
        purchaseUnitId: input.purchaseUnitId ?? null,
        purchaseUnitFactor: input.purchaseUnitFactor ?? null,
        lowStockThreshold: input.lowStockThreshold ?? null,
        isQuickItem: false,
      })
      .returning({ id: variants.id });

    const created = await this.getById(inserted.id);
    if (!created) throw new Error("Failed to load created variant");
    return created;
  },

  async createQuick(input: CreateQuickItemInput): Promise<Variant> {
    const db = getDb();
    const now = new Date();

    const variantId = db.transaction((tx) => {
      const existingCats = tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.name, "Quick Items"))
        .limit(1)
        .all();

      let categoryId: number;
      if (existingCats[0]) {
        categoryId = existingCats[0].id;
      } else {
        const [created] = tx
          .insert(categories)
          .values({ name: "Quick Items" })
          .returning({ id: categories.id })
          .all();
        categoryId = created.id;
      }

      const existingUnits = tx
        .select({ id: units.id })
        .from(units)
        .where(and(eq(units.name, "Piece"), isNull(units.deletedAt)))
        .limit(1)
        .all();

      let pieceUnitId: number;
      if (existingUnits[0]) {
        pieceUnitId = existingUnits[0].id;
      } else {
        const [created] = tx
          .insert(units)
          .values({ name: "Piece", shortName: "pc" })
          .returning({ id: units.id })
          .all();
        pieceUnitId = created.id;
      }

      const [product] = tx
        .insert(products)
        .values({
          name: input.name,
          categoryId,
          companyId: null,
        })
        .returning({ id: products.id })
        .all();

      const [variant] = tx
        .insert(variants)
        .values({
          productId: product.id,
          name: "Standard",
          baseUnitId: pieceUnitId,
          purchaseUnitId: null,
          purchaseUnitFactor: null,
          lowStockThreshold: null,
          pinned: true,
          isQuickItem: true,
        })
        .returning({ id: variants.id })
        .all();

      const [batch] = tx
        .insert(stockBatches)
        .values({
          variantId: variant.id,
          purchaseId: null,
          purchasePrice: input.cost,
          suggestedRetailPrice: input.suggestedRetailPrice ?? input.price,
          suggestedWholesalePrice:
            input.suggestedWholesalePrice ?? input.price,
          quantityPurchased: input.quantity,
          remainingQuantity: input.quantity,
          purchaseDate: now,
          source: "adjustment",
        })
        .returning({ id: stockBatches.id })
        .all();

      tx.insert(stockLedger)
        .values({
          batchId: batch.id,
          variantId: variant.id,
          quantityChange: input.quantity,
          unitCost: input.cost,
          movementType: "purchase",
          referenceType: null,
          referenceId: null,
          notes: "Quick item initial stock",
        })
        .run();

      return variant.id;
    });

    const created = await this.getById(variantId);
    if (!created) throw new Error("Failed to load created quick variant");
    return created;
  },

  async update(input: UpdateVariantInput): Promise<Variant> {
    const db = getDb();
    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.baseUnitId !== undefined)
      updateValues.baseUnitId = input.baseUnitId;
    if (input.purchaseUnitId !== undefined)
      updateValues.purchaseUnitId = input.purchaseUnitId;
    if (input.purchaseUnitFactor !== undefined)
      updateValues.purchaseUnitFactor = input.purchaseUnitFactor;
    if (input.lowStockThreshold !== undefined)
      updateValues.lowStockThreshold = input.lowStockThreshold;

    await db
      .update(variants)
      .set(updateValues)
      .where(eq(variants.id, input.id));

    const updated = await this.getById(input.id);
    if (!updated) throw new Error(`Variant ${input.id} not found`);
    return updated;
  },

  async setPinned(id: number, pinned: boolean): Promise<Variant> {
    const db = getDb();
    await db
      .update(variants)
      .set({ pinned, updatedAt: new Date() })
      .where(eq(variants.id, id));

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Variant ${id} not found`);
    return updated;
  },

  async setPriceVolatile(
    id: number,
    priceVolatile: boolean
  ): Promise<Variant> {
    const db = getDb();
    await db
      .update(variants)
      .set({ priceVolatile, updatedAt: new Date() })
      .where(eq(variants.id, id));

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Variant ${id} not found`);
    return updated;
  },

  async promoteFromQuick(id: number): Promise<Variant> {
    const db = getDb();
    await db
      .update(variants)
      .set({ isQuickItem: false, updatedAt: new Date() })
      .where(eq(variants.id, id));

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Variant ${id} not found`);
    return updated;
  },

  async softDelete(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(variants)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(variants.id, id));
  },

  async restore(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(variants)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(variants.id, id));
  },

  async count(
    query: Pick<VariantListQuery, "search" | "includeDeleted" | "productId">
  ): Promise<number> {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(variants.deletedAt));
    if (query.productId)
      conditions.push(eq(variants.productId, query.productId));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(variants.name, term), like(sql`p.name`, term))
      );
    }

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(variants)
      .innerJoin(sql`products AS p`, sql`p.id = ${variants.productId}`)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return row?.count ?? 0;
  },

  /**
   * List all price-volatile variants with their current prices.
   * Current prices come from the most recent batch with remaining stock.
   */
  async listVolatile(): Promise<
    Array<{
      variantId: number;
      productName: string;
      variantName: string;
      baseUnitShortName: string;
      currentStock: number;
      currentRetail: number | null;
      currentWholesale: number | null;
    }>
  > {
    const db = getDb();
    const rows = db.$client
      .prepare(
        `
        SELECT
          v.id                AS variantId,
          p.name              AS productName,
          v.name              AS variantName,
          u.short_name        AS baseUnitShortName,
          COALESCE(SUM(b.remaining_quantity), 0) AS currentStock,
          (SELECT suggested_retail_price FROM stock_batches
             WHERE variant_id = v.id AND remaining_quantity > 0
             ORDER BY purchase_date DESC, id DESC LIMIT 1) AS currentRetail,
          (SELECT suggested_wholesale_price FROM stock_batches
             WHERE variant_id = v.id AND remaining_quantity > 0
             ORDER BY purchase_date DESC, id DESC LIMIT 1) AS currentWholesale
        FROM variants v
        INNER JOIN products p ON p.id = v.product_id
        INNER JOIN units    u ON u.id = v.base_unit_id
        LEFT  JOIN stock_batches b ON b.variant_id = v.id AND b.remaining_quantity > 0
        WHERE v.price_volatile = 1
          AND v.deleted_at IS NULL
        GROUP BY v.id
        ORDER BY p.name, v.name
        `
      )
      .all() as Array<{
      variantId: number;
      productName: string;
      variantName: string;
      baseUnitShortName: string;
      currentStock: number;
      currentRetail: number | null;
      currentWholesale: number | null;
    }>;

    return rows;
  },

  /**
   * Update retail/wholesale price for one variant on ALL batches with
   * remaining stock. Also updates variants.updatedAt for audit purposes.
   */
  async bulkUpdatePrices(
    updates: Array<{
      variantId: number;
      retailPrice: number | null;
      wholesalePrice: number | null;
    }>
  ): Promise<{ updated: number }> {
    const db = getDb();
    let count = 0;

    db.transaction((tx) => {
      for (const u of updates) {
        // Update all batches with remaining stock
        tx.update(stockBatches)
          .set({
            suggestedRetailPrice: u.retailPrice,
            suggestedWholesalePrice: u.wholesalePrice,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(stockBatches.variantId, u.variantId),
              sql`${stockBatches.remainingQuantity} > 0`
            )
          )
          .run();

        tx.update(variants)
          .set({ updatedAt: new Date() })
          .where(eq(variants.id, u.variantId))
          .run();

        count++;
      }
    });

    return { updated: count };
  },
};