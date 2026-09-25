import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { CustomersPage } from "@/features/customers/CustomersPage";
import { CompaniesPage } from "@/features/companies/CompaniesPage";
import { CategoriesPage } from "@/features/categories/CategoriesPage";
import { UnitsPage } from "@/features/units/UnitsPage";
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
import { ExpensesPage } from "@/features/expenses/ExpensesPage";
import { CompanyPaymentsPage } from "@/features/company-payments/CompanyPaymentsPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { OpeningStockPage } from "@/features/opening-stock/OpeningStockPage";
import { ComingSoonPage } from "@/features/_placeholders/ComingSoonPage";
import { FullProductPage } from "@/features/products/FullProductPage";
import { UpdatePricesPage } from "@/features/update-prices/UpdatePricesPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />

        <Route path="billing" element={<BillsPage />} />
        <Route path="billing/new" element={<BillEntryPage />} />
        <Route path="billing/:id" element={<BillDetailPage />} />

        <Route path="customers" element={<CustomersPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="units" element={<UnitsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="variants" element={<VariantsPage />} />
        <Route path="update-prices" element={<UpdatePricesPage />} />

        <Route path="products/new-full" element={<FullProductPage />} />

        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="purchases/new" element={<PurchaseEntryPage />} />
        <Route path="purchases/:id" element={<PurchaseDetailPage />} />
        <Route path="inventory" element={<StockPage />} />
        <Route path="adjustments" element={<AdjustmentsPage />} />
        <Route path="opening-stock" element={<OpeningStockPage />} />

        <Route path="khaata" element={<KhaataPage />} />
        <Route path="khaata/:customerId" element={<KhaataDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="company-payments" element={<CompanyPaymentsPage />} />

        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />

        <Route path="*" element={<ComingSoonPage title="Not Found" />} />
      </Route>
    </Routes>
  );
}