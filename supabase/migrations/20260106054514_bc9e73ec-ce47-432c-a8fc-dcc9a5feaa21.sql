-- Allow authenticated users to create teams (as owner)
CREATE POLICY "Users can create teams" ON public.inventory_teams
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);