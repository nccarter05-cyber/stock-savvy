DROP POLICY IF EXISTS "Team owners can insert memberships" ON public.team_memberships;

CREATE POLICY "Team owners can insert memberships"
ON public.team_memberships
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_team_owner(auth.uid(), team_id)
  AND role = 'member'
);