import type {
  CompanyPayment,
  CompanyPaymentListQuery,
  CreateCompanyPaymentInput,
} from "../../../electron/shared/types/expense";

type Query = Partial<CompanyPaymentListQuery>;

export type CompanyPaymentAllocation = {
  id: number;
  purchaseId: number;
  purchaseNumber: string;
  purchaseDate: number;
  amount: number;
};

export const companyPaymentApi = {
  async list(query: Query = {}): Promise<CompanyPayment[]> {
    return window.api.companyPayment.list(query);
  },

  async get(id: number): Promise<CompanyPayment | null> {
    return window.api.companyPayment.get(id);
  },

  async getAllocations(id: number): Promise<CompanyPaymentAllocation[]> {
    return window.api.companyPayment.getAllocations(id);
  },

  async create(input: CreateCompanyPaymentInput): Promise<CompanyPayment> {
    return window.api.companyPayment.create(input);
  },

  async remove(id: number): Promise<void> {
    await window.api.companyPayment.delete(id);
  },

  async totalOutstanding(): Promise<number> {
    return window.api.companyPayment.totalOutstanding();
  },
};