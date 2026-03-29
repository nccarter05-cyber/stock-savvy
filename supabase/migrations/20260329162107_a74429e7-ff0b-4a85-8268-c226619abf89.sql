INSERT INTO public.user_roles (user_id, role)
VALUES ('a4ee65b1-07c2-4919-ab15-b2ace0d446a6', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;