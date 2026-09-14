import type {
  AdjustmentListQuery,
  CreateAdjustmentInput,
  StockAdjustment,
} from "../../../electron/shared/types/adjustment";

type Query = Partial<AdjustmentListQuery>;

export const adjustmentApi = {
  async list(query: Query = {}): Promise<StockAdjustment[]> {
    return window.api.adjustment.list(query);
  },

  async get(id: number): Promise<StockAdjustment | null> {
    return window.api.adjustment.get(id);
  },

  async create(input: CreateAdjustmentInput): Promise<StockAdjustment> {
    return window.api.adjustment.create(input);
  },
};