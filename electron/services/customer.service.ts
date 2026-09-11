import { and, asc, eq, isNull, like, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import { customers } from "../database/schema";
import type {
  CreateCustomerInput,
  Customer,
  CustomerListQuery,
  UpdateCustomerInput,
} from "../shared/types/customer";

/**
 * Convert a Drizzle customer row to a plain serializable DTO.
 * Dates become unix seconds so they cross IPC cleanly.
 */
function toDto(row: typeof customers.$inferSelect): Customer {
  return {
    id: row.id,
    name: row.name,
    contactNumber: row.contactNumber ?? null,
    address: row.address ?? null,
    cachedOutstanding: row.cachedOutstanding,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
    deletedAt: row.deletedAt ? Math.floor(row.deletedAt.getTime() / 1000) : null,
  };
}

export const customerService = {
  async list(query: CustomerListQuery): Promise<Customer[]> {
    const db = getDb();
    const conditions = [];

    if (!query.includeDeleted) {
      conditions.push(isNull(customers.deletedAt));
    }

    if (query.search && query.search.length > 0) {
      const term = `%${query.search}%`;
      conditions.push(
        or(
          like(customers.name, term),
          like(customers.contactNumber, term)
        )
      );
    }

    const rows = await db
      .select()
      .from(customers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(customers.name))
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toDto);
  },

  async getById(id: number): Promise<Customer | null> {
    const db = getDb();
    const rows = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);
    return rows[0] ? toDto(rows[0]) : null;
  },

  async create(input: CreateCustomerInput): Promise<Customer> {
    const db = getDb();
    const [row] = await db
      .insert(customers)
      .values({
        name: input.name,
        contactNumber: input.contactNumber ?? null,
        address: input.address ?? null,
      })
      .returning();
    return toDto(row);
  },

  async update(input: UpdateCustomerInput): Promise<Customer> {
    const db = getDb();
    const { id, ...patch } = input;

    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (patch.name !== undefined) updateValues.name = patch.name;
    if (patch.contactNumber !== undefined)
      updateValues.contactNumber = patch.contactNumber ?? null;
    if (patch.address !== undefined)
      updateValues.address = patch.address ?? null;

    const [row] = await db
      .update(customers)
      .set(updateValues)
      .where(eq(customers.id, id))
      .returning();

    if (!row) throw new Error(`Customer ${id} not found`);
    return toDto(row);
  },

  /**
   * Soft delete. Never physically removes.
   * Financial records (bills, payments) keep pointing at the row.
   */
  async softDelete(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(customers)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(customers.id, id));
  },

  async restore(id: number): Promise<void> {
    const db = getDb();
    await db
      .update(customers)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(customers.id, id));
  },

  /**
   * Fast count for list pagination headers.
   */
  async count(query: Pick<CustomerListQuery, "search" | "includeDeleted">): Promise<number> {
    const db = getDb();
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(customers.deletedAt));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(customers.name, term), like(customers.contactNumber, term))
      );
    }
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return row?.count ?? 0;
  },
};