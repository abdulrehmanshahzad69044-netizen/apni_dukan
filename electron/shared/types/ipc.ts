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
  CreateUnitInput,
  Unit,
  UnitListQuery,
  UpdateUnitInput,
} from "./unit";
import type {
  CreateFullProductInput,
  CreateProductInput,
  Product,
  ProductListQuery,
  UpdateProductInput,
} from "./product";
import type {
  CreateQuickItemInput,
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
import type {
  PriceHistoryEntry,
  StockItem,
  StockListQuery,
} from "./inventory";
import type {
  AdjustmentListQuery,
  CreateAdjustmentInput,
  StockAdjustment,
} from "./adjustment";

import type {
  Bill,
  BillDetail,
  BillListQuery,
  CreateBillInput,
  FifoCostPreview,
} from "./bill";
import type {
  CreatePaymentInput,
  KhaataDetail,
  KhaataEntry,
  KhaataListQuery,
  Payment,
  PaymentDetail,
  PaymentListQuery,
} from "./payment";
import type {
  CompanyPayment,
  CompanyPaymentListQuery,
  CreateCompanyPaymentInput,
  CreateExpenseInput,
  Expense,
  ExpenseListQuery,
  UpdateExpenseInput,
} from "./expense";
import type {
  BackupFile,
  GdriveConfigInput,
  GdriveStatus,
  LocalBackupInput,
  RestoreResult,
} from "./backup";
import type {
  CreateUdhaarInput,
  CustomerUdhaar,
  UdhaarListQuery,
} from "./udhaar";
import type {
  CreateOpeningStockInput,
  OpeningStockEntry,
} from "./opening-stock";
import type { Settings, UpdateSettingsInput } from "./settings";

import type { FullReport, ReportQuery, SalesSummary } from "./report";

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
    createFull: (input: CreateFullProductInput) => Promise<Product>;
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
    createQuick: (input: CreateQuickItemInput) => Promise<Variant>;
    update: (input: UpdateVariantInput) => Promise<Variant>;
    delete: (id: number) => Promise<{ ok: true }>;
    restore: (id: number) => Promise<{ ok: true }>;
    setPinned: (payload: {
      id: number;
      pinned: boolean;
    }) => Promise<Variant>;
    setPriceVolatile: (payload: {
      id: number;
      priceVolatile: boolean;
    }) => Promise<Variant>;
    promoteFromQuick: (id: number) => Promise<Variant>;
    listVolatile: () => Promise<
      Array<{
        variantId: number;
        productName: string;
        variantName: string;
        baseUnitShortName: string;
        currentStock: number;
        currentRetail: number | null;
        currentWholesale: number | null;
      }>
    >;
    bulkUpdatePrices: (payload: {
      updates: Array<{
        variantId: number;
        retailPrice: number | null;
        wholesalePrice: number | null;
      }>;
    }) => Promise<{ updated: number }>;
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
    priceHistory: (query: {
      variantId: number;
    }) => Promise<PriceHistoryEntry[]>;
  };
  adjustment: {
    list: (
      query?: Partial<AdjustmentListQuery>
    ) => Promise<StockAdjustment[]>;
    get: (id: number) => Promise<StockAdjustment | null>;
    create: (input: CreateAdjustmentInput) => Promise<StockAdjustment>;
  };
    bill: {
    list: (query?: Partial<BillListQuery>) => Promise<Bill[]>;
    count: (
      query?: Pick<
        BillListQuery,
        "customerId" | "status" | "fromDate" | "toDate"
      >
    ) => Promise<number>;
    get: (id: number) => Promise<BillDetail | null>;
    create: (input: CreateBillInput) => Promise<BillDetail>;
    finalize: (id: number) => Promise<BillDetail>;
    deleteDraft: (id: number) => Promise<{ ok: true }>;
    previewFifoCost: (input: {
      variantId: number;
      quantity: number;
    }) => Promise<FifoCostPreview>;
        getForDuplicate: (id: number) => Promise<{
      customerId: number | null;
      remarks: string;
      lines: Array<{
        variantId: number;
        productName: string;
        variantName: string;
        baseUnitShortName: string;
        purchaseUnitShortName: string | null;
        purchaseUnitFactor: number | null;
        unitId: number;
        quantity: number;
        unitPrice: number;
      }>;
    } | null>;
    getForEdit: (id: number) => Promise<{
      id: number;
      billNumber: string;
      customerId: number | null;
      billDate: number;
      remarks: string;
      status: "draft" | "held";
      items: Array<{
        variantId: number;
        productName: string;
        variantName: string;
        baseUnitId: number;
        baseUnitName: string;
        baseUnitShortName: string;
        purchaseUnitId: number | null;
        purchaseUnitName: string | null;
        purchaseUnitShortName: string | null;
        purchaseUnitFactor: number | null;
        unitId: number;
        quantity: number;
        unitPrice: number;
      }>;
    } | null>;
    updateAndSave: (input: {
      id: number;
      customerId: number | null;
      billDate: Date;
      paidAmount: number;
      amountReceived: number;
      remarks?: string;
      status: "draft" | "held" | "finalized";
      lines: Array<{
        variantId: number;
        unitId: number;
        quantity: number;
        unitPrice: number;
      }>;
    }) => Promise<BillDetail>;
  
  };
  payment: {
    list: (query?: Partial<PaymentListQuery>) => Promise<Payment[]>;
    count: (
      query?: Pick<PaymentListQuery, "customerId" | "fromDate" | "toDate">
    ) => Promise<number>;
    get: (id: number) => Promise<PaymentDetail | null>;
    create: (input: CreatePaymentInput) => Promise<PaymentDetail>;
  };
  khaata: {
    list: (query?: Partial<KhaataListQuery>) => Promise<KhaataEntry[]>;
    detail: (customerId: number) => Promise<KhaataDetail | null>;
    totalOutstanding: () => Promise<number>;
  };
  expense: {
    list: (query?: Partial<ExpenseListQuery>) => Promise<Expense[]>;
    count: (
      query?: Pick<ExpenseListQuery, "search" | "fromDate" | "toDate">
    ) => Promise<number>;
    get: (id: number) => Promise<Expense | null>;
    create: (input: CreateExpenseInput) => Promise<Expense>;
    update: (input: UpdateExpenseInput) => Promise<Expense>;
    delete: (id: number) => Promise<{ ok: true }>;
  };
  companyPayment: {
    list: (
      query?: Partial<CompanyPaymentListQuery>
    ) => Promise<CompanyPayment[]>;
    get: (id: number) => Promise<CompanyPayment | null>;
    getAllocations: (id: number) => Promise<
      Array<{
        id: number;
        purchaseId: number;
        purchaseNumber: string;
        purchaseDate: number;
        amount: number;
      }>
    >;
    create: (input: CreateCompanyPaymentInput) => Promise<CompanyPayment>;
    delete: (id: number) => Promise<{ ok: true }>;
    totalOutstanding: () => Promise<number>;
  };

  report: {
    full: (query?: Partial<ReportQuery>) => Promise<FullReport>;
    today: () => Promise<SalesSummary>;
  };
  print: {
    html: (req: {
      html: string;
      size: "thermal_80" | "thermal_58" | "a4";
      documentTitle?: string;
    }) => Promise<{ ok: true }>;
    pdf: (req: {
      html: string;
      size: "thermal_80" | "thermal_58" | "a4";
      documentTitle?: string;
    }) => Promise<{ ok: true }>;
  };
  backup: {
    createLocal: (input?: LocalBackupInput) => Promise<BackupFile>;
    saveAsDialog: () => Promise<string | null>;
    pickFile: () => Promise<string | null>;
    listLocal: () => Promise<BackupFile[]>;
    restore: (input: { path: string }) => Promise<RestoreResult>;
    deleteLocal: (filePath: string) => Promise<{ ok: true }>;
    restart: () => Promise<void>;
  };
  gdrive: {
    status: () => Promise<GdriveStatus>;
    configure: (input: GdriveConfigInput) => Promise<GdriveStatus>;
    connect: () => Promise<GdriveStatus>;
    disconnect: () => Promise<GdriveStatus>;
    upload: (input: { filename?: string }) => Promise<BackupFile>;
    list: () => Promise<BackupFile[]>;
    restore: (input: { fileId: string }) => Promise<RestoreResult>;
  };
  settings: {
    get: () => Promise<Settings>;
    update: (input: UpdateSettingsInput) => Promise<Settings>;
  };
  udhaar: {
    list: (query?: Partial<UdhaarListQuery>) => Promise<CustomerUdhaar[]>;
    get: (id: number) => Promise<CustomerUdhaar | null>;
    create: (input: CreateUdhaarInput) => Promise<CustomerUdhaar>;
    delete: (id: number) => Promise<{ ok: true }>;
  };
  openingStock: {
    list: () => Promise<OpeningStockEntry[]>;
    create: (input: CreateOpeningStockInput) => Promise<OpeningStockEntry[]>;
    delete: (batchId: number) => Promise<{ ok: true }>;
  };
};

declare global {
  interface Window {
    api: AppApi;
  }
}