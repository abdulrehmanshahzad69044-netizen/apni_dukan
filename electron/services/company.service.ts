import { and, asc, eq, isNull, like, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import { companies } from "../database/schema";
import type {
  Company,
  CompanyListQuery,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "../shared/types/company";

function toDto(row: typeof companies.$inferSelect): Company {
  return {
    id: row.id,
    name: row.name,
    contactNumber: row.contactNumber ?? null,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1000) : null,
  };
}

export const companyService = {
  async list(query: CompanyListQuery): Promise<Company[]> {
    const db = getDb();
    const conditions = [];

    if (!query.includeDeleted) {
      conditions.push(isNull(companies.deletedAt));
    }

    if (query.search && query.search.length > 0) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(companies.name, term), like(companies.contactNumber, term))
      );
    }

    const rows = await db
      .select()
      .from(companies)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(companies.name))
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toDto);
  },

  async getById(id: number): Promise<Company | null> {
    const db = getDb();
    const rows = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);
    return rows[0] ? toDto(rows[0]) : null;
  },

  async create(input: CreateCompanyInput): Promise<Company> {
    const db = getDb();
    const [row] = await db
      .insert(companies)
      .values({
        name: input.name,
        contactNumber: input.contactNumber ?? null,
      })
      .returning();
    return toDto(row);
  },

  async update(input: UpdateCompanyInput): Promise<Company> {
    const db = getDb();
    const { id, ...patch } = input;

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.name !== undefined) updateValues.name = patch.name;
    if (patch.contactNumber !== undefined)
      updateValues.contactNumber = patch.contactNumber ?? null;

    const [row] = await db
      .update(companies)
      .set(updateValues)
      .where(eq(companies.id, id))
      .returning();

    if (!row) throw new Error(`Company ${id} not found`);
    return toDto(row);
  },

  async softDelete(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(companies)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(companies.id, id));
  },

  async restore(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(companies)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(companies.id, id));
  },

  async count(
    query: Pick<CompanyListQuery, "search" | "includeDeleted">
  ): Promise<number> {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(companies.deletedAt));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(companies.name, term), like(companies.contactNumber, term))
      );
    }
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(companies)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return row?.count ?? 0;
  },
};