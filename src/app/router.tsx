import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { CustomersPage } from "@/features/customers/CustomersPage";
import { CompaniesPage } from "@/features/companies/CompaniesPage";
import { CategoriesPage } from "@/features/categories/CategoriesPage";
import { UnitsPage } from "@/features/units/UnitsPage";
import { UnitConversionsPage } from "@/features/units/UnitConversionsPage";
import { ProductsPage } from "@/features/products/ProductsPage";
import { VariantsPage } from "@/features/variants/VariantsPage";
import { PurchasesPage } from "@/features/purchases/PurchasesPage";
import { PurchaseDetailPage } from "@/features/purchases/PurchaseDetailPage";
import { PurchaseEntryPage } from "@/features/purchases/PurchaseEntryPage";
import { StockPage } from "@/features/inventory/StockPage";
import { AdjustmentsPage } from "@/features/adjustments/AdjustmentsPage";
import { BillsPage } from "@/features/bills/BillsPage";
import { BillDetailPage } from "@/features/bills/BillDetailPage";
import { BillEntryPage } from "@/features/bills/BillEntryPage";
import { KhaataPage } from "@/features/khaata/KhaataPage";
import { KhaataDetailPage } from "@/features/khaata/KhaataDetailPage";
import { PaymentsPage } from "@/features/payments/PaymentsPage";
import { ComingSoonPage } from "@/features/_placeholders/ComingSoonPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />

        {/* Billing */}
        <Route path="billing" element={<BillsPage />} />
        <Route path="billing/new" element={<BillEntryPage />} />
        <Route path="billing/:id" element={<BillDetailPage />} />

        {/* Master data */}
        <Route path="customers" element={<CustomersPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="units" element={<UnitsPage />} />
        <Route path="unit-conversions" element={<UnitConversionsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="variants" element={<VariantsPage />} />

        {/* Inventory */}
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="purchases/new" element={<PurchaseEntryPage />} />
        <Route path="purchases/:id" element={<PurchaseDetailPage />} />
        <Route path="inventory" element={<StockPage />} />
        <Route path="adjustments" element={<AdjustmentsPage />} />

        {/* Khaata & Payments */}
        <Route path="khaata" element={<KhaataPage />} />
        <Route path="khaata/:customerId" element={<KhaataDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />

        {/* Later phases */}
        <Route path="expenses" element={<ComingSoonPage title="Expenses" />} />
        <Route path="reports" element={<ComingSoonPage title="Reports" />} />
        <Route path="settings" element={<ComingSoonPage title="Settings" />} />
        <Route path="*" element={<ComingSoonPage title="Not Found" />} />
      </Route>
    </Routes>
  );
}