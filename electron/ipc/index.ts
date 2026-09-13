import { registerAppIpc } from "./app.ipc";
import { registerCustomerIpc } from "./customer.ipc";
import { registerCompanyIpc } from "./company.ipc";
import { registerCategoryIpc } from "./category.ipc";
import { registerUnitIpc } from "./unit.ipc";
import { registerProductIpc } from "./product.ipc";
import { registerVariantIpc } from "./variant.ipc";

export function registerAllIpc() {
  registerAppIpc();
  registerCustomerIpc();
  registerCompanyIpc();
  registerCategoryIpc();
  registerUnitIpc();
  registerProductIpc();
  registerVariantIpc();
  // Phase 2:
  // registerPurchaseIpc();
  // registerInventoryIpc();
}