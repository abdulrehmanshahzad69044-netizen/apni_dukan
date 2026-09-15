import type {
  CreatePaymentInput,
  Payment,
  PaymentDetail,
  PaymentListQuery,
} from "../../../electron/shared/types/payment";

type Query = Partial<PaymentListQuery>;

export const paymentApi = {
  async list(query: Query = {}): Promise<Payment[]> {
    return window.api.payment.list(query);
  },

  async count(
    query: Partial<
      Pick<PaymentListQuery, "customerId" | "fromDate" | "toDate">
    > = {}
  ): Promise<number> {
    return window.api.payment.count(query);
  },

  async get(id: number): Promise<PaymentDetail | null> {
    return window.api.payment.get(id);
  },

  async create(input: CreatePaymentInput): Promise<PaymentDetail> {
    return window.api.payment.create(input);
  },
};