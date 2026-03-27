
-- Admin policies for inventory_teams (SELECT, UPDATE, DELETE)
CREATE POLICY "Admins can view all teams"
ON public.inventory_teams FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all teams"
ON public.inventory_teams FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all teams"
ON public.inventory_teams FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for inventory_info
CREATE POLICY "Admins can view all inventory"
ON public.inventory_info FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert inventory"
ON public.inventory_info FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all inventory"
ON public.inventory_info FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all inventory"
ON public.inventory_info FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for inventory_quantity
CREATE POLICY "Admins can view all quantities"
ON public.inventory_quantity FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert quantities"
ON public.inventory_quantity FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all quantities"
ON public.inventory_quantity FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all quantities"
ON public.inventory_quantity FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for vendor_info
CREATE POLICY "Admins can view all vendors"
ON public.vendor_info FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert vendors"
ON public.vendor_info FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all vendors"
ON public.vendor_info FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all vendors"
ON public.vendor_info FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for team_memberships (INSERT and DELETE - UPDATE already exists)
CREATE POLICY "Admins can insert memberships"
ON public.team_memberships FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete memberships"
ON public.team_memberships FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all memberships"
ON public.team_memberships FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for join_requests
CREATE POLICY "Admins can view all join requests"
ON public.join_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all join requests"
ON public.join_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
