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
import type {
  Category,
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category";
import type {
  CreateUnitConversionInput,
  CreateUnitInput,
  Unit,
  UnitConversion,
  UnitListQuery,
  UpdateUnitConversionInput,
  UpdateUnitInput,
} from "./unit";
import type {
  CreateProductInput,
  Product,
  ProductListQuery,
  UpdateProductInput,
} from "./product";
import type {
  CreateVariantInput,
  UpdateVariantInput,
  Variant,
  VariantListQuery,
} from "./variant";
import type {
  CreatePurchaseInput,
  Purchase,
  PurchaseListQuery,
  StockBatch,
} from "./purchase";
import type { StockItem, StockListQuery } from "./inventory";

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
  category: {
    list: (query?: Partial<CategoryListQuery>) => Promise<Category[]>;
    count: (
      query?: Pick<CategoryListQuery, "search" | "includeDeleted">
    ) => Promise<number>;
    get: (id: number) => Promise<Category | null>;
    create: (input: CreateCategoryInput) => Promise<Category>;
    update: (input: UpdateCategoryInput) => Promise<Category>;
    delete: (id: number) => Promise<{ ok: true }>;
    restore: (id: number) => Promise<{ ok: true }>;
  };
  unit: {
    list: (query?: Partial<UnitListQuery>) => Promise<Unit[]>;
    count: (
      query?: Pick<UnitListQuery, "search" | "includeDeleted">
    ) => Promise<number>;
    get: (id: number) => Promise<Unit | null>;
    create: (input: CreateUnitInput) => Promise<Unit>;
    update: (input: UpdateUnitInput) => Promise<Unit>;
    delete: (id: number) => Promise<{ ok: true }>;
    restore: (id: number) => Promise<{ ok: true }>;
  };
  unitConversion: {
    list: (filter?: { unitId?: number }) => Promise<UnitConversion[]>;
    create: (input: CreateUnitConversionInput) => Promise<UnitConversion>;
    update: (input: UpdateUnitConversionInput) => Promise<UnitConversion>;
    delete: (id: number) => Promise<{ ok: true }>;
  };
  product: {
    list: (query?: Partial<ProductListQuery>) => Promise<Product[]>;
    count: (
      query?: Pick<
        ProductListQuery,
        "search" | "includeDeleted" | "categoryId" | "companyId"
      >
    ) => Promise<number>;
    get: (id: number) => Promise<Product | null>;
    create: (input: CreateProductInput) => Promise<Product>;
    update: (input: UpdateProductInput) => Promise<Product>;
    delete: (id: number) => Promise<{ ok: true }>;
    restore: (id: number) => Promise<{ ok: true }>;
  };
  variant: {
    list: (query?: Partial<VariantListQuery>) => Promise<Variant[]>;
    count: (
      query?: Pick<VariantListQuery, "search" | "includeDeleted" | "productId">
    ) => Promise<number>;
    get: (id: number) => Promise<Variant | null>;
    create: (input: CreateVariantInput) => Promise<Variant>;
    update: (input: UpdateVariantInput) => Promise<Variant>;
    delete: (id: number) => Promise<{ ok: true }>;
    restore: (id: number) => Promise<{ ok: true }>;
  };
  purchase: {
    list: (query?: Partial<PurchaseListQuery>) => Promise<Purchase[]>;
    count: (
      query?: Pick<PurchaseListQuery, "companyId" | "fromDate" | "toDate">
    ) => Promise<number>;
    get: (id: number) => Promise<Purchase | null>;
    getBatches: (purchaseId: number) => Promise<StockBatch[]>;
    create: (input: CreatePurchaseInput) => Promise<Purchase>;
    setPaidAmount: (input: {
      id: number;
      paidAmount: number;
    }) => Promise<Purchase>;
  };
  inventory: {
    listStock: (query?: Partial<StockListQuery>) => Promise<StockItem[]>;
    totals: () => Promise<{
      totalVariants: number;
      totalStockValue: number;
      lowStockCount: number;
      outOfStockCount: number;
    }>;
  };
};

declare global {
  interface Window {
    api: AppApi;
  }
}