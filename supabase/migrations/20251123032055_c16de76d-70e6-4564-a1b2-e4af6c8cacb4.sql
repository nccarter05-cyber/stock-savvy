-- Update handle_new_user to capture restaurant name from signup metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert profile with restaurant name from metadata
  insert into public.profiles (id, email, restaurant_name)
  values (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'restaurant_name'
  );
  
  -- Assign 'staff' role by default (first user should be manually promoted to admin)
  insert into public.user_roles (user_id, role)
  values (new.id, 'staff');
  
  return new;
end;
$$;