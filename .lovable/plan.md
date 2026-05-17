
# Scan Invoice → Inventory

A new bottom-nav page that lets a team member photograph (or upload) an invoice/packing slip/receipt, runs AI vision on it, then shows a CSV-style review table where the user confirms each line before importing into inventory.

## User flow

1. Tap **Scan Invoice** in the bottom nav → `/scan-invoice`.
2. Capture stage:
   - Take photo with device camera, **or** pick from photo library, **or** add multiple pages.
   - Thumbnails show captured pages; user can remove/retake any page.
   - Tap **Extract** → spinner while AI processes.
3. Review stage (mirrors CSV upload UI):
   - Table of extracted line items with editable cells: Vendor, Item Number, Item Name, Quantity, Unit, Unit Price, Invoice Date.
   - Each row shows match status:
     - ✅ **Matched** (green): matched to existing inventory by item_number, then by name.
     - ⚠️ **Unmatched** (amber): row highlighted. User picks per row: **Match existing item** (dropdown) **or** **Create new item**.
   - Vendor column: dropdown of existing vendors (same component used on Add Item) with "+ Add new vendor" fallback. AI-suggested vendor is auto-selected if a match is found.
   - User can delete rows or edit any cell.
4. Tap **Import N items**:
   - For matched rows: **add** the scanned qty to `current_quantity`, update `last_shipment_date` and `last_shipment_quantity`, refresh `cost_per_unit` if provided.
   - For "create new" rows: insert into `inventory_info` + `inventory_quantity` (qty as starting stock).
   - Auto-create any new vendors.
   - Toast success/failure counts and route back to Inventory.

## Schema change

Add one column:
- `inventory_info.item_number` — `text`, nullable, indexed for lookup.

No other tables need changes. (Add Item / Edit Item / CSV forms will pick up the new optional field in a follow-up; not in scope for this page.)

## Files to add / change

**New**
- `supabase/functions/scan-invoice/index.ts` — Edge function. Accepts `{ images: string[] }` (base64 data URLs). Calls Lovable AI Gateway (`google/gemini-2.5-pro`) with vision + structured JSON output schema:
  ```
  { vendor_name, invoice_date, line_items: [
      { item_number, item_name, quantity, unit, unit_price }
  ] }
  ```
  Returns parsed JSON. Validates with Zod. CORS + JWT-verified.
- `src/pages/ScanInvoice.tsx` — Two-stage page (capture → review). Reuses Card/Table/Select/Button shadcn primitives.
- `src/hooks/useScanInvoice.ts` — Wraps capture state, calls the edge function via `supabase.functions.invoke`, holds extracted rows, runs client-side matching against existing inventory + vendors, and performs the import (mirrors `useCSVUpload` patterns).
- `src/components/InvoiceCameraCapture.tsx` — Camera capture component using `<input type="file" accept="image/*" capture="environment" multiple>` for max iOS/Android compatibility, plus a separate "Choose from library" button (no `capture` attr).

**Edited**
- `src/App.tsx` — Add `/scan-invoice` protected route.
- `src/components/Layout.tsx` — Add bottom-nav item "Scan" (camera icon) pointing to `/scan-invoice`.
- `src/integrations/supabase/types.ts` — auto-regenerated after migration.

## Matching logic (client-side, in useScanInvoice)

For each extracted line item:
1. Load full inventory list once (id, inventory_name, item_number, vendor_id).
2. Match priority:
   a. Exact `item_number` (case-insensitive).
   b. Exact `inventory_name` (case-insensitive, trimmed).
   c. Fuzzy name match (simple includes) → still flagged as unmatched, suggestion preselected in dropdown.
3. Vendor: exact case-insensitive name match against team's `vendor_info`.

## Technical details

- **AI model**: `google/gemini-2.5-pro` via Lovable AI Gateway (multimodal). System prompt instructs the model to return ONLY the JSON schema, with empty strings for unreadable fields. Use AI SDK `generateText` + `Output.object` with a Zod schema; multipage support by sending all images as content parts in one request.
- **LOVABLE_API_KEY** is already provisioned (Lovable Cloud). No user secret needed.
- **Image handling**: client converts each File → base64 data URL (resized to max 1600px long edge via canvas to keep payload small and improve OCR speed).
- **Edge function config**: default `verify_jwt = true`; no special `config.toml` block needed.
- **Mobile-first**: capture buttons full-width, review table is a stacked card list on mobile (matches existing patterns), bottom nav remains visible.
- **Error states**: 429 → "AI is busy, try again"; 402 → "AI credits exhausted — check usage"; parse failures → keep raw text in a collapsible debug panel and let user retry or skip.
- **Import**: reuses the same insert paths as `useCSVUpload` and `useInventory.addItemMutation`, scoped by `auth.uid()` so RLS allows it.

## Out of scope (future)

- Persisting the original invoice image to storage for audit.
- Editing item_number on Add Item / Edit Item pages (will follow once column exists).
- PDF invoice ingestion (only images for v1).
- Auto-import without review.
