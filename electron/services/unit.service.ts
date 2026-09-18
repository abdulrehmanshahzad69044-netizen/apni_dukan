import { and, asc, eq, isNull, like, ne, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import { units } from "../database/schema";
import type {
  CreateUnitInput,
  Unit,
  UnitListQuery,
  UpdateUnitInput,
} from "../shared/types/unit";

function toUnitDto(row: typeof units.$inferSelect): Unit {
  return {
    id: row.id,
    name: row.name,
    shortName: row.shortName,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1000) : null,
  };
}

async function assertUnitNameAvailable(
  name: string,
  shortName: string,
  excludeId?: number
) {
  const db = getDb();
  const conditions = [isNull(units.deletedAt)];
  if (excludeId !== undefined) conditions.push(ne(units.id, excludeId));

  const [byName] = await db
    .select({ id: units.id })
    .from(units)
    .where(and(...conditions, eq(units.name, name)))
    .limit(1);
  if (byName) throw new Error(`Unit "${name}" already exists`);

  const [byShort] = await db
    .select({ id: units.id })
    .from(units)
    .where(and(...conditions, eq(units.shortName, shortName)))
    .limit(1);
  if (byShort) throw new Error(`Short name "${shortName}" already exists`);
}

export const unitService = {
  async list(query: UnitListQuery): Promise<Unit[]> {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(units.deletedAt));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(or(like(units.name, term), like(units.shortName, term)));
    }
    const rows = await db
      .select()
      .from(units)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(units.name))
      .limit(query.limit)
      .offset(query.offset);
    return rows.map(toUnitDto);
  },

  async getById(id: number): Promise<Unit | null> {
    const db = getDb();
    const rows = await db.select().from(units).where(eq(units.id, id)).limit(1);
    return rows[0] ? toUnitDto(rows[0]) : null;
  },

  async create(input: CreateUnitInput): Promise<Unit> {
    await assertUnitNameAvailable(input.name, input.shortName);
    const db = getDb();
    const [row] = await db
      .insert(units)
      .values({ name: input.name, shortName: input.shortName })
      .returning();
    return toUnitDto(row);
  },

  async update(input: UpdateUnitInput): Promise<Unit> {
    const db = getDb();
    const current = await this.getById(input.id);
    if (!current) throw new Error(`Unit ${input.id} not found`);

    const nextName = input.name ?? current.name;
    const nextShort = input.shortName ?? current.shortName;
    await assertUnitNameAvailable(nextName, nextShort, input.id);

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.shortName !== undefined) updateValues.shortName = input.shortName;

    const [row] = await db
      .update(units)
      .set(updateValues)
      .where(eq(units.id, input.id))
      .returning();
    return toUnitDto(row);
  },

  async softDelete(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(units)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(units.id, id));
  },

  async restore(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(units)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(units.id, id));
  },

  async count(
    query: Pick<UnitListQuery, "search" | "includeDeleted">
  ): Promise<number> {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(units.deletedAt));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(or(like(units.name, term), like(units.shortName, term)));
    }
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(units)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return row?.count ?? 0;
  },
};