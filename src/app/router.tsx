import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { CustomersPage } from "@/features/customers/CustomersPage";
import { CompaniesPage } from "@/features/companies/CompaniesPage";
import { CategoriesPage } from "@/features/categories/CategoriesPage";
import { UnitsPage } from "@/features/units/UnitsPage";
import { UnitConversionsPage } from "@/features/units/UnitConversionsPage";
import { ComingSoonPage } from "@/features/_placeholders/ComingSoonPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="billing" element={<ComingSoonPage title="Billing" />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="units" element={<UnitsPage />} />
        <Route path="unit-conversions" element={<UnitConversionsPage />} />
        <Route path="products" element={<ComingSoonPage title="Products" />} />
        <Route path="inventory" element={<ComingSoonPage title="Inventory" />} />
        <Route path="khaata" element={<ComingSoonPage title="Khaata" />} />
        <Route path="payments" element={<ComingSoonPage title="Payments" />} />
        <Route path="expenses" element={<ComingSoonPage title="Expenses" />} />
        <Route path="reports" element={<ComingSoonPage title="Reports" />} />
        <Route path="settings" element={<ComingSoonPage title="Settings" />} />
        <Route path="*" element={<ComingSoonPage title="Not Found" />} />
      </Route>
    </Routes>
  );
}