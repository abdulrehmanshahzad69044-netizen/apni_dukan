import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import { expenses } from "../database/schema";
import type {
  CreateExpenseInput,
  Expense,
  ExpenseListQuery,
  UpdateExpenseInput,
} from "../shared/types/expense";

function toDto(row: typeof expenses.$inferSelect): Expense {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    date: Math.floor(row.date.getTime() / 1000),
    remarks: row.remarks,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
  };
}

export const expenseService = {
  async list(query: ExpenseListQuery): Promise<Expense[]> {
    const db = getDb();
    const conditions = [];
    if (query.search) {
      conditions.push(like(expenses.name, `%${query.search}%`));
    }
    if (query.fromDate) {
      conditions.push(gte(expenses.date, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(expenses.date, query.toDate));
    }

    const rows = await db
      .select()
      .from(expenses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(expenses.date), desc(expenses.id))
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toDto);
  },

  async getById(id: number): Promise<Expense | null> {
    const db = getDb();
    const rows = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1);
    return rows[0] ? toDto(rows[0]) : null;
  },

  async create(input: CreateExpenseInput): Promise<Expense> {
    const db = getDb();
    const [row] = await db
      .insert(expenses)
      .values({
        name: input.name,
        amount: input.amount,
        date: input.date ?? new Date(),
        remarks: input.remarks ?? null,
      })
      .returning();
    return toDto(row);
  },

  async update(input: UpdateExpenseInput): Promise<Expense> {
    const db = getDb();
    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.amount !== undefined) updateValues.amount = input.amount;
    if (input.date !== undefined) updateValues.date = input.date;
    if (input.remarks !== undefined)
      updateValues.remarks = input.remarks ?? null;

    const [row] = await db
      .update(expenses)
      .set(updateValues)
      .where(eq(expenses.id, input.id))
      .returning();

    if (!row) throw new Error(`Expense ${input.id} not found`);
    return toDto(row);
  },

  async remove(id: number): Promise<void> {
    const db = getDb();
    await db.delete(expenses).where(eq(expenses.id, id));
  },

  async count(
    query: Pick<ExpenseListQuery, "search" | "fromDate" | "toDate">
  ): Promise<number> {
    const db = getDb();
    const conditions = [];
    if (query.search) conditions.push(like(expenses.name, `%${query.search}%`));
    if (query.fromDate)
      conditions.push(gte(expenses.date, query.fromDate));
    if (query.toDate) conditions.push(lte(expenses.date, query.toDate));

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return row?.count ?? 0;
  },

  /**
   * Total expenses within a date range (used for reports).
   */
  async totalInRange(fromDate: Date, toDate: Date): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(gte(expenses.date, fromDate), lte(expenses.date, toDate)));
    return row?.total ?? 0;
  },
};