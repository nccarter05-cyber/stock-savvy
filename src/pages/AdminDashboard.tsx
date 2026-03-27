import { useState } from 'react';
import Layout from '@/components/Layout';
import { useAdminTeams, useAdminTeamInventory, useAdminTeamMembers, useAdminMutations } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Edit, Trash2, Package, Users, ArrowLeft, Eye } from 'lucide-react';

const AdminDashboard = () => {
  const { data: teams, isLoading } = useAdminTeams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'teams' | 'inventory' | 'members'>('teams');
  const [editTeam, setEditTeam] = useState<{ id: string; name: string } | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteMembershipId, setDeleteMembershipId] = useState<string | null>(null);

  const { data: teamInventory } = useAdminTeamInventory(viewMode === 'inventory' ? selectedTeamId : null);
  const { data: teamMembers } = useAdminTeamMembers(viewMode === 'members' ? selectedTeamId : null);
  const { updateTeamName, deleteTeam, deleteInventoryItem, removeMember } = useAdminMutations();

  const filteredTeams = teams?.filter(t =>
    t.inventory_db_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedTeamName = teams?.find(t => t.id === selectedTeamId)?.inventory_db_name || '';

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {viewMode !== 'teams' && (
              <Button variant="ghost" size="icon" onClick={() => { setViewMode('teams'); setSelectedTeamId(null); }}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-2xl font-bold text-foreground">
              {viewMode === 'teams' && 'Admin Dashboard'}
              {viewMode === 'inventory' && `Inventory — ${selectedTeamName}`}
              {viewMode === 'members' && `Members — ${selectedTeamName}`}
            </h1>
          </div>
        </div>

        {viewMode === 'teams' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Teams</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{teams?.length || 0}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Members</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{teams?.reduce((s, t) => s + t.memberCount, 0) || 0}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Items</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{teams?.reduce((s, t) => s + t.inventoryCount, 0) || 0}</p></CardContent>
              </Card>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search teams..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map(team => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.inventory_db_name}</TableCell>
                        <TableCell>{team.ownerEmail}</TableCell>
                        <TableCell><Badge variant="secondary">{team.memberCount}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{team.inventoryCount}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedTeamId(team.id); setViewMode('members'); }}>
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedTeamId(team.id); setViewMode('inventory'); }}>
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditTeam({ id: team.id, name: team.inventory_db_name })}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTeamId(team.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTeams.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No teams found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {viewMode === 'inventory' && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamInventory?.map((item: any) => {
                    const qty = item.inventory_quantity?.[0];
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.inventory_name}</TableCell>
                        <TableCell>{item.category || '—'}</TableCell>
                        <TableCell>{qty?.current_quantity ?? '—'}</TableCell>
                        <TableCell>{qty?.inventory_minimum ?? '—'}</TableCell>
                        <TableCell>{qty?.inventory_maximum ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDeleteItemId(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!teamInventory || teamInventory.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No inventory items</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {viewMode === 'members' && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers?.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.restaurant_name || '—'}</TableCell>
                      <TableCell><Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>{member.role}</Badge></TableCell>
                      <TableCell className="text-right">
                        {member.role !== 'owner' && (
                          <Button variant="ghost" size="icon" onClick={() => setDeleteMembershipId(member.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!teamMembers || teamMembers.length === 0) && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No members</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Team Dialog */}
      <Dialog open={!!editTeam} onOpenChange={() => setEditTeam(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Team Name</DialogTitle></DialogHeader>
          <Input value={editTeam?.name || ''} onChange={e => setEditTeam(prev => prev ? { ...prev, name: e.target.value } : null)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTeam(null)}>Cancel</Button>
            <Button onClick={() => { if (editTeam) { updateTeamName.mutate({ teamId: editTeam.id, name: editTeam.name }); setEditTeam(null); } }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirm */}
      <AlertDialog open={!!deleteTeamId} onOpenChange={() => setDeleteTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>This will remove all memberships and the team. Inventory items owned by members will remain but become unlinked.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTeamId) { deleteTeam.mutate(deleteTeamId); setDeleteTeamId(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirm */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this inventory item and its quantity records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteItemId) { deleteInventoryItem.mutate(deleteItemId); setDeleteItemId(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirm */}
      <AlertDialog open={!!deleteMembershipId} onOpenChange={() => setDeleteMembershipId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>This member will be removed from the team.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteMembershipId) { removeMember.mutate(deleteMembershipId); setDeleteMembershipId(null); } }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default AdminDashboard;
