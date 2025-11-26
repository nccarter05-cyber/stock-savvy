-- Add foreign key constraint to link inventory_quantity back to inventory_info
ALTER TABLE public.inventory_quantity
ADD CONSTRAINT inventory_quantity_inventory_id_fkey 
FOREIGN KEY (inventory_id) 
REFERENCES public.inventory_info(id) 
ON DELETE CASCADE;