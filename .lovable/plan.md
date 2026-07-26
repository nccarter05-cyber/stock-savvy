## Add quantity adjust controls to Low Stock page

Mirror the +/- adjuster from the Inventory page onto each Low Stock card so users can adjust stock without navigating away.

### Changes to `src/pages/LowStock.tsx`
- Pull `updateQuantity` from `useInventory()`.
- Add local state `adjustAmounts: Record<string, number>` with `getAdjustAmount` / `setAdjustAmount` helpers (default 1), same pattern as Inventory.
- In each low-stock card, add a footer row with `[-] [number input] [+]` buttons wired to `updateQuantity({ itemId, delta: ±getAdjustAmount(item.id) })`.
- Import `Button`, `Plus`, `Minus` and reuse existing `Input`.
- Wrap the controls in a container with `onClick={(e) => e.stopPropagation()}` for consistency (cards aren't clickable here, but keeps the pattern safe).

No other files change. The item stays visible in the list until its `current_quantity` rises above `inventory_minimum`, at which point the existing `getLowStockItems` filter naturally removes it on the next render.
