## Plan: Add Search to Inventory Tab

Add a search/filter input to the Inventory page that filters items by Item #, Name, or Category in real time.

### Changes

**`src/pages/Inventory.tsx`**
- Add a `searchQuery` state (`useState('')`).
- Add a `<Input type="search" placeholder="Search by Item #, Name or Category..." />` between the page header and the item list.
- Compute `filteredItems` by applying a case-insensitive match against `item_number`, `inventory_name`, and `category`.
- Render `filteredItems` instead of `items` in both the mobile card layout and the desktop table layout.
- When `filteredItems.length === 0` (and search is active), show a "No matching items" message instead of the empty-inventory state.

### Behavior
- Search is real-time, client-side filtering.
- Matching is case-insensitive and partial (substring).
- Empty search shows all items.
- Works on both mobile (cards) and desktop (table) views.

No database or hook changes required — the `items` array already contains all needed fields.