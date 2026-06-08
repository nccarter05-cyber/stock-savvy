## Add Reports page with Order Sheet generator

Create a new Reports page accessible from the main navigation. It contains a "Generate Order Report" button that renders an Order Sheet directly on the same page, formatted for clean printing / Save-as-PDF.

### Scope
- Only items where `current_quantity < inventory_minimum` (and `inventory_minimum` is set) appear.
- Need to Order = `inventory_minimum - current_quantity`.
- Items are grouped by vendor.

### New route
- `/reports` → `src/pages/Reports.tsx`
- Registered in `src/App.tsx` as a protected route.
- Added to the bottom nav / layout (`src/components/Layout.tsx`) with an appropriate icon (e.g. `FileText`).

### Page layout

**Header (hidden when printing):**
- Title: "Reports"
- Subtitle: "Generate an order report based on current stock levels."
- Button: **Generate Order Report**
- After generation: **Print / Save as PDF** and **Export CSV** buttons.

**Report body (the Order Sheet — visible on screen and on print):**
- Report title: "Order Sheet"
- Generated date (e.g. "Generated: Jun 8, 2026")
- Optional team / restaurant name from profile
- One section per vendor, ordered alphabetically. Items without a vendor go under "No Vendor".
- Each vendor section is a table with columns:
  1. Item # (item_number, or `-`)
  2. Item Name
  3. Current Qty
  4. Minimum
  5. **Need to Order** (bold)
- Section subtotal: total units to order for that vendor.
- Grand total at the bottom: total units to order across all vendors.
- Empty state when no items need ordering: "All stock levels are at or above their minimums. Nothing to order."

### Data source
Reuse `useInventory()` — already returns `item_number`, `inventory_name`, `current_quantity`, `inventory_minimum`, `vendor_name`. No new hook or query needed. Filtering and vendor grouping happen in the page component.

### Print / PDF readiness
- Use the browser's native print (`window.print()`); user picks "Save as PDF" in the print dialog.
- Add print-specific CSS in `src/index.css` under a `@media print` block:
  - Hide nav, header buttons, and bottom nav (`.no-print` utility class).
  - White background, black text, remove shadows.
  - Avoid page-breaks inside vendor tables (`break-inside: avoid`).
  - Letter-size margins.
- Wrap the report content in a `.print-area` container so the layout is clean on paper.

### CSV export
- Single CSV with columns: Vendor, Item #, Item Name, Current Qty, Minimum, Need to Order.
- One row per item; rows ordered by vendor then name.
- Filename: `order-sheet-YYYY-MM-DD.csv`.
- Implemented inline in the page (no new dependency) via a `Blob` + download link.

### Files touched
1. `src/pages/Reports.tsx` — new page (UI, grouping, print, CSV).
2. `src/App.tsx` — add `/reports` protected route.
3. `src/components/Layout.tsx` — add Reports link to navigation.
4. `src/index.css` — add `@media print` rules and `.no-print` / `.print-area` helpers.

No database, hook, or schema changes.
