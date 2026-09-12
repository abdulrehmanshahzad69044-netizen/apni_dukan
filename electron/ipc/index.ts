import { registerAppIpc } from "./app.ipc";
import { registerCustomerIpc } from "./customer.ipc";
import { registerCompanyIpc } from "./company.ipc";
import { registerCategoryIpc } from "./category.ipc";

export function registerAllIpc() {
  registerAppIpc();
  registerCustomerIpc();
  registerCompanyIpc();
  registerCategoryIpc();
  // Phase 1:
  // registerUnitIpc();
  // registerProductIpc();
  // registerVariantIpc();
}