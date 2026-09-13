import type {
  CreateProductInput,
  Product,
  ProductListQuery,
  UpdateProductInput,
} from "../../../electron/shared/types/product";

type Query = Partial<ProductListQuery>;

export const productApi = {
  async list(query: Query = {}): Promise<Product[]> {
    return window.api.product.list(query);
  },

  async count(
    query: Partial<
      Pick<
        ProductListQuery,
        "search" | "includeDeleted" | "categoryId" | "companyId"
      >
    > = {}
  ): Promise<number> {
    return window.api.product.count(query);
  },

  async get(id: number): Promise<Product | null> {
    return window.api.product.get(id);
  },

  async create(input: CreateProductInput): Promise<Product> {
    return window.api.product.create(input);
  },

  async update(input: UpdateProductInput): Promise<Product> {
    return window.api.product.update(input);
  },

  async remove(id: number): Promise<void> {
    await window.api.product.delete(id);
  },

  async restore(id: number): Promise<void> {
    await window.api.product.restore(id);
  },
};