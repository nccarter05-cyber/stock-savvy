# Vendor Dropdown on Add New Item

## Goal
On the "Add New Item" screen, replace the free-text "Supplier" input with a dropdown of the team's existing vendors. The selected vendor must persist to the new inventory item and appear in the "Supplier" column on the Inventory page.

## Changes

### 1. New hook: `src/hooks/useVendors.ts`
- Query `vendor_info` (RLS already returns the team's vendors).
- Returns `{ vendors, isLoading }` with `{ id, vendor_name }`.
- Cached under queryKey `['vendors']`.

### 2. `src/pages/AddItem.tsx`
- Add `vendorId` state.
- Replace the Supplier `<Input>` with a shadcn `<Select>` populated from `useVendors()`:
  - Placeholder: "Select supplier".
  - Options: each vendor's `vendor_name` (value = `vendor.id`).
  - Include a "+ Add new vendor" option at the bottom that reveals the existing text input as a fallback (so users can still create a new vendor inline, preserving current behavior).
- On submit:
  - If a vendor was picked from the list, pass `vendor_id` directly to `addItem`.
  - If the "new vendor" text was used, keep passing `vendor_name` (current create-on-the-fly path).

### 3. `src/hooks/useInventory.ts` — `addItemMutation`
- Accept an optional `vendor_id` field on `newItem`.
- If `vendor_id` is provided, skip the lookup/create branch and use it directly when inserting into `inventory_info` and `inventory_quantity`.
- Keep the existing `vendor_name` create-on-the-fly path untouched for the fallback case.
- Invalidate `['vendors']` after a new vendor is created so the dropdown stays fresh.

### 4. Inventory list (`src/pages/Inventory.tsx`)
- No structural changes required — the "Supplier" column already renders `item.vendor_name`, which is resolved via the `vendor_id` join in `useInventory`. Verify it displays the picked vendor after add.

## Out of scope
- Edit Item page (can be a follow-up; this request is about Add New Item).
- Renaming the "Supplier" label to "Vendor" (kept for consistency with the rest of the app unless you want it changed).
- Schema changes — `inventory_info.vendor_id` already exists and is nullable.

## Technical notes
- The dropdown uses `vendor.id` as the option value, so we send the real `vendor_id` to the database without exposing the UUID to the user.
- RLS on `vendor_info` already restricts the list to the user's team, so no extra filtering is needed.
