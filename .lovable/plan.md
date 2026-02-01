

# CSV Inventory Upload Feature

## Overview

This feature will add a new page for uploading inventory data via CSV spreadsheet. The system will parse the CSV, match email addresses to user IDs, match vendor names to vendor IDs, and insert/update records in the inventory tables.

## How It Works

1. You upload a CSV file with your inventory data
2. The system shows you a preview of the data and validates each row
3. Any issues (like unknown vendors or emails) are highlighted for you to review
4. You confirm the import and the data is saved to your inventory

## Expected CSV Format

The spreadsheet should include these columns:

| Column | Required | Description |
|--------|----------|-------------|
| inventory_name | Yes | Name of the inventory item |
| vendor_name | Yes | Must match an existing vendor in the system |
| current_quantity | Yes | Current stock quantity |
| inventory_maximum | No | Par level / maximum stock |
| inventory_minimum | No | Low stock alert threshold |
| email | No | If provided, matches to a team member. If omitted, uses your account |

## Features

- **File Upload**: Drag-and-drop or click to select CSV file
- **Data Preview**: See all rows before importing
- **Validation**: Highlights rows with issues (unknown vendors, invalid data)
- **Vendor Matching**: Automatically finds vendor IDs from names
- **User Matching**: Matches email addresses to team members (if provided)
- **Progress Feedback**: Shows success/failure count after import

## Important Notes

- If an email is provided in the CSV, the system will look up the corresponding team member
- Due to security rules, you can only import data for your own account (the email column is used for reference/validation only)
- Vendor names must exactly match existing vendors in your system
- Inventory items that don't exist will be created automatically

---

## Technical Details

### Files to Create/Modify

1. **New Page: `src/pages/CSVUpload.tsx`**
   - File input with drag-and-drop support
   - CSV parsing using native JavaScript (FileReader + split)
   - Preview table showing parsed data
   - Validation status for each row
   - Import button with confirmation

2. **New Hook: `src/hooks/useCSVUpload.ts`**
   - Functions to lookup user_id from email via profiles table
   - Functions to lookup vendor_id from vendor_name
   - Functions to lookup or create inventory_info records
   - Batch insert logic for inventory_quantity

3. **Update: `src/App.tsx`**
   - Add new route `/csv-upload`

4. **Update: `src/components/Layout.tsx`**
   - Add navigation item for CSV Upload page

### Database Interactions

```text
+----------------+     +------------------+     +--------------------+
|  CSV Upload    | --> |   Lookup/Match   | --> |   Insert Records   |
+----------------+     +------------------+     +--------------------+
        |                     |                         |
        v                     v                         v
   Parse rows          profiles table            inventory_info
   Validate data       vendor_info table         inventory_quantity
   Show preview        inventory_info table
```

### RLS Policy Compliance

The current RLS policies allow:
- Users can INSERT into `inventory_info` and `inventory_quantity` when `auth.uid() = user_id`
- This means the uploaded data will be inserted under the logged-in user's account
- The email column in CSV can be used for validation/reference but inserts will use the current user's ID

### Validation Logic

1. **Vendor Matching**: Query `vendor_info` for exact match on `vendor_name` (within the user's accessible vendors)
2. **Inventory Matching**: Check if `inventory_name` already exists to update vs. create
3. **Data Validation**: Ensure quantities are valid numbers

