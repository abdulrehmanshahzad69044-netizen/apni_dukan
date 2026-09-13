import type {
  CreateVariantInput,
  UpdateVariantInput,
  Variant,
  VariantListQuery,
} from "../../../electron/shared/types/variant";

type Query = Partial<VariantListQuery>;

export const variantApi = {
  async list(query: Query = {}): Promise<Variant[]> {
    return window.api.variant.list(query);
  },

  async count(
    query: Partial<
      Pick<VariantListQuery, "search" | "includeDeleted" | "productId">
    > = {}
  ): Promise<number> {
    return window.api.variant.count(query);
  },

  async get(id: number): Promise<Variant | null> {
    return window.api.variant.get(id);
  },

  async create(input: CreateVariantInput): Promise<Variant> {
    return window.api.variant.create(input);
  },

  async update(input: UpdateVariantInput): Promise<Variant> {
    return window.api.variant.update(input);
  },

  async remove(id: number): Promise<void> {
    await window.api.variant.delete(id);
  },

  async restore(id: number): Promise<void> {
    await window.api.variant.restore(id);
  },
};