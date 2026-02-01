
# Edit Inventory Item Feature

## Overview

This feature will allow you to click on any inventory item (in both mobile and desktop views) to open an edit page where you can modify all item properties. Changes will save directly to the database.

## How It Works

1. Click on any inventory item row (desktop) or card (mobile)
2. You'll be taken to an edit page that looks similar to the Add Item page
3. The form will be pre-filled with the item's current values
4. Make your changes and click "Save" to update the database
5. You'll be redirected back to the inventory list

## Features

- **Clickable Items**: Rows in the table and cards on mobile become clickable
- **Pre-filled Form**: All current values load automatically
- **Full Editing**: Edit name, category, unit, cost, quantity levels, supplier, and shipment info
- **Database Sync**: Updates both `inventory_info` and `inventory_quantity` tables
- **Cancel Option**: Return to inventory without saving changes

---

## Technical Details

### Files to Create

**1. New Page: `src/pages/EditItem.tsx`**
- Reuses the same form layout as AddItem.tsx
- Fetches item data by ID from URL parameter
- Pre-populates all form fields with existing values
- Calls new `updateItem` mutation on submit

### Files to Modify

**2. Update Hook: `src/hooks/useInventory.ts`**
- Add new `updateItemMutation` function
- Updates `inventory_info` table (name, category, unit, cost, shipment info, vendor)
- Updates `inventory_quantity` table (current_quantity, min, max)
- Handles vendor lookup/creation (same logic as addItem)
- Add `getItemById` function to fetch single item details

**3. Update Routes: `src/App.tsx`**
- Add new route: `/edit-item/:id`
- Route parameter `:id` captures the inventory item ID

**4. Update Inventory Page: `src/pages/Inventory.tsx`**
- Make table rows clickable with `onClick={() => navigate(`/edit-item/${item.id}`)}`
- Make mobile cards clickable (excluding the delete button and quantity controls)
- Add visual hover states to indicate clickability
- Add an Edit button/icon as alternative to clicking the row

### Database Operations

The update will modify two tables:

| Table | Fields Updated |
|-------|----------------|
| inventory_info | inventory_name, category, unit, cost_per_unit, last_shipment_date, last_shipment_quantity, vendor_id |
| inventory_quantity | current_quantity, inventory_maximum, inventory_minimum |

### User Flow Diagram

```
Inventory List --> Click Item --> Edit Page --> Save --> Back to List
       |                              |
       v                              v
  (shows all items)          (pre-filled form)
```
