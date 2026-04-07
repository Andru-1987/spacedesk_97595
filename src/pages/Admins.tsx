import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { mockService } from '../lib/mockService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function Admins() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  
  const [admins, setAdmins] = useState(mockService.getUsers(tenantId).filter(u => u.role === 'admin'));
  
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error('Please fill all fields');
      return;
    }
    
    // Check if email exists
    if (mockService.getUserByEmail(newAdmin.email)) {
      toast.error('Email already in use');
      return;
    }
    
    const created = mockService.addUser({
      ...newAdmin,
      tenantId,
      role: 'admin'
    });
    
    setAdmins([...admins, created]);
    setIsNewOpen(false);
    toast.success('Admin created successfully');
    setNewAdmin({ name: '', email: '', password: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admins</h1>
          <p className="text-slate-500">Manage administrators for your coworking space.</p>
        </div>
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger render={<Button />}>
            Add Admin
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newAdmin.name} onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})} placeholder="e.g. Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})} placeholder="e.g. jane@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})} placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Admins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map(admin => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                </TableRow>
              ))}
              {admins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-6 text-slate-500">
                    No admins found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
