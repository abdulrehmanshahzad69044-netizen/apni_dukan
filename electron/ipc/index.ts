import { registerAppIpc } from "./app.ipc";
import { registerCustomerIpc } from "./customer.ipc";
import { registerCompanyIpc } from "./company.ipc";

export function registerAllIpc() {
  registerAppIpc();
  registerCustomerIpc();
  registerCompanyIpc();
  // Phase 1:
  // registerCategoryIpc();
  // registerUnitIpc();
  // registerProductIpc();
  // registerVariantIpc();
}