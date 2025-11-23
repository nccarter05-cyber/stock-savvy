-- Create vendor_info table
create table public.vendor_info (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  vendor_name text not null,
  address text,
  email text,
  phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on vendor_info
alter table public.vendor_info enable row level security;

-- Vendor policies: users can manage their own vendors
create policy "Users can view their own vendors"
  on public.vendor_info
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own vendors"
  on public.vendor_info
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own vendors"
  on public.vendor_info
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own vendors"
  on public.vendor_info
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create inventory_info table
create table public.inventory_info (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  inventory_name text not null,
  vendor_id uuid references public.vendor_info(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on inventory_info
alter table public.inventory_info enable row level security;

-- Inventory info policies: users can manage their own inventory
create policy "Users can view their own inventory"
  on public.inventory_info
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own inventory"
  on public.inventory_info
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own inventory"
  on public.inventory_info
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own inventory"
  on public.inventory_info
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create inventory_quantity table
create table public.inventory_quantity (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid references public.inventory_info(id) on delete cascade not null,
  current_quantity numeric not null default 0,
  inventory_maximum numeric,
  inventory_minimum numeric,
  vendor_id uuid references public.vendor_info(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(inventory_id)
);

-- Enable RLS on inventory_quantity
alter table public.inventory_quantity enable row level security;

-- Inventory quantity policies: users can manage quantities for their own inventory
create policy "Users can view quantities for their inventory"
  on public.inventory_quantity
  for select
  to authenticated
  using (
    exists (
      select 1 from public.inventory_info
      where inventory_info.id = inventory_quantity.inventory_id
      and inventory_info.user_id = auth.uid()
    )
  );

create policy "Users can insert quantities for their inventory"
  on public.inventory_quantity
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.inventory_info
      where inventory_info.id = inventory_quantity.inventory_id
      and inventory_info.user_id = auth.uid()
    )
  );

create policy "Users can update quantities for their inventory"
  on public.inventory_quantity
  for update
  to authenticated
  using (
    exists (
      select 1 from public.inventory_info
      where inventory_info.id = inventory_quantity.inventory_id
      and inventory_info.user_id = auth.uid()
    )
  );

create policy "Users can delete quantities for their inventory"
  on public.inventory_quantity
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.inventory_info
      where inventory_info.id = inventory_quantity.inventory_id
      and inventory_info.user_id = auth.uid()
    )
  );

-- Add triggers for updated_at timestamps
create trigger update_vendor_info_updated_at
  before update on public.vendor_info
  for each row
  execute function public.update_updated_at_column();

create trigger update_inventory_info_updated_at
  before update on public.inventory_info
  for each row
  execute function public.update_updated_at_column();

create trigger update_inventory_quantity_updated_at
  before update on public.inventory_quantity
  for each row
  execute function public.update_updated_at_column();

-- Create indexes for better query performance
create index idx_vendor_info_user_id on public.vendor_info(user_id);
create index idx_inventory_info_user_id on public.inventory_info(user_id);
create index idx_inventory_info_vendor_id on public.inventory_info(vendor_id);
create index idx_inventory_quantity_inventory_id on public.inventory_quantity(inventory_id);
create index idx_inventory_quantity_vendor_id on public.inventory_quantity(vendor_id);