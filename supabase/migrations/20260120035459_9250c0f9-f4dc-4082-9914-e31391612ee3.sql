-- Create a secure function to get team member profiles with conditional email visibility
-- Only team owners see email addresses of other members
CREATE OR REPLACE FUNCTION public.get_team_member_profile(member_user_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  restaurant_name text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  caller_team_id uuid;
  member_team_id uuid;
  is_caller_owner boolean := false;
BEGIN
  caller_id := auth.uid();
  
  -- Get caller's team
  SELECT tm.team_id INTO caller_team_id
  FROM team_memberships tm
  WHERE tm.user_id = caller_id
  LIMIT 1;
  
  -- Get member's team
  SELECT tm.team_id INTO member_team_id
  FROM team_memberships tm
  WHERE tm.user_id = member_user_id
  LIMIT 1;
  
  -- Check if they're on the same team
  IF caller_team_id IS NULL OR member_team_id IS NULL OR caller_team_id != member_team_id THEN
    RETURN; -- Return empty if not on same team
  END IF;
  
  -- Check if caller is owner
  SELECT EXISTS(
    SELECT 1 FROM inventory_teams t
    WHERE t.id = caller_team_id AND t.owner_id = caller_id
  ) INTO is_caller_owner;
  
  -- Return profile with conditional email visibility
  RETURN QUERY
  SELECT 
    p.id,
    CASE 
      WHEN caller_id = member_user_id THEN p.email  -- Always see own email
      WHEN is_caller_owner THEN p.email              -- Owners see all emails
      ELSE NULL                                       -- Members don't see others' emails
    END as email,
    p.restaurant_name,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = member_user_id;
END;
$$;