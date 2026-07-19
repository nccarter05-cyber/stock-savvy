
ALTER TABLE public.inventory_info
  ADD COLUMN IF NOT EXISTS base_unit text,
  ADD COLUMN IF NOT EXISTS default_display_unit text,
  ADD COLUMN IF NOT EXISTS pack_units jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.inventory_info
  SET base_unit = unit
  WHERE base_unit IS NULL AND unit IS NOT NULL;
