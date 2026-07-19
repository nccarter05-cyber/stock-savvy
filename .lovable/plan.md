
# Unit of Measure Conversion System

## Goal
Let users track inventory in a single **base unit** while entering/viewing quantities in any unit they want (each, case, pallet, oz, lb, etc.). The app converts on the fly using a per-item pack size — including cross-type conversions like oz ↔ case.

## Model: Per-item base unit + pack definitions

Each inventory item gets:
- `base_unit` — the atomic unit stock is stored in (e.g. `each`, `oz`). Required.
- `pack_units` — a small JSON list of alternate units, each with a factor to the base:
  ```
  [
    { "unit": "case",   "factor": 24 },     // 1 case = 24 each
    { "unit": "pallet", "factor": 240 },    // 1 pallet = 240 each
    { "unit": "oz",     "factor": 0.0625 }  // 1 each = 16 oz  →  1 oz = 1/16 each
  ]
  ```
- `default_display_unit` — what to show by default in lists/reports (e.g. `case`).

`current_quantity`, `inventory_minimum`, `inventory_maximum`, `last_shipment_quantity` all remain stored in **base units**. Any UI that shows or accepts a different unit converts via `factor`.

Cross-type (oz → case) works because both units are defined against the same base. Example: base = `each`, `case.factor = 24`, `oz.factor = 0.0625` → 48 oz = 3 each = 0.125 case.

## Where the unit switcher appears

1. **Add / Edit Item**
   - New fields: Base Unit, Default Display Unit, and a small "Pack Sizes" editor (rows of `unit` + `factor`).
   - Quantity / Min / Max inputs get a unit dropdown next to them; values entered are converted to base before saving.

2. **Inventory list (+/- adjust)**
   - Quantity chip shows in `default_display_unit` (e.g. "12.5 cases"), with the base value in muted text ("300 each").
   - The +/- adjust dialog gets a unit dropdown; entering "+2 cases" writes `+48` to base.

3. **Scan Invoice review**
   - Extracted line item unit is matched against the item's known units. If unknown, user picks the matching pack in a dropdown; the import writes base-unit quantity.

4. **Reports / Order Sheet**
   - "Need to order" is computed in base, then displayed in `default_display_unit` (rounded **up** to whole packs, since you can't order a half case). Both values shown: `Order: 3 cases (72 each)`.

## Database changes (single migration)

Add to `inventory_info`:
- `base_unit text` (nullable for backfill; UI treats missing as legacy `unit`)
- `default_display_unit text`
- `pack_units jsonb NOT NULL DEFAULT '[]'::jsonb`

Backfill: for existing items, set `base_unit = unit` and leave `pack_units` empty. Legacy `unit` column stays for now — treated as base_unit when `base_unit` is null so nothing breaks.

No changes to `inventory_quantity` — it already stores the base numeric value.

## Frontend changes

New shared helper `src/lib/units.ts`:
- `toBase(qty, unit, item)` and `fromBase(qty, unit, item)`
- `formatQty(baseQty, item)` → `"12.5 cases (300 each)"`
- `roundUpToPack(baseQty, unit, item)` for order calculations

New component `src/components/PackUnitsEditor.tsx` (used on Add/Edit Item).

New component `src/components/QuantityInput.tsx` — number input + unit dropdown, returns base value.

Update:
- `src/pages/AddItem.tsx`, `src/pages/EditItem.tsx` — pack editor + unit-aware quantity fields.
- `src/pages/Inventory.tsx` — display quantities via `formatQty`; adjust dialog uses `QuantityInput`.
- `src/pages/ScanInvoice.tsx` — unit dropdown per line, defaults to matched pack.
- `src/pages/Reports.tsx` — order quantity uses `roundUpToPack` and shows both units.
- `src/hooks/useInventory.ts` — pass new fields through; item type gets `base_unit`, `default_display_unit`, `pack_units`.

## Files changed

| File | Change |
|---|---|
| migration SQL | Add 3 columns to `inventory_info`, backfill `base_unit` |
| `src/lib/units.ts` | New — conversion helpers |
| `src/components/PackUnitsEditor.tsx` | New — pack-size rows editor |
| `src/components/QuantityInput.tsx` | New — qty + unit input |
| `src/hooks/useInventory.ts` | Surface new columns |
| `src/pages/AddItem.tsx`, `EditItem.tsx` | Pack editor + unit-aware qty |
| `src/pages/Inventory.tsx` | Display + adjust in chosen unit |
| `src/pages/ScanInvoice.tsx` | Per-line unit matching |
| `src/pages/Reports.tsx` | Order sheet in display unit, rounded up |

## Notes / decisions to confirm implicitly
- Base-unit storage is the source of truth (per your answer). Display is always derived.
- Fractional display is allowed ("12.5 cases"); order sheet rounds **up** to whole packs.
- Legacy items with only the old `unit` field keep working — `unit` acts as base until edited.
