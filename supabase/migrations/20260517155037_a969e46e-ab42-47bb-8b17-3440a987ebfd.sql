ALTER TABLE public.inventory_info ADD COLUMN item_number text;
CREATE INDEX IF NOT EXISTS idx_inventory_info_item_number ON public.inventory_info (lower(item_number));