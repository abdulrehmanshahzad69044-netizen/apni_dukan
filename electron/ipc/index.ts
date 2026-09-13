import { registerAppIpc } from "./app.ipc";
import { registerCustomerIpc } from "./customer.ipc";
import { registerCompanyIpc } from "./company.ipc";
import { registerCategoryIpc } from "./category.ipc";
import { registerUnitIpc } from "./unit.ipc";
import { registerProductIpc } from "./product.ipc";

export function registerAllIpc() {
  registerAppIpc();
  registerCustomerIpc();
  registerCompanyIpc();
  registerCategoryIpc();
  registerUnitIpc();
  registerProductIpc();
  // Phase 1:
  // registerVariantIpc();
}