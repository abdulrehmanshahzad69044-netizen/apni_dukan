import type {
  KhaataDetail,
  KhaataEntry,
  KhaataListQuery,
} from "../../../electron/shared/types/payment";

type Query = Partial<KhaataListQuery>;

export const khaataApi = {
  async list(query: Query = {}): Promise<KhaataEntry[]> {
    return window.api.khaata.list(query);
  },
  async detail(customerId: number): Promise<KhaataDetail | null> {
    return window.api.khaata.detail(customerId);
  },
  async totalOutstanding(): Promise<number> {
    return window.api.khaata.totalOutstanding();
  },
};