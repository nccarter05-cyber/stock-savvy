-- Add missing fields to inventory_info table to match current UI
alter table public.inventory_info
  add column category text,
  add column unit text,
  add column cost_per_unit numeric,
  add column last_shipment_date date,
  add column last_shipment_quantity numeric;

-- Create index on category for filtering
create index idx_inventory_info_category on public.inventory_info(category);