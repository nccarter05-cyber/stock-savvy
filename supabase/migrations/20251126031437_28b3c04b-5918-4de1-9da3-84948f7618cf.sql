-- Recreate inventory_quantity table with user_id at the beginning
-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view their own quantities" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can insert their own quantities" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can update their own quantities" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can delete their own quantities" ON public.inventory_quantity;

-- Create new table with correct column order
CREATE TABLE public.inventory_quantity_new (
  user_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id uuid NOT NULL,
  current_quantity numeric NOT NULL DEFAULT 0,
  inventory_maximum numeric,
  inventory_minimum numeric,
  vendor_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Copy data from old table
INSERT INTO public.inventory_quantity_new 
  (user_id, id, inventory_id, current_quantity, inventory_maximum, inventory_minimum, vendor_id, created_at, updated_at)
SELECT 
  user_id, id, inventory_id, current_quantity, inventory_maximum, inventory_minimum, vendor_id, created_at, updated_at
FROM public.inventory_quantity;

-- Drop old table
DROP TABLE public.inventory_quantity;

-- Rename new table
ALTER TABLE public.inventory_quantity_new RENAME TO inventory_quantity;

-- Enable RLS
ALTER TABLE public.inventory_quantity ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Users can view their own quantities"
ON public.inventory_quantity
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quantities"
ON public.inventory_quantity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quantities"
ON public.inventory_quantity
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quantities"
ON public.inventory_quantity
FOR DELETE
USING (auth.uid() = user_id);