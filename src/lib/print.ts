import type { BillDetail } from "../../electron/shared/types/bill";
import {
  formatMoney,
  formatQuantity,
  formatDate,
  formatDateTime,
} from "./format";

export type PrintSize = "thermal_80" | "thermal_58" | "a4";

export type ShopInfo = {
  name: string;
  address?: string;
  phone?: string;
  footer?: string;
  taxNumber?: string;
  /** Optional — used only for the grand total display */
  showPreviousDueOnPrint?: boolean;
};

export const DEFAULT_SHOP_INFO: ShopInfo = {
  name: "Apni Dukan",
  address: "",
  phone: "",
  footer: "Thank you for your business!",
};

/**
 * Build the printable HTML for a bill.
 * English labels only.
 */
export function buildBillHtml(
  bill: BillDetail,
  size: PrintSize,
  shop: ShopInfo = DEFAULT_SHOP_INFO,
  previousOutstanding: number = 0
): string {
  if (size === "a4") return buildBillA4(bill, shop, previousOutstanding);
  return buildBillThermal(bill, shop, previousOutstanding);
}

/* ---------- Thermal (58mm / 80mm) ---------- */

function buildBillThermal(
  bill: BillDetail,
  shop: ShopInfo,
  previousOutstanding: number
): string {
  const itemsHtml = bill.items
    .map(
      (i) => `
        <tr>
          <td>
            <div class="bold">${escapeHtml(i.productName)}</div>
            <div>${escapeHtml(i.variantName)}</div>
          </td>
          <td class="qty">${formatQuantity(i.quantity)}</td>
          <td class="price">${formatMoney(i.unitPrice, { showDecimals: false })}</td>
          <td class="total">${formatMoney(i.lineTotal, { showDecimals: false })}</td>
        </tr>
      `
    )
    .join("");

  const grandTotal = bill.totalAmount + previousOutstanding;
  const finalDue = grandTotal - (bill.amountReceived || bill.paidAmount);

  return `
    <div class="shop-name">${escapeHtml(shop.name)}</div>
    ${
      shop.address
        ? `<div class="shop-meta">${escapeHtml(shop.address)}</div>`
        : ""
    }
    ${
      shop.phone
        ? `<div class="shop-meta">Ph: ${escapeHtml(shop.phone)}</div>`
        : ""
    }
    ${
      shop.taxNumber
        ? `<div class="shop-meta">NTN: ${escapeHtml(shop.taxNumber)}</div>`
        : ""
    }

    <div class="divider"></div>

    <div class="row">
      <span class="label">Bill #:</span>
      <span class="value">${escapeHtml(bill.billNumber)}</span>
    </div>
    <div class="row">
      <span class="label">Date:</span>
      <span class="value">${formatDateTime(bill.billDate)}</span>
    </div>
    <div class="row">
      <span class="label">Customer:</span>
      <span class="value">${escapeHtml(bill.customerName ?? "Walk-in")}</span>
    </div>

    <div class="divider"></div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="qty">Qty</th>
          <th class="price">Rate</th>
          <th class="total">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="divider"></div>

    <div class="row">
      <span class="label">Items:</span>
      <span class="value">${bill.items.length}</span>
    </div>

    <div class="row">
      <span class="label">Subtotal:</span>
      <span class="value">${formatMoney(bill.totalAmount, { showDecimals: false })}</span>
    </div>

    ${
      previousOutstanding > 0
        ? `
          <div class="row">
            <span class="label">Previous Due:</span>
            <span class="value">${formatMoney(previousOutstanding, { showDecimals: false })}</span>
          </div>
          <div class="row total-line">
            <span class="label">GRAND TOTAL:</span>
            <span class="value">${formatMoney(grandTotal, { showDecimals: false })}</span>
          </div>
        `
        : `
          <div class="row total-line">
            <span class="label">TOTAL:</span>
            <span class="value">${formatMoney(bill.totalAmount, { showDecimals: false })}</span>
          </div>
        `
    }

        <div class="row">
      <span class="label">Paid Now:</span>
      <span class="value">${formatMoney(bill.amountReceived || bill.paidAmount, { showDecimals: false })}</span>
    </div>

    ${
      finalDue > 0
        ? `<div class="row bold">
            <span class="label">Balance Due:</span>
            <span class="value">${formatMoney(finalDue, { showDecimals: false })}</span>
          </div>`
        : `<div class="row bold">
            <span class="label">Balance Due:</span>
            <span class="value">Rs 0</span>
          </div>`
    }

    ${
      bill.remarks
        ? `<div class="divider"></div>
           <div style="font-size: 0.9em;">Note: ${escapeHtml(bill.remarks)}</div>`
        : ""
    }

    <div class="divider"></div>
    <div class="footer">${escapeHtml(shop.footer ?? "")}</div>
  `;
}

/* ---------- A4 Invoice ---------- */

