import { useState } from 'react';
import { mockService } from '../lib/mockService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function Tenants() {
  const [tenants, setTenants] = useState(mockService.getTenants());
  
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: '',
    slug: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.slug) {
      toast.error('Please enter a name and slug');
      return;
    }
    
    // Check if slug exists
    if (tenants.some(t => t.slug === newTenant.slug)) {
      toast.error('Slug already exists');
      return;
    }
    
    const created = mockService.addTenant(newTenant);
    
    setTenants([...tenants, created]);
    setIsNewOpen(false);
    toast.success('Tenant created successfully');
    setNewTenant({ name: '', slug: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tenants</h1>
          <p className="text-slate-500">Manage coworking spaces across the platform.</p>
        </div>
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger render={<Button />}>
            Add Tenant
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newTenant.name} onChange={(e) => setNewTenant({...newTenant, name: e.target.value})} placeholder="e.g. Acme Cowork" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={newTenant.slug} onChange={(e) => setNewTenant({...newTenant, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="e.g. acme-cowork" />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map(tenant => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.slug}</TableCell>
                  <TableCell className="text-slate-500">{tenant.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
