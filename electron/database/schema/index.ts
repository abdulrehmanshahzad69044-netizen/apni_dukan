// Shared helpers
export * from "./_shared";

// Settings
export * from "./settings";

// Module schemas
export * from "./customers";
export * from "./companies";
export * from "./categories";
export * from "./units";
export * from "./products";
export * from "./variants";

// Phase 2 — Inventory
export * from "./purchases";
export * from "./stock-batches";
export * from "./stock-ledger";
export * from "./stock-adjustments";

// Phase 3 — Billing
export * from "./bills";
export * from "./bill-items";
export * from "./bill-item-fifo";

// Phase 4 — Payments (allocations reference both bills and udhaar)
export * from "./customer-udhaar";
export * from "./payments";
export * from "./payment-allocations";

// Phase 5 — Expenses
export * from "./expenses";
export * from "./company-payments";
export * from "./company-payment-allocations";