## Fix

Tighten the `Team owners can insert memberships` policy on `public.team_memberships` so owners can only add members with a non-owner role.

### Migration

```sql
DROP POLICY "Team owners can insert memberships" ON public.team_memberships;

CREATE POLICY "Team owners can insert memberships"
ON public.team_memberships
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_team_owner(auth.uid(), team_id)
  AND role = 'member'
);
```

### Why

- Prior policy only checked `is_team_owner(...)` with no restriction on `role`, so an owner could insert `role='owner'` for anyone.
- Restricting to `role = 'member'` blocks privilege escalation while preserving the normal flow (owners approve join requests → insert as members).
- Ownership is still bootstrapped safely via the existing `signup_join_or_create_team` SECURITY DEFINER function (creates the initial `owner` row for the team creator) — this policy change doesn't affect that path.
- Scoping to `TO authenticated` also aligns with the least-privilege warning flagged elsewhere.

### Out of scope

Other findings in the panel (admin route gate, password policy, team enumeration, vendor policy scope, profiles direct query, etc.) — not touched unless you ask.
