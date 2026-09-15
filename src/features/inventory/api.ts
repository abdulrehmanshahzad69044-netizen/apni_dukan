import type {
  PriceHistoryEntry,
  StockItem,
  StockListQuery,
} from "../../../electron/shared/types/inventory";

type Query = Partial<StockListQuery>;

export const inventoryApi = {
  async listStock(query: Query = {}): Promise<StockItem[]> {
    return window.api.inventory.listStock(query);
  },

  async totals(): Promise<{
    totalVariants: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    return window.api.inventory.totals();
  },

  async priceHistory(variantId: number): Promise<PriceHistoryEntry[]> {
    return window.api.inventory.priceHistory({ variantId });
  },
};