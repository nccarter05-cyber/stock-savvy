import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTeam } from '@/hooks/useTeam';
import { Users, UserPlus, Crown, UserMinus, Clock, Check, X, AlertCircle } from 'lucide-react';
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
  } = useTeam();
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  const isOwner = team?.owner_id === currentUserId;

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

  // User is not part of any team (shouldn't happen normally)
  if (!team) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>No Team Found</CardTitle>
                  <CardDescription>You're not part of any team yet</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Please contact support if you believe this is an error.
              </p>
            </CardContent>
          </Card>
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
