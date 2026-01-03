-- Add inventory_db_name to profiles table
ALTER TABLE public.profiles ADD COLUMN inventory_db_name text;

-- Update RLS policies for inventory_info to allow shared access by inventory_db_name
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.inventory_info;
DROP POLICY IF EXISTS "Users can insert their own inventory" ON public.inventory_info;
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory_info;
DROP POLICY IF EXISTS "Users can delete their own inventory" ON public.inventory_info;

CREATE POLICY "Users can view shared inventory" 
ON public.inventory_info 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    JOIN public.profiles p2 ON p1.inventory_db_name = p2.inventory_db_name
    WHERE p1.id = auth.uid() 
    AND p2.id = inventory_info.user_id
    AND p1.inventory_db_name IS NOT NULL
  )
);

CREATE POLICY "Users can insert shared inventory" 
ON public.inventory_info 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update shared inventory" 
ON public.inventory_info 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    JOIN public.profiles p2 ON p1.inventory_db_name = p2.inventory_db_name
    WHERE p1.id = auth.uid() 
    AND p2.id = inventory_info.user_id
    AND p1.inventory_db_name IS NOT NULL
  )
);

CREATE POLICY "Users can delete shared inventory" 
ON public.inventory_info 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    JOIN public.profiles p2 ON p1.inventory_db_name = p2.inventory_db_name
    WHERE p1.id = auth.uid() 
    AND p2.id = inventory_info.user_id
    AND p1.inventory_db_name IS NOT NULL
  )
);

-- Update RLS policies for inventory_quantity to allow shared access
DROP POLICY IF EXISTS "Users can view their own quantities" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can insert their own quantities" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can update their own quantities" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can delete their own quantities" ON public.inventory_quantity;

CREATE POLICY "Users can view shared quantities" 
ON public.inventory_quantity 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    JOIN public.profiles p2 ON p1.inventory_db_name = p2.inventory_db_name
    WHERE p1.id = auth.uid() 
    AND p2.id = inventory_quantity.user_id
    AND p1.inventory_db_name IS NOT NULL
  )
);

CREATE POLICY "Users can insert shared quantities" 
ON public.inventory_quantity 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update shared quantities" 
ON public.inventory_quantity 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    JOIN public.profiles p2 ON p1.inventory_db_name = p2.inventory_db_name
    WHERE p1.id = auth.uid() 
    AND p2.id = inventory_quantity.user_id
    AND p1.inventory_db_name IS NOT NULL
  )
);

CREATE POLICY "Users can delete shared quantities" 
ON public.inventory_quantity 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    JOIN public.profiles p2 ON p1.inventory_db_name = p2.inventory_db_name
    WHERE p1.id = auth.uid() 
    AND p2.id = inventory_quantity.user_id
    AND p1.inventory_db_name IS NOT NULL
  )
);

-- Update RLS policies for vendor_info to allow shared access
DROP POLICY IF EXISTS "Users can view their own vendors" ON public.vendor_info;
DROP POLICY IF EXISTS "Users can insert their own vendors" ON public.vendor_info;
DROP POLICY IF EXISTS "Users can update their own vendors" ON public.vendor_info;
DROP POLICY IF EXISTS "Users can delete their own vendors" ON public.vendor_info;

CREATE POLICY "Users can view shared vendors" 
ON public.vendor_info 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    JOIN public.profiles p2 ON p1.inventory_db_name = p2.inventory_db_name
    WHERE p1.id = auth.uid() 
    AND p2.id = vendor_info.user_id
    AND p1.inventory_db_name IS NOT NULL
  )
);

CREATE POLICY "Users can insert shared vendors" 
ON public.vendor_info 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update shared vendors" 
ON public.vendor_info 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    JOIN public.profiles p2 ON p1.inventory_db_name = p2.inventory_db_name
    WHERE p1.id = auth.uid() 
    AND p2.id = vendor_info.user_id
    AND p1.inventory_db_name IS NOT NULL
  )
);

CREATE POLICY "Users can delete shared vendors" 
ON public.vendor_info 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    JOIN public.profiles p2 ON p1.inventory_db_name = p2.inventory_db_name
    WHERE p1.id = auth.uid() 
    AND p2.id = vendor_info.user_id
    AND p1.inventory_db_name IS NOT NULL
  )
);

-- Update handle_new_user function to include inventory_db_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
begin
  insert into public.profiles (id, email, restaurant_name, inventory_db_name)
  values (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'restaurant_name',
    new.raw_user_meta_data->>'inventory_db_name'
  );
  
  insert into public.user_roles (user_id, role)
  values (new.id, 'staff');
  
  return new;
end;
$$;