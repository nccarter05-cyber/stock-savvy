## Fix: Team Name Enumeration

The two SECURITY DEFINER functions `team_name_exists()` and `get_team_id_by_name()` let any signed-in user probe whether arbitrary team names exist. The signup flow in `Login.tsx` uses `get_team_id_by_name` to decide whether to create a team or send a join request — we can replace this pre-check with an atomic "try insert, handle conflict" pattern so the lookup functions are no longer needed on the client.

### Approach

Move the create-or-join decision into a single SECURITY DEFINER RPC that runs server-side during signup. The client never learns whether a name existed before it tried — it only learns the outcome for its own request.

### Steps

1. **New migration**
   - Create `public.signup_join_or_create_team(_db_name text)` (SECURITY DEFINER, `auth.uid()` scoped):
     - Looks up team by `inventory_db_name`.
     - If found → insert into `join_requests` (ignore duplicates), return `{ action: 'join_requested' }`.
     - If not found → insert into `inventory_teams` + `team_memberships` (owner), return `{ action: 'team_created' }`.
     - Handles unique-violation race by retrying the join branch.
   - `GRANT EXECUTE ... TO authenticated`.
   - `DROP FUNCTION public.team_name_exists(text);`
   - `DROP FUNCTION public.get_team_id_by_name(text);` (verify no other caller — currently only Login.tsx uses it).
   - Leave `get_team_id_by_db_name` (used internally by RLS/hooks) alone — it's not called from the client and only returns a team id the caller already belongs to via RLS-guarded reads.

2. **`src/pages/Login.tsx`**
   - Remove the `get_team_id_by_name` pre-check and the client-side create-team / create-membership / create-join-request inserts.
   - After a successful `supabase.auth.signUp`, call `supabase.rpc('signup_join_or_create_team', { _db_name: inventoryDbName.trim() })`.
   - Toast message driven by the returned `action`.
   - Surface errors visibly (replaces current silent `console.error`).

### Why this fixes the finding

- The enumeration primitives (`team_name_exists`, `get_team_id_by_name`) no longer exist, so no authenticated user can probe team names.
- The new RPC only reveals outcomes for the caller's own signup attempt — it cannot be used as an oracle because the side effect (a real join request or a real new team) is bound to the caller's `auth.uid()`.
- As a bonus, signup becomes atomic, which also addresses the related "Non-Atomic Signup Flow" finding.

### Out of scope
No UI changes, no other security findings touched.
