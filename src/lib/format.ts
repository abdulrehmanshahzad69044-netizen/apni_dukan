/**
 * Format money stored as paisa (integer) into a display string.
 * Example: 125050 → "₨ 1,250.50"
 */
export function formatMoney(
  paisa: number,
  opts?: { showDecimals?: boolean }
): string {
  const showDecimals = opts?.showDecimals ?? true;
  const rupees = paisa / 100;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);
}

export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paisaToRupees(paisa: number): number {
  return paisa / 100;
}

/**
 * Format a quantity stored as milli-units (× 1000).
 * Example: 1500 → "1.5", 24000 → "24", 500 → "0.5"
 */
export function formatQuantity(milliUnits: number): string {
  const n = milliUnits / 1000;
  // Drop trailing zeros for integers
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Convert a user-typed quantity to milli-units.
 * Example: 1.5 → 1500
 */
export function quantityToMilli(qty: number): number {
  return Math.round(qty * 1000);
}

export function milliToQuantity(milli: number): number {
  return milli / 1000;
}

/**
 * Format unix seconds / Date / ISO string to a readable date.
 */
export function formatDate(input: number | Date | string): string {
  const d =
    typeof input === "number"
      ? new Date(input * 1000)
      : typeof input === "string"
      ? new Date(input)
      : input;
  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

/**
 * Format unix seconds to a readable date + time.
 */
export function formatDateTime(input: number | Date): string {
  const d = typeof input === "number" ? new Date(input * 1000) : input;
  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Format an ISO date string (yyyy-mm-dd) for use in <input type="date">.
 */
export function toDateInputValue(input: number | Date): string {
  const d = typeof input === "number" ? new Date(input * 1000) : input;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}