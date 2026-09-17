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
import { registerPaymentIpc } from "./payment.ipc";
import { registerExpenseIpc } from "./expense.ipc";
import { registerReportIpc } from "./report.ipc";
import { registerPrintIpc } from "./print.ipc";
import { registerBackupIpc } from "./backup.ipc";
import { registerSettingsIpc } from "./settings.ipc";

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
  registerPaymentIpc();
  registerExpenseIpc();
  registerReportIpc();
  registerPrintIpc();
  registerBackupIpc();
  registerSettingsIpc();
}