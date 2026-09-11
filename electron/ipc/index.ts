import { registerAppIpc } from "./app.ipc";
import { registerCustomerIpc } from "./customer.ipc";

/**
 * Registers ALL IPC handlers.
 * Add new modules here as they're built.
 */
export function registerAllIpc() {
  registerAppIpc();
  registerCustomerIpc();
  // Phase 1:
  // registerCompanyIpc();
  // registerCategoryIpc();
  // registerUnitIpc();
  // registerProductIpc();
  // registerVariantIpc();
}