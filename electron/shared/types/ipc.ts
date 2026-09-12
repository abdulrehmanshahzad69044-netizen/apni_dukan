import type {
  CreateCustomerInput,
  Customer,
  CustomerListQuery,
  UpdateCustomerInput,
} from "./customer";
import type {
  Company,
  CompanyListQuery,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "./company";

export type IpcChannels = {
  "app:ping": {
    request: { message: string };
    response: { reply: string; timestamp: number };
  };
  "app:version": {
    request: void;
    response: { app: string; electron: string; node: string; chrome: string };
  };
};

export type IpcChannel = keyof IpcChannels;
export type IpcRequest<C extends IpcChannel> = IpcChannels[C]["request"];
export type IpcResponse<C extends IpcChannel> = IpcChannels[C]["response"];

export type AppApi = {
  app: {
    ping: (message: string) => Promise<IpcResponse<"app:ping">>;
    version: () => Promise<IpcResponse<"app:version">>;
  };
  customer: {
    list: (query?: Partial<CustomerListQuery>) => Promise<Customer[]>;
    count: (
      query?: Pick<CustomerListQuery, "search" | "includeDeleted">
    ) => Promise<number>;
    get: (id: number) => Promise<Customer | null>;
    create: (input: CreateCustomerInput) => Promise<Customer>;
    update: (input: UpdateCustomerInput) => Promise<Customer>;
    delete: (id: number) => Promise<{ ok: true }>;
    restore: (id: number) => Promise<{ ok: true }>;
  };
  company: {
    list: (query?: Partial<CompanyListQuery>) => Promise<Company[]>;
    count: (
      query?: Pick<CompanyListQuery, "search" | "includeDeleted">
    ) => Promise<number>;
    get: (id: number) => Promise<Company | null>;
    create: (input: CreateCompanyInput) => Promise<Company>;
    update: (input: UpdateCompanyInput) => Promise<Company>;
    delete: (id: number) => Promise<{ ok: true }>;
    restore: (id: number) => Promise<{ ok: true }>;
  };
};

declare global {
  interface Window {
    api: AppApi;
  }
}