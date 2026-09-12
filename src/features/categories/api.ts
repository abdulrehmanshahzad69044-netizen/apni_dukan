import type {
  Category,
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../../../electron/shared/types/category";

type Query = Partial<CategoryListQuery>;

export const categoryApi = {
  async list(query: Query = {}): Promise<Category[]> {
    return window.api.category.list(query);
  },

  async count(
    query: Partial<Pick<CategoryListQuery, "search" | "includeDeleted">> = {}
  ): Promise<number> {
    return window.api.category.count(query);
  },

  async get(id: number): Promise<Category | null> {
    return window.api.category.get(id);
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    return window.api.category.create(input);
  },

  async update(input: UpdateCategoryInput): Promise<Category> {
    return window.api.category.update(input);
  },

  async remove(id: number): Promise<void> {
    await window.api.category.delete(id);
  },

  async restore(id: number): Promise<void> {
    await window.api.category.restore(id);
  },
};