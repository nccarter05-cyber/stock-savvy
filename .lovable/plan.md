

# Add Admin Role to Simplestockadmin@gmail.com

## What
Insert an `admin` role for user `simplestockadmin@gmail.com` (ID: `a4ee65b1-07c2-4919-ab15-b2ace0d446a6`) into the `user_roles` table. The user currently only has the `staff` role.

## How
A single database migration:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('a4ee65b1-07c2-4919-ab15-b2ace0d446a6', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

No code changes needed. After migration, the user will see the admin shield icon in the navbar and have access to the Admin Dashboard.

