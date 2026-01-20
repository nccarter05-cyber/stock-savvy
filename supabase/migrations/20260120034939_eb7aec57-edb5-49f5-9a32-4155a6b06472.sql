-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can check if team exists" ON public.inventory_teams;

-- Create a secure function to look up team ID by name
-- This returns only the ID, not other team details
CREATE OR REPLACE FUNCTION public.get_team_id_by_name(team_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  team_uuid uuid;
BEGIN
  SELECT id INTO team_uuid
  FROM public.inventory_teams
  WHERE inventory_db_name = team_name;
  
  RETURN team_uuid;
END;
$$;

-- Create a secure function to check if team name exists (for validation)
CREATE OR REPLACE FUNCTION public.team_name_exists(team_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.inventory_teams
    WHERE inventory_db_name = team_name
  );
END;
$$;