import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useIsAdmin = () => {
  return useQuery({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      return !!data;
    },
  });
};

export const useAdminTeams = () => {
  return useQuery({
    queryKey: ['adminTeams'],
    queryFn: async () => {
      const { data: teams, error } = await supabase
        .from('inventory_teams')
        .select('*');
      
      if (error) throw error;
      if (!teams) return [];

      // For each team, get member count, inventory count, and owner profile
      const enriched = await Promise.all(
        teams.map(async (team) => {
          const [membersRes, inventoryRes, ownerRes] = await Promise.all([
            supabase
              .from('team_memberships')
              .select('*', { count: 'exact', head: true })
              .eq('team_id', team.id),
            supabase
              .from('inventory_info')
              .select('user_id')
              .in('user_id', 
                (await supabase
                  .from('team_memberships')
                  .select('user_id')
                  .eq('team_id', team.id)
                ).data?.map(m => m.user_id) || []
              ),
            supabase
              .from('profiles')
              .select('email, restaurant_name')
              .eq('id', team.owner_id)
              .maybeSingle(),
          ]);

          return {
            ...team,
            memberCount: membersRes.count || 0,
            inventoryCount: inventoryRes.data?.length || 0,
            ownerEmail: ownerRes.data?.email || 'Unknown',
            ownerRestaurant: ownerRes.data?.restaurant_name || null,
          };
        })
      );

      return enriched;
    },
  });
};

export const useAdminTeamMembers = (teamId: string | null) => {
  return useQuery({
    queryKey: ['adminTeamMembers', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      if (!teamId) return [];
      
      const { data: memberships, error } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('team_id', teamId);
      
      if (error) throw error;
      if (!memberships) return [];

      const enriched = await Promise.all(
        memberships.map(async (m) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, restaurant_name')
            .eq('id', m.user_id)
            .maybeSingle();
          
          return {
            ...m,
            email: profile?.email || 'Unknown',
            restaurant_name: profile?.restaurant_name || null,
          };
        })
      );

      return enriched;
    },
  });
};

export const useAdminTeamInventory = (teamId: string | null) => {
  return useQuery({
    queryKey: ['adminTeamInventory', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      if (!teamId) return [];

      // Get team member user_ids
      const { data: members } = await supabase
        .from('team_memberships')
        .select('user_id')
        .eq('team_id', teamId);
      
      if (!members?.length) return [];
      const userIds = members.map(m => m.user_id);

      const { data: items, error } = await supabase
        .from('inventory_info')
        .select('*, inventory_quantity(*), vendor_info(*)')
        .in('user_id', userIds);
      
      if (error) throw error;
      return items || [];
    },
  });
};

export const useAdminMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateTeamName = useMutation({
    mutationFn: async ({ teamId, name }: { teamId: string; name: string }) => {
      const { error } = await supabase
        .from('inventory_teams')
        .update({ inventory_db_name: name })
        .eq('id', teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTeams'] });
      toast({ title: 'Team updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update team', description: err.message, variant: 'destructive' });
    },
  });

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      // Delete memberships first, then team
      await supabase.from('team_memberships').delete().eq('team_id', teamId);
      await supabase.from('join_requests').delete().eq('team_id', teamId);
      const { error } = await supabase.from('inventory_teams').delete().eq('id', teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTeams'] });
      toast({ title: 'Team deleted' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to delete team', description: err.message, variant: 'destructive' });
    },
  });

  const deleteInventoryItem = useMutation({
    mutationFn: async (itemId: string) => {
      await supabase.from('inventory_quantity').delete().eq('inventory_id', itemId);
      const { error } = await supabase.from('inventory_info').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTeamInventory'] });
      toast({ title: 'Item deleted' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to delete item', description: err.message, variant: 'destructive' });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase.from('team_memberships').delete().eq('id', membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTeamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['adminTeams'] });
      toast({ title: 'Member removed' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to remove member', description: err.message, variant: 'destructive' });
    },
  });

  return { updateTeamName, deleteTeam, deleteInventoryItem, removeMember };
};
