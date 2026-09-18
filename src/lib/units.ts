export type UnitOption = {
  /** The unit to display in the dropdown */
  unitId: number;
  unitName: string;
  unitShortName: string;
  /** How many base units in 1 of this unit */
  factor: number;
  /** "base" or "purchase" */
  kind: "base" | "purchase";
};

/**
 * Given a variant, produce the list of units the user can enter in.
 *
 * Always includes the base unit (factor = 1).
 * Includes the purchase unit (factor = purchaseUnitFactor) if set.
 */
export function getUnitOptions(variant: {
  baseUnitId: number;
  baseUnitName: string;
  baseUnitShortName: string;
  purchaseUnitId: number | null;
  purchaseUnitName: string | null;
  purchaseUnitShortName: string | null;
  purchaseUnitFactor: number | null;
}): UnitOption[] {
  const options: UnitOption[] = [
    {
      unitId: variant.baseUnitId,
      unitName: variant.baseUnitName,
      unitShortName: variant.baseUnitShortName,
      factor: 1,
      kind: "base",
    },
  ];

  if (
    variant.purchaseUnitId &&
    variant.purchaseUnitName &&
    variant.purchaseUnitShortName &&
    variant.purchaseUnitFactor &&
    variant.purchaseUnitFactor > 1
  ) {
    options.push({
      unitId: variant.purchaseUnitId,
      unitName: variant.purchaseUnitName,
      unitShortName: variant.purchaseUnitShortName,
      factor: variant.purchaseUnitFactor,
      kind: "purchase",
    });
  }

  return options;
}

/**
 * Convert a quantity entered in the given unit to base units.
 *
 * Example:
 *   qty = 10, factor = 24 → 240 (pieces)
 */
export function enteredQtyToBase(qty: number, factor: number): number {
  return qty * factor;
}

/**
 * Convert a price entered in the given unit to per-base-unit price.
 *
 * Example:
 *   pricePerCarton = 1200 (Rs), factor = 24 → 50 (Rs per piece)
 *
 * Result is rounded to avoid fractional paisa.
 */
export function enteredPriceToBase(pricePerUnit: number, factor: number): number {
  return pricePerUnit / factor;
}

/**
 * Compute the line total in the entered unit.
 * Straightforward — user expects qty × price.
 */
export function lineTotalInEnteredUnit(
  qty: number,
  pricePerUnit: number
): number {
  return qty * pricePerUnit;
}

/**
 * Compute the implied per-base-unit price from an entered line.
 * Used for display when the user picks a non-base unit.
 */
export function baseUnitPriceFromEntered(
  qty: number,
  pricePerUnit: number,
  factor: number
): number {
  const baseQty = qty * factor;
  if (baseQty === 0) return 0;
  return (qty * pricePerUnit) / baseQty;
}

/**
 * Get the default unit for a purchase line — prefers the purchase unit.
 */
export function defaultPurchaseUnit(variant: {
  baseUnitId: number;
  purchaseUnitId: number | null;
}): number {
  return variant.purchaseUnitId ?? variant.baseUnitId;
}

/**
 * Get the default unit for a bill line — prefers the base unit.
 */
export function defaultBillUnit(variant: {
  baseUnitId: number;
}): number {
  return variant.baseUnitId;
}
