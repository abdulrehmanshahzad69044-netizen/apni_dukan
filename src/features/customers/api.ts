import type {
  CreateCustomerInput,
  Customer,
  CustomerListQuery,
  UpdateCustomerInput,
} from "../../../electron/shared/types/customer";

type Query = Partial<CustomerListQuery>;

export const customerApi = {
  async list(query: Query = {}): Promise<Customer[]> {
    return window.api.customer.list(query);
  },

  async count(
    query: Partial<Pick<CustomerListQuery, "search" | "includeDeleted">> = {}
  ): Promise<number> {
    return window.api.customer.count(query);
  },

  async get(id: number): Promise<Customer | null> {
    return window.api.customer.get(id);
  },

  async create(input: CreateCustomerInput): Promise<Customer> {
    return window.api.customer.create(input);
  },

  async update(input: UpdateCustomerInput): Promise<Customer> {
    return window.api.customer.update(input);
  },

  async remove(id: number): Promise<void> {
    await window.api.customer.delete(id);
  },

  async restore(id: number): Promise<void> {
    await window.api.customer.restore(id);
  },
};