## Goal
Display the Low Stock Items in alphabetical order by item name (`inventory_name`).

## Current State
The `getLowStockItems()` function in `src/hooks/useInventory.ts` filters items that are at or below their minimum stock level, but returns them in whatever order they arrive from the database (effectively unsorted).

## Proposed Change
Update `getLowStockItems()` in `src/hooks/useInventory.ts` to sort the filtered results alphabetically by `inventory_name` using a locale-aware string comparison (`localeCompare`).

## Files Affected
- `src/hooks/useInventory.ts` — one line addition inside `getLowStockItems`

## No side effects
No database changes, no UI layout changes, no other pages affected.