
-- Atomic create-or-join, scoped to the caller. Does not leak team existence to
-- arbitrary callers because the only observable effect is on the caller's own
-- membership / join request.
CREATE OR REPLACE FUNCTION public.signup_join_or_create_team(_db_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _team_id uuid;
  _clean text := btrim(_db_name);
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF _clean IS NULL OR length(_clean) = 0 THEN
    RAISE EXCEPTION 'Inventory DB name is required' USING ERRCODE = '22023';
  END IF;

  -- Try to find an existing team
  SELECT id INTO _team_id
  FROM public.inventory_teams
  WHERE inventory_db_name = _clean;

  IF _team_id IS NOT NULL THEN
    -- Already a member? Nothing to do.
    IF EXISTS (
      SELECT 1 FROM public.team_memberships
      WHERE team_id = _team_id AND user_id = _uid
    ) THEN
      RETURN jsonb_build_object('action', 'already_member');
    END IF;

    INSERT INTO public.join_requests (team_id, user_id, status)
    VALUES (_team_id, _uid, 'pending')
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object('action', 'join_requested');
  END IF;

  -- Try to create; handle race where another signup created it first.
  BEGIN
    INSERT INTO public.inventory_teams (owner_id, inventory_db_name)
    VALUES (_uid, _clean)
    RETURNING id INTO _team_id;

    INSERT INTO public.team_memberships (team_id, user_id, role)
    VALUES (_team_id, _uid, 'owner');

    RETURN jsonb_build_object('action', 'team_created');
  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO _team_id
    FROM public.inventory_teams
    WHERE inventory_db_name = _clean;

    INSERT INTO public.join_requests (team_id, user_id, status)
    VALUES (_team_id, _uid, 'pending')
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object('action', 'join_requested');
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.signup_join_or_create_team(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.signup_join_or_create_team(text) TO authenticated;

-- Remove the enumeration primitives.
DROP FUNCTION IF EXISTS public.team_name_exists(text);
DROP FUNCTION IF EXISTS public.get_team_id_by_name(text);