function buildBillA4(
  bill: BillDetail,
  shop: ShopInfo,
  previousOutstanding: number
): string {
  const itemsHtml = bill.items
    .map(
      (i) => `
        <tr>
          <td>
            <div style="font-weight:600;">${escapeHtml(i.productName)}</div>
            <div class="muted" style="font-size: 11px;">${escapeHtml(i.variantName)} · ${escapeHtml(i.baseUnitShortName)}</div>
          </td>
          <td class="right">${formatQuantity(i.quantity)}</td>
          <td class="right">${formatMoney(i.unitPrice)}</td>
          <td class="right">${formatMoney(i.lineTotal)}</td>
        </tr>
      `
    )
    .join("");

  const grandTotal = bill.totalAmount + previousOutstanding;
  const finalDue = grandTotal - (bill.amountReceived || bill.paidAmount);

  return `
    <div class="header">
      <div>
        <div class="shop-name">${escapeHtml(shop.name)}</div>
        ${shop.address ? `<div class="muted">${escapeHtml(shop.address)}</div>` : ""}
        ${shop.phone ? `<div class="muted">Ph: ${escapeHtml(shop.phone)}</div>` : ""}
        ${shop.taxNumber ? `<div class="muted">NTN: ${escapeHtml(shop.taxNumber)}</div>` : ""}
      </div>
      <div class="meta">
        <div style="font-size: 20px; font-weight: 700; color: #000;">INVOICE</div>
        <div>${escapeHtml(bill.billNumber)}</div>
        <div>${formatDate(bill.billDate)}</div>
      </div>
    </div>

    <div class="divider"></div>

    <div style="display: flex; justify-content: space-between; margin-top: 8px;">
      <div>
        <div class="muted" style="font-size: 11px;">BILL TO</div>
        <div style="font-size: 14px; font-weight: 600; margin-top: 2px;">
          ${escapeHtml(bill.customerName ?? "Walk-in Customer")}
        </div>
      </div>
      <div class="right">
        <div class="muted" style="font-size: 11px;">STATUS</div>
        <div style="font-size: 14px; font-weight: 600; margin-top: 2px; text-transform: capitalize;">
          ${escapeHtml(bill.status)}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="right" style="width: 60px;">Qty</th>
          <th class="right" style="width: 100px;">Rate</th>
          <th class="right" style="width: 100px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="summary">
      <table>
        <tr>
          <td class="label">Items:</td>
          <td class="value">${bill.items.length}</td>
        </tr>
        <tr>
          <td class="label">Subtotal:</td>
          <td class="value">${formatMoney(bill.totalAmount)}</td>
        </tr>
        ${
          previousOutstanding > 0
            ? `
              <tr>
                <td class="label">Previous Due:</td>
                <td class="value">${formatMoney(previousOutstanding)}</td>
              </tr>
              <tr>
                <td class="label" style="font-weight: 700; font-size: 14px;">GRAND TOTAL:</td>
                <td class="value" style="font-weight: 700; font-size: 14px;">${formatMoney(grandTotal)}</td>
              </tr>
            `
            : `
              <tr>
                <td class="label" style="font-weight: 700;">TOTAL:</td>
                <td class="value" style="font-weight: 700;">${formatMoney(bill.totalAmount)}</td>
              </tr>
            `
        }
                <tr>
          <td class="label">Paid Now:</td>
          <td class="value">${formatMoney(bill.amountReceived || bill.paidAmount)}</td>
        </tr>
        <tr>
          <td class="label" style="font-weight: 700;">Balance Due:</td>
          <td class="value" style="font-weight: 700;">${formatMoney(finalDue)}</td>
        </tr>
      </table>
    </div>

    ${
      bill.remarks
        ? `<div class="divider"></div>
           <div class="muted"><strong>Note:</strong> ${escapeHtml(bill.remarks)}</div>`
        : ""
    }

    <div class="divider" style="margin-top: 24px;"></div>
    <div class="center muted" style="font-size: 11px; margin-top: 12px;">
      ${escapeHtml(shop.footer ?? "")}
    </div>
  `;
}

/* ---------- Utils ---------- */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Trigger print via IPC.
 * If the customer has a pending khaata, pass `previousOutstanding` so the
 * printed bill folds it into the GRAND TOTAL.
 */
export async function printBill(
  bill: BillDetail,
  size: PrintSize,
  shop?: ShopInfo,
  previousOutstanding: number = 0
): Promise<void> {
  let shopInfo = shop;
  if (!shopInfo) {
    try {
      const s = await window.api.settings.get();
      shopInfo = {
        name: s.shopName,
        address: s.shopAddress,
        phone: s.shopPhone,
        footer: s.receiptFooter,
        taxNumber: s.taxNumber,
      };
    } catch {
      shopInfo = DEFAULT_SHOP_INFO;
    }
  }
  const html = buildBillHtml(bill, size, shopInfo, previousOutstanding);
  await window.api.print.html({
    html,
    size,
    documentTitle: bill.billNumber,
  });
}