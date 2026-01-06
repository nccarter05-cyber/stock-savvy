import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTeam } from '@/hooks/useTeam';
import { Users, UserPlus, Crown, UserMinus, Clock, Check, X, Plus, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

const TeamSettings = () => {
  const { 
    team, 
    members, 
    pendingRequests, 
    myPendingRequest,
    isLoading,
    approveRequest,
    denyRequest,
    removeMember,
    cancelRequest,
    createTeam,
    requestToJoin,
    isCreatingTeam,
    isRequestingToJoin,
  } = useTeam();
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [joinTeamName, setJoinTeamName] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  const isOwner = team?.owner_id === currentUserId;

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      await createTeam(newTeamName.trim());
      setNewTeamName('');
    } catch {
      // Error handled by mutation
    }
  };

  const handleRequestToJoin = async () => {
    if (!joinTeamName.trim()) return;
    try {
      await requestToJoin(joinTeamName.trim());
      setJoinTeamName('');
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  // User is waiting for approval
  if (myPendingRequest && !team) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle>Waiting for Approval</CardTitle>
                  <CardDescription>Your request to join a team is pending</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The team owner needs to approve your request before you can access the shared inventory. 
                You'll be notified once your request is processed.
              </p>
              <Button 
                variant="outline" 
                onClick={() => cancelRequest(myPendingRequest.id)}
              >
                Cancel Request
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // User is not part of any team - show create/join options
  if (!team) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Get Started with Teams</h1>
            <p className="text-muted-foreground">Create your own team or join an existing one</p>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Team
              </TabsTrigger>
              <TabsTrigger value="join" className="gap-2">
                <LogIn className="h-4 w-4" />
                Join Team
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle>Create a New Team</CardTitle>
                  <CardDescription>
                    Start your own team and invite others to join. You'll be the owner and can manage members.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                      id="team-name"
                      placeholder="e.g., mcs-bbq"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be your team's unique identifier. Use lowercase letters, numbers, and hyphens.
                    </p>
                  </div>
                  <Button 
                    onClick={handleCreateTeam}
                    disabled={!newTeamName.trim() || isCreatingTeam}
                    className="w-full"
                  >
                    {isCreatingTeam ? 'Creating...' : 'Create Team'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="join">
              <Card>
                <CardHeader>
                  <CardTitle>Join an Existing Team</CardTitle>
                  <CardDescription>
                    Enter the team name to request access. The team owner will need to approve your request.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="join-team-name">Team Name</Label>
                    <Input
                      id="join-team-name"
                      placeholder="Enter team name"
                      value={joinTeamName}
                      onChange={(e) => setJoinTeamName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRequestToJoin()}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ask the team owner for their team name to request access.
                    </p>
                  </div>
                  <Button 
                    onClick={handleRequestToJoin}
                    disabled={!joinTeamName.trim() || isRequestingToJoin}
                    className="w-full"
                  >
                    {isRequestingToJoin ? 'Sending Request...' : 'Request to Join'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Team Settings</h1>
          <p className="text-muted-foreground">Manage your team and members</p>
        </div>

        {/* Team Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{team.inventory_db_name}</CardTitle>
                <CardDescription>
                  {isOwner ? 'You are the owner of this team' : 'You are a member of this team'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Pending Requests (Owner only) */}
        {isOwner && pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Pending Requests</CardTitle>
                <Badge variant="secondary">{pendingRequests.length}</Badge>
              </div>
              <CardDescription>People requesting to join your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div 
                    key={request.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{request.email || 'Unknown email'}</p>
                      {request.restaurant_name && (
                        <p className="text-sm text-muted-foreground">{request.restaurant_name}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => approveRequest(request.id)}
                        className="gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => denyRequest(request.id)}
                        className="gap-1"
                      >
                        <X className="h-4 w-4" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle className="text-lg">Team Members</CardTitle>
              <Badge variant="outline">{members.length}</Badge>
            </div>
            <CardDescription>People with access to the shared inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.email || 'Unknown email'}</p>
                        {member.role === 'owner' && (
                          <Badge variant="default" className="gap-1">
                            <Crown className="h-3 w-3" />
                            Owner
                          </Badge>
                        )}
                        {member.user_id === currentUserId && member.role !== 'owner' && (
                          <Badge variant="secondary">You</Badge>
                        )}
                      </div>
                      {member.restaurant_name && (
                        <p className="text-sm text-muted-foreground">{member.restaurant_name}</p>
                      )}
                    </div>
                  </div>
                  {isOwner && member.role !== 'owner' && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => removeMember(member.id)}
                      className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <UserMinus className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TeamSettings;
