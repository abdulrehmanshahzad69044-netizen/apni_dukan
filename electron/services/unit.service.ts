import { and, asc, eq, isNull, like, ne, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import { units, unitConversions } from "../database/schema";
import type {
  CreateUnitConversionInput,
  CreateUnitInput,
  Unit,
  UnitConversion,
  UnitListQuery,
  UpdateUnitConversionInput,
  UpdateUnitInput,
} from "../shared/types/unit";

// ---------- Helpers ----------

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

// ---------- Unit Service ----------

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

// ---------- Unit Conversion Service ----------

const conversionSelect = {
  id: unitConversions.id,
  fromUnitId: unitConversions.fromUnitId,
  toUnitId: unitConversions.toUnitId,
  factor: unitConversions.factor,
  createdAt: unitConversions.createdAt,
  updatedAt: unitConversions.updatedAt,
  fromUnitName: sql<string>`from_unit.name`,
  fromUnitShortName: sql<string>`from_unit.short_name`,
  toUnitName: sql<string>`to_unit.name`,
  toUnitShortName: sql<string>`to_unit.short_name`,
};

function toConversionDto(row: {
  id: number;
  fromUnitId: number;
  toUnitId: number;
  factor: number;
  createdAt: Date;
  updatedAt: Date;
  fromUnitName: string;
  fromUnitShortName: string;
  toUnitName: string;
  toUnitShortName: string;
}): UnitConversion {
  return {
    id: row.id,
    fromUnitId: row.fromUnitId,
    toUnitId: row.toUnitId,
    factor: row.factor,
    fromUnitName: row.fromUnitName,
    fromUnitShortName: row.fromUnitShortName,
    toUnitName: row.toUnitName,
    toUnitShortName: row.toUnitShortName,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
  };
}

export const unitConversionService = {
  /**
   * List all conversions, optionally filtered by a specific unit
   * (returns both directions involving that unit).
   */
  async list(filter?: { unitId?: number }): Promise<UnitConversion[]> {
    const db = getDb();
    const rows = await db
      .select(conversionSelect)
      .from(unitConversions)
      .innerJoin(
        sql`units AS from_unit`,
        sql`from_unit.id = ${unitConversions.fromUnitId}`
      )
      .innerJoin(
        sql`units AS to_unit`,
        sql`to_unit.id = ${unitConversions.toUnitId}`
      )
      .where(
        filter?.unitId !== undefined
          ? or(
              eq(unitConversions.fromUnitId, filter.unitId),
              eq(unitConversions.toUnitId, filter.unitId)
            )
          : undefined
      )
      .orderBy(asc(unitConversions.fromUnitId), asc(unitConversions.toUnitId));

    return rows.map(toConversionDto);
  },

  async create(input: CreateUnitConversionInput): Promise<UnitConversion> {
    const db = getDb();

    // Reject if either direction already exists
    const existing = await db
      .select({ id: unitConversions.id })
      .from(unitConversions)
      .where(
        or(
          and(
            eq(unitConversions.fromUnitId, input.fromUnitId),
            eq(unitConversions.toUnitId, input.toUnitId)
          ),
          and(
            eq(unitConversions.fromUnitId, input.toUnitId),
            eq(unitConversions.toUnitId, input.fromUnitId)
          )
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("A conversion between these units already exists");
    }

    // Convert user-entered factor to milli-factor
    const milliFactor = Math.round(input.factor * 1000);

    const [inserted] = await db
      .insert(unitConversions)
      .values({
        fromUnitId: input.fromUnitId,
        toUnitId: input.toUnitId,
        factor: milliFactor,
      })
      .returning({ id: unitConversions.id });

    const [row] = await db
      .select(conversionSelect)
      .from(unitConversions)
      .innerJoin(
        sql`units AS from_unit`,
        sql`from_unit.id = ${unitConversions.fromUnitId}`
      )
      .innerJoin(
        sql`units AS to_unit`,
        sql`to_unit.id = ${unitConversions.toUnitId}`
      )
      .where(eq(unitConversions.id, inserted.id))
      .limit(1);

    return toConversionDto(row);
  },

  async update(input: UpdateUnitConversionInput): Promise<UnitConversion> {
    const db = getDb();
    const milliFactor = Math.round(input.factor * 1000);

    await db
      .update(unitConversions)
      .set({ factor: milliFactor, updatedAt: new Date() })
      .where(eq(unitConversions.id, input.id));

    const [row] = await db
      .select(conversionSelect)
      .from(unitConversions)
      .innerJoin(
        sql`units AS from_unit`,
        sql`from_unit.id = ${unitConversions.fromUnitId}`
      )
      .innerJoin(
        sql`units AS to_unit`,
        sql`to_unit.id = ${unitConversions.toUnitId}`
      )
      .where(eq(unitConversions.id, input.id))
      .limit(1);

    if (!row) throw new Error(`Conversion ${input.id} not found`);
    return toConversionDto(row);
  },

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.delete(unitConversions).where(eq(unitConversions.id, id));
  },
};