// Unit of Measure conversion system.
//
// Model: every item has a `base_unit` (the atomic unit inventory is stored in),
// and an optional list of `pack_units` describing alternate units and how many
// base units each one contains (e.g. `case` = 24 `each`, `lb` = 16 `oz`).
// Quantities in the database are always stored in base units.

export interface PackUnit {
  unit: string;
  per_base: number; // how many base units make up 1 of this unit
}

export type PackUnitList = PackUnit[];

// Common built-in conversions per base unit family. Used only as suggestions —
// user-defined pack_units always win.
const BUILTINS: Record<string, PackUnit[]> = {
  oz: [
    { unit: 'lb', per_base: 16 },
    { unit: 'oz', per_base: 1 },
  ],
  lb: [
    { unit: 'oz', per_base: 1 / 16 },
    { unit: 'lb', per_base: 1 },
  ],
  each: [{ unit: 'each', per_base: 1 }],
  ml: [
    { unit: 'l', per_base: 1000 },
    { unit: 'ml', per_base: 1 },
  ],
  g: [
    { unit: 'kg', per_base: 1000 },
    { unit: 'g', per_base: 1 },
  ],
};

export function normalizePackUnits(raw: unknown): PackUnitList {
  if (!Array.isArray(raw)) return [];
  const out: PackUnit[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const unit = String((r as any).unit ?? '').trim();
    const per = Number((r as any).per_base);
    if (unit && Number.isFinite(per) && per > 0) {
      out.push({ unit, per_base: per });
    }
  }
  return out;
}

// Look up how many base units are in 1 of `unit` for this item.
export function unitFactor(
  unit: string | null | undefined,
  baseUnit: string | null | undefined,
  packUnits: PackUnitList,
): number | null {
  if (!unit) return null;
  if (!baseUnit || unit === baseUnit) return 1;
  const custom = packUnits.find(p => p.unit === unit);
  if (custom) return custom.per_base;
  const family = BUILTINS[baseUnit];
  if (family) {
    const hit = family.find(p => p.unit === unit);
    if (hit) return hit.per_base;
  }
  return null;
}

// Convert a quantity between two units for the same item.
export function convertQty(
  qty: number,
  fromUnit: string | null | undefined,
  toUnit: string | null | undefined,
  baseUnit: string | null | undefined,
  packUnits: PackUnitList,
): number | null {
  if (!fromUnit || !toUnit) return null;
  if (fromUnit === toUnit) return qty;
  const fromF = unitFactor(fromUnit, baseUnit, packUnits);
  const toF = unitFactor(toUnit, baseUnit, packUnits);
  if (fromF == null || toF == null || toF === 0) return null;
  return (qty * fromF) / toF;
}

// Convert an entered value in `unit` back to base units for storage.
export function toBase(
  qty: number,
  unit: string | null | undefined,
  baseUnit: string | null | undefined,
  packUnits: PackUnitList,
): number {
  if (!unit || !baseUnit || unit === baseUnit) return qty;
  const f = unitFactor(unit, baseUnit, packUnits);
  return f == null ? qty : qty * f;
}

// Format a base-unit quantity for display in the preferred display unit.
export function formatQty(
  baseQty: number,
  baseUnit: string | null | undefined,
  displayUnit: string | null | undefined,
  packUnits: PackUnitList,
  opts: { digits?: number } = {},
): string {
  const digits = opts.digits ?? 2;
  const unit = displayUnit || baseUnit || '';
  if (!baseUnit || !displayUnit || displayUnit === baseUnit) {
    return `${round(baseQty, digits)}${unit ? ` ${unit}` : ''}`;
  }
  const f = unitFactor(displayUnit, baseUnit, packUnits);
  if (f == null || f === 0) {
    return `${round(baseQty, digits)}${baseUnit ? ` ${baseUnit}` : ''}`;
  }
  return `${round(baseQty / f, digits)} ${displayUnit}`;
}

function round(n: number, digits: number) {
  const m = Math.pow(10, digits);
  return Math.round(n * m) / m;
}

// Round `baseQty` up to the next whole `displayUnit` — used by the order
// report so we order full cases rather than fractional ones.
export function ceilToUnit(
  baseQty: number,
  baseUnit: string | null | undefined,
  displayUnit: string | null | undefined,
  packUnits: PackUnitList,
): { qty: number; unit: string } {
  const unit = displayUnit || baseUnit || '';
  if (!baseUnit || !displayUnit || displayUnit === baseUnit) {
    return { qty: Math.ceil(baseQty), unit };
  }
  const f = unitFactor(displayUnit, baseUnit, packUnits);
  if (f == null || f === 0) return { qty: Math.ceil(baseQty), unit: baseUnit };
  return { qty: Math.ceil(baseQty / f), unit: displayUnit };
}

// Options presented in the display-unit dropdown for an item.
export function unitOptions(
  baseUnit: string | null | undefined,
  packUnits: PackUnitList,
): string[] {
  const set = new Set<string>();
  if (baseUnit) set.add(baseUnit);
  for (const p of packUnits) set.add(p.unit);
  if (baseUnit && BUILTINS[baseUnit]) {
    for (const p of BUILTINS[baseUnit]) set.add(p.unit);
  }
  return Array.from(set);
}
