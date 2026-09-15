import { registerAppIpc } from "./app.ipc";
import { registerCustomerIpc } from "./customer.ipc";
import { registerCompanyIpc } from "./company.ipc";
import { registerCategoryIpc } from "./category.ipc";
import { registerUnitIpc } from "./unit.ipc";
import { registerProductIpc } from "./product.ipc";
import { registerVariantIpc } from "./variant.ipc";
import { registerPurchaseIpc } from "./purchase.ipc";
import { registerInventoryIpc } from "./inventory.ipc";
import { registerAdjustmentIpc } from "./adjustment.ipc";
import { registerBillIpc } from "./bill.ipc";

export function registerAllIpc() {
  registerAppIpc();
  registerCustomerIpc();
  registerCompanyIpc();
  registerCategoryIpc();
  registerUnitIpc();
  registerProductIpc();
  registerVariantIpc();
  registerPurchaseIpc();
  registerInventoryIpc();
  registerAdjustmentIpc();
  registerBillIpc();
  // Phase 4:
  // registerPaymentIpc();
  // registerKhaataIpc();
}