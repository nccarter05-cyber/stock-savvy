

# Make All Fields Optional on Edit Item Page

## Problem
The Edit Item form has `required` on every field, preventing saves when fields are left blank. The Add Item page already handles optional fields correctly with `isNaN` checks and fallbacks to `null`.

## Changes

### 1. `src/pages/EditItem.tsx`
- Remove the `required` attribute from all fields **except** Item Name
- Update `handleSubmit` to handle empty/NaN values gracefully (matching the AddItem pattern):
  - `parseFloat` results that are `NaN` become `null` (for cost, quantities, par level, low stock)
  - Empty strings become `null` (for category, unit, supplier, shipment date)
  - `current_quantity` defaults to `0` when empty

Fields affected: category select, quantity, unit select, par level, low stock alert, cost per unit, supplier, last shipment date, qty received.

No database changes needed — all columns except `inventory_name` are already nullable.

