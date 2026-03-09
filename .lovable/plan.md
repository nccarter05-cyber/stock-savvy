

# Fix Add Item: Accept New Vendors & Make Fields Optional

## Problem
1. "Vendor not found" error when adding items -- the vendor creation logic looks correct in the hook, so the error likely comes from the vendor lookup checking team members' vendors too. Need to verify the RLS policies allow inserting new vendors.
2. All form fields are marked `required`, forcing users to fill everything before saving. Only the item name should be required.

## Changes

### 1. `src/pages/AddItem.tsx` -- Make most fields optional
- Remove `required` from all fields except **Item Name**
- Handle empty/missing values gracefully: use `parseFloat() || null` for numeric fields, empty strings become `null`
- Make category and unit Select components optional (allow empty state)

### 2. `src/hooks/useInventory.ts` -- Update mutation types and handle nulls
- Change the `addItemMutation` input type to make all fields optional except `inventory_name`
- Handle empty/null vendor_name by skipping vendor creation
- Pass `null` instead of `NaN` for empty numeric fields
- Same changes for `updateItemMutation`

### 3. `src/pages/BulkAdd.tsx` -- Same optional field treatment
- Remove required validation for non-essential fields in bulk add flow

### Technical Notes
- The vendor creation code in `useInventory.ts` already handles creating new vendors (lines 101-125). The "not found" error may stem from `NaN` values or empty strings being passed. Cleaning up the data before insert should fix this.
- Database columns `category`, `unit`, `cost_per_unit`, `last_shipment_date`, `last_shipment_quantity`, `vendor_id` are all nullable, so this is safe.
- Only `inventory_name` is `NOT NULL` in the schema.

