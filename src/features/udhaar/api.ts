import type {
  CreateUdhaarInput,
  CustomerUdhaar,
  UdhaarListQuery,
} from "../../../electron/shared/types/udhaar";

type Query = Partial<UdhaarListQuery>;

export const udhaarApi = {
  async list(query: Query = {}): Promise<CustomerUdhaar[]> {
    return window.api.udhaar.list(query);
  },
  async get(id: number): Promise<CustomerUdhaar | null> {
    return window.api.udhaar.get(id);
  },
  async create(input: CreateUdhaarInput): Promise<CustomerUdhaar> {
    return window.api.udhaar.create(input);
  },
  async remove(id: number): Promise<void> {
    await window.api.udhaar.delete(id);
  },
};