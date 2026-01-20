-- Add restrictive policies to prevent direct modifications to user_roles
-- The handle_new_user() trigger runs as SECURITY DEFINER so it bypasses RLS

-- Prevent all direct inserts (only allow via SECURITY DEFINER trigger)
CREATE POLICY "No direct inserts"
ON public.user_roles FOR INSERT
WITH CHECK (false);

-- Prevent all direct updates
CREATE POLICY "No direct updates"
ON public.user_roles FOR UPDATE
USING (false);

-- Prevent all direct deletes
CREATE POLICY "No direct deletes"
ON public.user_roles FOR DELETE
USING (false);