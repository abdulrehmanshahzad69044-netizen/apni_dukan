import type {
  Company,
  CompanyListQuery,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "../../../electron/shared/types/company";

type Query = Partial<CompanyListQuery>;

export const companyApi = {
  async list(query: Query = {}): Promise<Company[]> {
    return window.api.company.list(query);
  },

  async count(
    query: Partial<Pick<CompanyListQuery, "search" | "includeDeleted">> = {}
  ): Promise<number> {
    return window.api.company.count(query);
  },

  async get(id: number): Promise<Company | null> {
    return window.api.company.get(id);
  },

  async create(input: CreateCompanyInput): Promise<Company> {
    return window.api.company.create(input);
  },

  async update(input: UpdateCompanyInput): Promise<Company> {
    return window.api.company.update(input);
  },

  async remove(id: number): Promise<void> {
    await window.api.company.delete(id);
  },

  async restore(id: number): Promise<void> {
    await window.api.company.restore(id);
  },
};