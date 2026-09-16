import type {
  CreateExpenseInput,
  Expense,
  ExpenseListQuery,
  UpdateExpenseInput,
} from "../../../electron/shared/types/expense";

type Query = Partial<ExpenseListQuery>;

export const expenseApi = {
  async list(query: Query = {}): Promise<Expense[]> {
    return window.api.expense.list(query);
  },

  async count(
    query: Partial<Pick<ExpenseListQuery, "search" | "fromDate" | "toDate">> = {}
  ): Promise<number> {
    return window.api.expense.count(query);
  },

  async get(id: number): Promise<Expense | null> {
    return window.api.expense.get(id);
  },

  async create(input: CreateExpenseInput): Promise<Expense> {
    return window.api.expense.create(input);
  },

  async update(input: UpdateExpenseInput): Promise<Expense> {
    return window.api.expense.update(input);
  },

  async remove(id: number): Promise<void> {
    await window.api.expense.delete(id);
  },
};