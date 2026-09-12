/**
 * Format money stored as paisa (integer) into a display string.
 * Example: 125050 → "₨ 1,250.50"
 */
export function formatMoney(paisa: number, opts?: { showDecimals?: boolean }): string {
  const showDecimals = opts?.showDecimals ?? true;
  const rupees = paisa / 100;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Convert a user-entered rupee amount to paisa for storage.
 */
export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paisaToRupees(paisa: number): number {
  return paisa / 100;
}

/**
 * Format an ISO date string or unix seconds to a readable date.
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
 * Format a phone number for display (best-effort, no validation).
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone;
}