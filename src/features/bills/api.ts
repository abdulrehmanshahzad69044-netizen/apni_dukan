import type {
  Bill,
  BillDetail,
  BillListQuery,
  CreateBillInput,
  FifoCostPreview,
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

  async finalize(id: number): Promise<BillDetail> {
    return window.api.bill.finalize(id);
  },

  async deleteDraft(id: number): Promise<void> {
    await window.api.bill.deleteDraft(id);
  },

  async getForDuplicate(id: number) {
    return window.api.bill.getForDuplicate(id);
  },

  async previewFifoCost(input: {
    variantId: number;
    quantity: number;
  }): Promise<FifoCostPreview> {
    return window.api.bill.previewFifoCost(input);
  },
    async getForEdit(id: number) {
    return window.api.bill.getForEdit(id);
  },

  async updateAndSave(input: {
    id: number;
    customerId: number | null;
    billDate: Date;
    paidAmount: number;
    amountReceived: number;
    remarks?: string;
    status: "draft" | "held" | "finalized";
    lines: Array<{
      variantId: number;
      unitId: number;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<BillDetail> {
    return window.api.bill.updateAndSave(input);
  },
};