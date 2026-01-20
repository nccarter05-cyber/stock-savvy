import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'member';
  created_at: string;
  email: string | null;
  restaurant_name: string | null;
}

export interface JoinRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  email: string | null;
  restaurant_name: string | null;
}

export interface Team {
  id: string;
  inventory_db_name: string;
  owner_id: string;
  created_at: string;
}

export const useTeam = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's team info
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's team via membership
      const { data: membership } = await supabase
        .from('team_memberships')
        .select('team_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) return null;

      const { data: teamData, error } = await supabase
        .from('inventory_teams')
        .select('*')
        .eq('id', membership.team_id)
        .single();

      if (error) throw error;
      return teamData as Team;
    },
  });

  // Check if current user is the team owner
  const isOwner = team?.owner_id === (team && queryClient.getQueryData(['currentUserId']));

  // Get team members with profile info
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', team?.id],
    enabled: !!team?.id,
    queryFn: async () => {
      if (!team?.id) return [];

      const { data: memberships, error } = await supabase
        .from('team_memberships')
        .select('id, user_id, role, created_at')
        .eq('team_id', team.id);

      if (error) throw error;

      // Get profile info for each member using secure function
      const memberProfiles = await Promise.all(
        (memberships || []).map(async (m) => {
          const { data: profile } = await supabase
            .rpc('get_team_member_profile', { member_user_id: m.user_id })
            .maybeSingle();

          return {
            ...m,
            email: profile?.email || null,
            restaurant_name: profile?.restaurant_name || null,
          } as TeamMember;
        })
      );

      return memberProfiles;
    },
  });

  // Get pending join requests (only for owners)
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['join-requests', team?.id],
    enabled: !!team?.id,
    queryFn: async () => {
      if (!team?.id) return [];

      const { data: requests, error } = await supabase
        .from('join_requests')
        .select('id, user_id, status, created_at')
        .eq('team_id', team.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Get profile info for each requester
      const requestsWithProfiles = await Promise.all(
        (requests || []).map(async (r) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, restaurant_name')
            .eq('id', r.user_id)
            .maybeSingle();

          return {
            ...r,
            email: profile?.email || null,
            restaurant_name: profile?.restaurant_name || null,
          } as JoinRequest;
        })
      );

      return requestsWithProfiles;
    },
  });

  // Get user's own pending request (if they're waiting to join)
  const { data: myPendingRequest } = useQuery({
    queryKey: ['my-join-request'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('join_requests')
        .select('id, team_id, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Approve join request
  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the request details
      const { data: request, error: fetchError } = await supabase
        .from('join_requests')
        .select('user_id, team_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update request status
      const { error: updateError } = await supabase
        .from('join_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add user to team memberships
      const { error: memberError } = await supabase
        .from('team_memberships')
        .insert({
          team_id: request.team_id,
          user_id: request.user_id,
          role: 'member',
        });

      if (memberError) throw memberError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['join-requests'] });
      toast({
        title: 'Request approved',
        description: 'The user has been added to your team.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      });
    },
  });

  // Deny join request
  const denyRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('join_requests')
        .update({ status: 'denied' })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests'] });
      toast({
        title: 'Request denied',
        description: 'The join request has been denied.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deny request',
        variant: 'destructive',
      });
    },
  });

  // Remove team member
  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Member removed',
        description: 'The team member has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      });
    },
  });

  // Cancel own pending request
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('join_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-join-request'] });
      toast({
        title: 'Request cancelled',
        description: 'Your join request has been cancelled.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel request',
        variant: 'destructive',
      });
    },
  });

  // Create a new team
  const createTeamMutation = useMutation({
    mutationFn: async (inventoryDbName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if team name already exists using secure function
      const { data: teamExists, error: checkError } = await supabase
        .rpc('team_name_exists', { team_name: inventoryDbName });

      if (checkError) throw checkError;
      if (teamExists) {
        throw new Error('A team with this name already exists');
      }

      // Create the team
      const { data: newTeam, error: teamError } = await supabase
        .from('inventory_teams')
        .insert({
          owner_id: user.id,
          inventory_db_name: inventoryDbName,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add owner as team member
      const { error: memberError } = await supabase
        .from('team_memberships')
        .insert({
          team_id: newTeam.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      return newTeam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Team created',
        description: 'Your team has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create team',
        variant: 'destructive',
      });
    },
  });

  // Request to join an existing team
  const requestToJoinMutation = useMutation({
    mutationFn: async (inventoryDbName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find the team by inventory_db_name using secure function
      const { data: teamId, error: teamError } = await supabase
        .rpc('get_team_id_by_name', { team_name: inventoryDbName });

      if (teamError) throw teamError;
      if (!teamId) {
        throw new Error('No team found with that name');
      }
      
      const targetTeam = { id: teamId };

      // Check if user already has a pending request
      const { data: existingRequest } = await supabase
        .from('join_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('team_id', targetTeam.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        throw new Error('You already have a pending request for this team');
      }

      // Create join request
      const { error: requestError } = await supabase
        .from('join_requests')
        .insert({
          team_id: targetTeam.id,
          user_id: user.id,
          status: 'pending',
        });

      if (requestError) throw requestError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-join-request'] });
      toast({
        title: 'Request sent',
        description: 'Your request to join the team has been sent.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send join request',
        variant: 'destructive',
      });
    },
  });

  return {
    team,
    members,
    pendingRequests,
    myPendingRequest,
    isLoading: teamLoading || membersLoading || requestsLoading,
    approveRequest: approveRequestMutation.mutate,
    denyRequest: denyRequestMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    cancelRequest: cancelRequestMutation.mutate,
    createTeam: createTeamMutation.mutateAsync,
    requestToJoin: requestToJoinMutation.mutateAsync,
    isCreatingTeam: createTeamMutation.isPending,
    isRequestingToJoin: requestToJoinMutation.isPending,
  };
};
