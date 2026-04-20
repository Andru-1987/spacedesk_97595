import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
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
  
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const fetchAdmins = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin');

      if (error) {
        toast.error(error.message);
      } else {
        setAdmins(data || []);
      }
      setIsLoading(false);
    };
    if (tenantId) fetchAdmins();
  }, [tenantId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error('Please fill all fields');
      return;
    }
    
    // Create admin user via Supabase Auth signup with admin role
    const { data: authData, error } = await supabase.auth.signUp({
      email: newAdmin.email,
      password: newAdmin.password,
      options: {
        data: {
          tenant_id: tenantId,
          full_name: newAdmin.name,
          role: 'admin'
        }
      }
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (authData.user) {
      // The trigger will create the profile automatically
      setAdmins([...admins, { id: authData.user.id, full_name: newAdmin.name, role: 'admin', created_at: new Date().toISOString() }]);
    }
    
    setIsNewOpen(false);
    toast.success('Admin created successfully');
    setNewAdmin({ name: '', email: '', password: '' });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admins</h1>
          <p className="text-slate-500">Manage administrators for your coworking space.</p>
        </div>
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger asChild>
            <Button>Add Admin</Button>
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
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map(admin => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.full_name}</TableCell>
                  <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
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
