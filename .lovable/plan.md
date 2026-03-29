

# Fix: Privilege Escalation on team_memberships

## Problem
The RLS policy "Users can insert own membership" only checks `auth.uid() = user_id`, allowing any authenticated user to add themselves to any team with any role (including 'owner'), bypassing the join request workflow entirely.

## Root Cause
Three code paths insert into `team_memberships`:
1. **Signup** (Login.tsx) — user creates a team and adds themselves as owner
2. **Create team** (useTeam.ts) — same as above
3. **Approve request** (useTeam.ts) — team owner adds a new member after approving a join request

Paths 1 and 2 are already covered by "Team owners can insert memberships" (since the user just created the team and is the owner). Path 3 is also covered by that same policy. The "Users can insert own membership" policy is redundant and dangerous.

## Plan

### 1. Database migration (single SQL statement)
- **Drop** the policy `"Users can insert own membership"` on `team_memberships`
- No replacement needed — the existing "Team owners can insert memberships" and "Admins can insert memberships" policies cover all legitimate use cases

```sql
DROP POLICY "Users can insert own membership" ON public.team_memberships;
```

### 2. No code changes required
All three insert paths already work through the team-owner or admin policies. No frontend changes needed.

## Files Changed
| File | Change |
|------|--------|
| New migration SQL | Drop the one policy |

