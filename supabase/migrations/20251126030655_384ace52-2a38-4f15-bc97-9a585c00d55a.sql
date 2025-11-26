-- Add user_id column to inventory_quantity table
ALTER TABLE public.inventory_quantity
ADD COLUMN user_id uuid;

-- Populate user_id from inventory_info for existing records
UPDATE public.inventory_quantity
SET user_id = inventory_info.user_id
FROM public.inventory_info
WHERE inventory_quantity.inventory_id = inventory_info.id;

-- Make user_id NOT NULL after populating
ALTER TABLE public.inventory_quantity
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing RLS policies on inventory_quantity
DROP POLICY IF EXISTS "Users can view quantities for their inventory" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can insert quantities for their inventory" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can update quantities for their inventory" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can delete quantities for their inventory" ON public.inventory_quantity;

-- Create simplified RLS policies using direct user_id
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