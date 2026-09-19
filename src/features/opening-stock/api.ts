import type {
  CreateOpeningStockInput,
  OpeningStockEntry,
} from "../../../electron/shared/types/opening-stock";

export const openingStockApi = {
  async list(): Promise<OpeningStockEntry[]> {
    return window.api.openingStock.list();
  },
  async create(input: CreateOpeningStockInput): Promise<OpeningStockEntry[]> {
    return window.api.openingStock.create(input);
  },
  async remove(batchId: number): Promise<void> {
    await window.api.openingStock.delete(batchId);
  },
};