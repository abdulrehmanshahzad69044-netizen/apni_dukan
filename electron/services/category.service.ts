import { and, asc, eq, isNull, like, ne, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import { categories } from "../database/schema";
import type {
  Category,
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../shared/types/category";

function toDto(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1000) : null,
  };
}

/**
 * Enforce name uniqueness among ACTIVE categories only.
 * If another active category has the same name, throw.
 */
async function assertNameAvailable(name: string, excludeId?: number) {
  const db = getDb();
  const conditions = [isNull(categories.deletedAt), eq(categories.name, name)];
  if (excludeId !== undefined) {
    conditions.push(ne(categories.id, excludeId));
  }
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(...conditions))
    .limit(1);
  if (existing) {
    throw new Error(`Category "${name}" already exists`);
  }
}

export const categoryService = {
  async list(query: CategoryListQuery): Promise<Category[]> {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(categories.deletedAt));
    if (query.search) {
      conditions.push(like(categories.name, `%${query.search}%`));
    }

    const rows = await db
      .select()
      .from(categories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(categories.name))
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toDto);
  },

  async getById(id: number): Promise<Category | null> {
    const db = getDb();
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return rows[0] ? toDto(rows[0]) : null;
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    await assertNameAvailable(input.name);
    const db = getDb();
    const [row] = await db
      .insert(categories)
      .values({ name: input.name })
      .returning();
    return toDto(row);
  },

  async update(input: UpdateCategoryInput): Promise<Category> {
    if (input.name !== undefined) {
      await assertNameAvailable(input.name, input.id);
    }
    const db = getDb();
    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateValues.name = input.name;

    const [row] = await db
      .update(categories)
      .set(updateValues)
      .where(eq(categories.id, input.id))
      .returning();

    if (!row) throw new Error(`Category ${input.id} not found`);
    return toDto(row);
  },

  async softDelete(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(categories)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(categories.id, id));
  },

  async restore(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(categories)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(categories.id, id));
  },

  async count(
    query: Pick<CategoryListQuery, "search" | "includeDeleted">
  ): Promise<number> {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(categories.deletedAt));
    if (query.search) conditions.push(like(categories.name, `%${query.search}%`));
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return row?.count ?? 0;
  },
};