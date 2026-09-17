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
};

export const DEFAULT_SHOP_INFO: ShopInfo = {
  name: "Sheikh Mushtaq General Store",
  address: "Railway Road Gujrat",
  phone: "",
  footer: "Thank you for shopping!",
};

/**
 * Build the printable HTML for a bill.
 * The returned string is a fragment; the main process wraps it with CSS.
 */
export function buildBillHtml(
  bill: BillDetail,
  size: PrintSize,
  shop: ShopInfo = DEFAULT_SHOP_INFO
): string {
  if (size === "a4") return buildBillA4(bill, shop);
  return buildBillThermal(bill, shop);
}

/* ---------- Thermal (58mm / 80mm) ---------- */

function buildBillThermal(bill: BillDetail, shop: ShopInfo): string {
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

  const previousOutstanding = 0; // Only shown if bill has a customer with pending. We compute below.
  void previousOutstanding;

  const html = `
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
    ${
      bill.customerName
        ? `<div class="row">
            <span class="label">Customer:</span>
            <span class="value">${escapeHtml(bill.customerName)}</span>
          </div>`
        : `<div class="row">
            <span class="label">Customer:</span>
            <span class="value">Walk-in</span>
          </div>`
    }

    <div class="divider"></div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="qty">Qty</th>
          <th class="price">Rate</th>
          <th class="total">Total</th>
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
    <div class="row total-line">
      <span class="label">Total:</span>
      <span class="value">${formatMoney(bill.totalAmount, {
        showDecimals: false,
      })}</span>
    </div>
    <div class="row">
      <span class="label">Paid:</span>
      <span class="value">${formatMoney(bill.paidAmount, {
        showDecimals: false,
      })}</span>
    </div>
    ${
      bill.remainingAmount > 0
        ? `<div class="row bold">
            <span class="label">Due:</span>
            <span class="value">${formatMoney(bill.remainingAmount, {
              showDecimals: false,
            })}</span>
          </div>`
        : ""
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

  return html;
}

/* ---------- A4 Invoice ---------- */

function buildBillA4(bill: BillDetail, shop: ShopInfo): string {
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
          ${bill.customerName ? escapeHtml(bill.customerName) : "Walk-in Customer"}
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
        <tr>
          <td class="label">Paid:</td>
          <td class="value">${formatMoney(bill.paidAmount)}</td>
        </tr>
        ${
          bill.remainingAmount > 0
            ? `<tr>
                <td class="label" style="font-weight: 700;">Due:</td>
                <td class="value" style="font-weight: 700;">${formatMoney(bill.remainingAmount)}</td>
              </tr>`
            : ""
        }
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
 */
export async function printBill(
  bill: BillDetail,
  size: PrintSize,
  shop?: ShopInfo
): Promise<void> {
  const html = buildBillHtml(bill, size, shop);
  await window.api.print.html({
    html,
    size,
    documentTitle: bill.billNumber,
  });
}