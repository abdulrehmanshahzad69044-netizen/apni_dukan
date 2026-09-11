import { registerAppIpc } from "./app.ipc";

/**
 * Registers ALL IPC handlers.
 * Add new modules here as they're built.
 */
export function registerAllIpc() {
  registerAppIpc();
  // Phase 1:
  // registerCustomerIpc();
  // registerCompanyIpc();
  // ...
}