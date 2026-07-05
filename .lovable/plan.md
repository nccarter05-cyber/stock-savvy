## Bulk Edit on Inventory Page

Add multi-select and a bulk edit dialog to `/inventory` so several items can be updated at once.

### Selection UX
- Add a leading checkbox column on the desktop table and a checkbox on each mobile card (always visible).
- Header row / top of mobile list: a "Select all" checkbox that toggles all currently `filteredItems`.
- When 1+ items are selected, a sticky action bar appears at the bottom of the page above the nav with:
  - "N selected" text
  - "Bulk edit" button (opens dialog)
  - "Clear selection" button

### Bulk Edit Dialog
A single dialog with one field per attribute. Each field has a "Change this field" checkbox next to it — only checked fields are applied. This keeps the "set same value for all" model while letting the user edit one or many fields in one pass.

Editable fields:
- Item # (text)
- Category (text with datalist of existing categories)
- Quantity (number, sets current_quantity)
- Unit (text)
- Min Level (number)
- Max Level (number)
- Cost/Unit (number)
- Last Shipment (date)
- Quantity Received (number, writes to last_shipment_quantity)
- Supplier (text with datalist of existing vendors; missing vendor auto-created, matching existing add/edit behavior)

Buttons: Cancel, Apply to N items. On apply, show a confirmation toast with count updated / count failed.

Note on Item #: setting the same Item # on multiple rows is allowed at the schema level today; we'll warn in the dialog ("Item # is usually unique — this will set the same value on all selected items") but still permit it.

### Data / Hook Changes
Add a `bulkUpdateItems` mutation in `src/hooks/useInventory.ts`:
- Input: `{ ids: string[], changes: Partial<{ item_number, category, unit, cost_per_unit, last_shipment_date, last_shipment_quantity, vendor_name, current_quantity, inventory_minimum, inventory_maximum }> }`.
- Resolve `vendor_name` → `vendor_id` once (lookup or create), same logic as `updateItemMutation`.
- Split changes into `inventory_info` fields and `inventory_quantity` fields.
- Issue two Supabase updates using `.in('id', ids)` / `.in('inventory_id', ids)` scoped by the current team (RLS already enforces team scope).
- Invalidate the `inventory` and `vendors` query keys and toast success.

### Files
- `src/pages/Inventory.tsx` — checkboxes, select-all, sticky action bar, dialog trigger, bulk edit dialog component (kept inline or in a new `src/components/BulkEditDialog.tsx` if it grows past ~150 lines).
- `src/hooks/useInventory.ts` — add `bulkUpdateItems` mutation and expose it.

### Out of Scope
- Bulk delete (already possible per-item; can be added later if wanted).
- Per-item different values in one pass (rejected model).
