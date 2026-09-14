import type {
  CreatePurchaseInput,
  Purchase,
  PurchaseListQuery,
  StockBatch,
} from "../../../electron/shared/types/purchase";

type Query = Partial<PurchaseListQuery>;

export const purchaseApi = {
  async list(query: Query = {}): Promise<Purchase[]> {
    return window.api.purchase.list(query);
  },

  async count(
    query: Partial<
      Pick<PurchaseListQuery, "companyId" | "fromDate" | "toDate">
    > = {}
  ): Promise<number> {
    return window.api.purchase.count(query);
  },

  async get(id: number): Promise<Purchase | null> {
    return window.api.purchase.get(id);
  },

  async getBatches(purchaseId: number): Promise<StockBatch[]> {
    return window.api.purchase.getBatches(purchaseId);
  },

  async create(input: CreatePurchaseInput): Promise<Purchase> {
    return window.api.purchase.create(input);
  },

  async setPaidAmount(id: number, paidAmount: number): Promise<Purchase> {
    return window.api.purchase.setPaidAmount({ id, paidAmount });
  },
};