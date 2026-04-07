import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { mockService } from '../lib/mockService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function Members() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  
  const [members, setMembers] = useState(mockService.getUsers(tenantId).filter(u => u.role === 'member'));
  const memberships = mockService.getMemberships();
  const plans = mockService.getPlans(tenantId);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email || !newMember.password) {
      toast.error('Please fill all fields');
      return;
    }
    
    if (mockService.getUserByEmail(newMember.email)) {
      toast.error('Email already in use');
      return;
    }
    
    const created = mockService.addUser({
      ...newMember,
      tenantId,
      role: 'member'
    });
    
    setMembers([...members, created]);
    setIsNewOpen(false);
    toast.success('Member created successfully');
    setNewMember({ name: '', email: '', password: '' });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember.name || !editingMember.email) {
      toast.error('Please fill all fields');
      return;
    }
    
    const updated = mockService.updateUser(editingMember.id, {
      name: editingMember.name,
      email: editingMember.email
    });
    
    if (updated) {
      setMembers(members.map(m => m.id === updated.id ? updated : m));
      setIsEditOpen(false);
      toast.success('Member updated successfully');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      mockService.deleteUser(id);
      setMembers(members.filter(m => m.id !== id));
      toast.success('Member deleted successfully');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Members</h1>
          <p className="text-slate-500">Manage your coworking members.</p>
        </div>
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger render={<Button />}>
            Add Member
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} placeholder="e.g. john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={newMember.password} onChange={(e) => setNewMember({...newMember, password: e.target.value})} placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Search members..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const membership = memberships.find(m => m.userId === member.id);
                const plan = plans.find(p => p.id === membership?.planId);
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{plan?.name || 'No Plan'}</TableCell>
                    <TableCell>
                      {membership ? (
                        <Badge variant={
                          membership.status === 'active' ? 'default' : 
                          membership.status === 'suspended' ? 'destructive' : 'secondary'
                        }>
                          {membership.status}
                        </Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingMember(member);
                            setIsEditOpen(true);
                          }}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(member.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editingMember.name} onChange={(e) => setEditingMember({...editingMember, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editingMember.email} onChange={(e) => setEditingMember({...editingMember, email: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
