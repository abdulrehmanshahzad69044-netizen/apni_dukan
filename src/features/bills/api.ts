import type {
  Bill,
  BillDetail,
  BillListQuery,
  CreateBillInput,
} from "../../../electron/shared/types/bill";

type Query = Partial<BillListQuery>;

export const billApi = {
  async list(query: Query = {}): Promise<Bill[]> {
    return window.api.bill.list(query);
  },

  async count(
    query: Partial<
      Pick<BillListQuery, "customerId" | "status" | "fromDate" | "toDate">
    > = {}
  ): Promise<number> {
    return window.api.bill.count(query);
  },

  async get(id: number): Promise<BillDetail | null> {
    return window.api.bill.get(id);
  },

  async create(input: CreateBillInput): Promise<BillDetail> {
    return window.api.bill.create(input);
  },
};