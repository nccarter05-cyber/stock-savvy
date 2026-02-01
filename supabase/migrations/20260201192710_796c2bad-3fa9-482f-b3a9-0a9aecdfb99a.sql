-- Add UPDATE policy for team_memberships that only allows administrators
CREATE POLICY "Only admins can update memberships"
ON public.team_memberships
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));