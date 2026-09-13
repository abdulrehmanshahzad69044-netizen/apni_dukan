import { and, asc, eq, isNull, like, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import { variants } from "../database/schema";
import type {
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
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  productName: string;
  baseUnitName: string;
  baseUnitShortName: string;
}): Variant {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    name: row.name,
    baseUnitId: row.baseUnitId,
    baseUnitName: row.baseUnitName,
    baseUnitShortName: row.baseUnitShortName,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1000) : null,
  };
}

const variantSelect = {
  id: variants.id,
  productId: variants.productId,
  name: variants.name,
  baseUnitId: variants.baseUnitId,
  createdAt: variants.createdAt,
  updatedAt: variants.updatedAt,
  deletedAt: variants.deletedAt,
  productName: sql<string>`p.name`,
  baseUnitName: sql<string>`u.name`,
  baseUnitShortName: sql<string>`u.short_name`,
};

function baseJoin(query: ReturnType<typeof getDb>["select"]) {
  return query
    .from(variants)
    .innerJoin(sql`products AS p`, sql`p.id = ${variants.productId}`)
    .innerJoin(sql`units AS u`, sql`u.id = ${variants.baseUnitId}`);
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
      conditions.push(like(variants.name, term));
    }

    const rows = await baseJoin(db.select(variantSelect))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(variants.productId), asc(variants.name))
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
      })
      .returning({ id: variants.id });

    const created = await this.getById(inserted.id);
    if (!created) throw new Error("Failed to load created variant");
    return created;
  },

  async update(input: UpdateVariantInput): Promise<Variant> {
    const db = getDb();
    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.baseUnitId !== undefined)
      updateValues.baseUnitId = input.baseUnitId;

    await db
      .update(variants)
      .set(updateValues)
      .where(eq(variants.id, input.id));

    const updated = await this.getById(input.id);
    if (!updated) throw new Error(`Variant ${input.id} not found`);
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
    if (query.search) conditions.push(like(variants.name, `%${query.search}%`));

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(variants)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return row?.count ?? 0;
  },
};