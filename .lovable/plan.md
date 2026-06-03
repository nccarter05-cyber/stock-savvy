## Add Item Number to Inventory page

Display the user-defined `item_number` (SKU) field from `inventory_info` as the first column on the Inventory page.

### Changes

1. **`src/hooks/useInventory.ts`**
   - Add `item_number: string | null` to the `InventoryItemWithQuantity` interface.
   - Include `item_number` in the `inventory_info` select and the transformed result.

2. **`src/pages/Inventory.tsx`**
   - Desktop table: add a new `Item #` `<TableHead>` as the first column and a corresponding `<TableCell>` rendering `item.item_number || '-'`.
   - Mobile card: show `Item #: {item.item_number}` as a small muted line above the item name (only when present), so the SKU is visible without crowding the layout.

No database, hook logic, or other pages are touched.
