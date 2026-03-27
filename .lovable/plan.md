

# Admin Account for Managing Teams & Inventory

## Current State
- The `user_roles` table already has an `app_role` enum with `admin`, `moderator`, and `user` values
- The `has_role()` security definer function exists to check roles
- Team owners can only manage their own team; there's no cross-team admin capability
- Role assignment happens automatically via the `handle_new_user()` trigger (assigns `staff` role)

## What Needs to Change

### 1. Database: RLS Policy Updates
Add admin-override policies to key tables so admins can read/write across all teams:

- **`inventory_teams`**: Add SELECT/UPDATE/DELETE policies for admins (currently admins can't edit or delete teams)
- **`inventory_info`**: Add SELECT/INSERT/UPDATE/DELETE admin policies
- **`inventory_quantity`**: Add SELECT/INSERT/UPDATE/DELETE admin policies
- **`vendor_info`**: Add SELECT/INSERT/UPDATE/DELETE admin policies
- **`team_memberships`**: Already has admin UPDATE policy; add admin DELETE/INSERT overrides
- **`profiles`**: Add admin SELECT-all policy

All policies use `has_role(auth.uid(), 'admin')` to avoid recursive RLS issues.

### 2. Database: Grant Admin Role
Manually assign the `admin` role to the desired user via an INSERT into `user_roles` (since direct inserts are blocked by RLS, this requires a migration or service-role query).

### 3. New Admin Dashboard Page (`src/pages/AdminDashboard.tsx`)
- List all teams with owner info, member count, and inventory count
- Actions per team: edit team name, delete team (cascades memberships), view/edit inventory
- Drill-down to view/edit any team's full inventory
- Search and filter across all teams

### 4. Admin Route Guard (`AdminRoute` component)
- New wrapper component that checks `has_role` for the current user
- Queries `user_roles` table on mount; redirects non-admins away
- Used to protect `/admin` routes

### 5. Navigation Updates (`src/components/Layout.tsx`)
- Add "Admin" nav link visible only to users with the admin role
- Use a `useIsAdmin` hook that queries `user_roles`

### 6. New Hook: `useAdmin.ts`
- `useIsAdmin()` — returns boolean, queries user_roles
- `useAdminTeams()` — fetches all teams with member/inventory counts
- `useAdminInventory(teamId)` — fetches inventory for any team
- Mutations: `deleteTeam`, `updateTeam`, `deleteInventoryItem`, `updateInventoryItem`

### 7. Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Add admin RLS policies to 6 tables + admin role insert |
| `src/hooks/useAdmin.ts` | New — admin data hooks |
| `src/pages/AdminDashboard.tsx` | New — admin management UI |
| `src/App.tsx` | Add `/admin` route with AdminRoute guard |
| `src/components/Layout.tsx` | Add admin nav link |

### Summary
This is a moderate-sized feature: ~1 migration with ~12 new RLS policies, 2 new files (hook + page), and minor updates to routing and navigation. The existing `has_role` function and `user_roles` table provide the foundation — no new tables needed.

