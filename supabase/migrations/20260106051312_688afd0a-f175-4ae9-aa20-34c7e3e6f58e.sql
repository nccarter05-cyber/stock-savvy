-- Create enums for team roles and request status
CREATE TYPE public.team_role AS ENUM ('owner', 'member');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'denied');

-- Create inventory_teams table to track team ownership
CREATE TABLE public.inventory_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_db_name text UNIQUE NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create team_memberships table to track who belongs to each team
CREATE TABLE public.team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.inventory_teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create join_requests table for pending requests
CREATE TABLE public.join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.inventory_teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  status request_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.inventory_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

-- Create security definer function to check team ownership
CREATE OR REPLACE FUNCTION public.is_team_owner(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.inventory_teams
    WHERE owner_id = _user_id AND id = _team_id
  )
$$;

-- Create function to get team ID from inventory_db_name
CREATE OR REPLACE FUNCTION public.get_team_id_by_db_name(_db_name text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.inventory_teams WHERE inventory_db_name = _db_name LIMIT 1
$$;

-- Create function to get user's team ID
CREATE OR REPLACE FUNCTION public.get_user_team_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT team_id FROM public.team_memberships WHERE user_id = _user_id LIMIT 1
$$;

-- RLS policies for inventory_teams
CREATE POLICY "Team members can view their team"
ON public.inventory_teams FOR SELECT
USING (public.is_team_member(auth.uid(), id) OR owner_id = auth.uid());

CREATE POLICY "Anyone can check if team exists"
ON public.inventory_teams FOR SELECT
USING (true);

-- RLS policies for team_memberships
CREATE POLICY "Team members can view memberships"
ON public.team_memberships FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team owners can insert memberships"
ON public.team_memberships FOR INSERT
WITH CHECK (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Team owners can delete memberships"
ON public.team_memberships FOR DELETE
USING (public.is_team_owner(auth.uid(), team_id) AND role != 'owner');

-- Self-insert for new team owners (via trigger)
CREATE POLICY "Users can insert own membership"
ON public.team_memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for join_requests
CREATE POLICY "Users can view their own requests"
ON public.join_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Team owners can view all requests"
ON public.join_requests FOR SELECT
USING (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Users can create join requests"
ON public.join_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team owners can update requests"
ON public.join_requests FOR UPDATE
USING (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Users can delete their own pending requests"
ON public.join_requests FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Update trigger for join_requests updated_at
CREATE TRIGGER update_join_requests_updated_at
BEFORE UPDATE ON public.join_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop old RLS policies on inventory_info
DROP POLICY IF EXISTS "Users can view shared inventory" ON public.inventory_info;
DROP POLICY IF EXISTS "Users can insert shared inventory" ON public.inventory_info;
DROP POLICY IF EXISTS "Users can update shared inventory" ON public.inventory_info;
DROP POLICY IF EXISTS "Users can delete shared inventory" ON public.inventory_info;

-- New RLS policies for inventory_info using team membership
CREATE POLICY "Team members can view inventory"
ON public.inventory_info FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM team_memberships tm1
    JOIN team_memberships tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = inventory_info.user_id
  )
);

CREATE POLICY "Team members can insert inventory"
ON public.inventory_info FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can update inventory"
ON public.inventory_info FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM team_memberships tm1
    JOIN team_memberships tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = inventory_info.user_id
  )
);

CREATE POLICY "Team members can delete inventory"
ON public.inventory_info FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM team_memberships tm1
    JOIN team_memberships tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = inventory_info.user_id
  )
);

-- Drop old RLS policies on inventory_quantity
DROP POLICY IF EXISTS "Users can view shared quantities" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can insert shared quantities" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can update shared quantities" ON public.inventory_quantity;
DROP POLICY IF EXISTS "Users can delete shared quantities" ON public.inventory_quantity;

-- New RLS policies for inventory_quantity using team membership
CREATE POLICY "Team members can view quantities"
ON public.inventory_quantity FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM team_memberships tm1
    JOIN team_memberships tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = inventory_quantity.user_id
  )
);

CREATE POLICY "Team members can insert quantities"
ON public.inventory_quantity FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can update quantities"
ON public.inventory_quantity FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM team_memberships tm1
    JOIN team_memberships tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = inventory_quantity.user_id
  )
);

CREATE POLICY "Team members can delete quantities"
ON public.inventory_quantity FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM team_memberships tm1
    JOIN team_memberships tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = inventory_quantity.user_id
  )
);

-- Drop old RLS policies on vendor_info
DROP POLICY IF EXISTS "Users can view shared vendors" ON public.vendor_info;
DROP POLICY IF EXISTS "Users can insert shared vendors" ON public.vendor_info;
DROP POLICY IF EXISTS "Users can update shared vendors" ON public.vendor_info;
DROP POLICY IF EXISTS "Users can delete shared vendors" ON public.vendor_info;

-- New RLS policies for vendor_info using team membership
CREATE POLICY "Team members can view vendors"
ON public.vendor_info FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM team_memberships tm1
    JOIN team_memberships tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = vendor_info.user_id
  )
);

CREATE POLICY "Team members can insert vendors"
ON public.vendor_info FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can update vendors"
ON public.vendor_info FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM team_memberships tm1
    JOIN team_memberships tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = vendor_info.user_id
  )
);

CREATE POLICY "Team members can delete vendors"
ON public.vendor_info FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM team_memberships tm1
    JOIN team_memberships tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = vendor_info.user_id
  )
);