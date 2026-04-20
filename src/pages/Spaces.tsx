import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export default function Spaces() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  const isOwnerAdmin = ['owner', 'admin'].includes(user?.role || '');
  
  const [spaces, setSpaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newSpace, setNewSpace] = useState({
    name: '',
    type: 'desk',
    capacity: 1,
    pricing: 0,
    status: 'active'
  });

  const fetchSpaces = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('spaces').select('*');
    if (error) {
      toast.error(error.message);
    } else {
      setSpaces(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (tenantId) fetchSpaces();
  }, [tenantId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpace.name) {
      toast.error('Please enter a name');
      return;
    }
    
    const { data, error } = await supabase.from('spaces').insert([{
      tenant_id: tenantId,
      name: newSpace.name,
      type: newSpace.type,
      capacity: Number(newSpace.capacity),
      pricing: Number(newSpace.pricing),
      status: newSpace.status
    }]).select();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) setSpaces([...spaces, data[0]]);
    setIsNewOpen(false);
    toast.success('Space created successfully');
    setNewSpace({ name: '', type: 'desk', capacity: 1, pricing: 0, status: 'active' });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Spaces</h1>
          <p className="text-slate-500">Manage desks, offices, and meeting rooms.</p>
        </div>
        {isOwnerAdmin && (
          <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
            <DialogTrigger asChild>
              <Button>Add Space</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Space</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={newSpace.name} onChange={(e) => setNewSpace({...newSpace, name: e.target.value})} placeholder="e.g. Desk 5" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newSpace.type} onValueChange={(v) => setNewSpace({...newSpace, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desk">Desk</SelectItem>
                      <SelectItem value="office">Private Office</SelectItem>
                      <SelectItem value="meeting_room">Meeting Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input type="number" min="1" value={newSpace.capacity} onChange={(e) => setNewSpace({...newSpace, capacity: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pricing ($/hr or $/mo)</Label>
                    <Input type="number" min="0" value={newSpace.pricing} onChange={(e) => setNewSpace({...newSpace, pricing: Number(e.target.value)})} />
                  </div>
                </div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {spaces.map(space => (
          <Card key={space.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{space.name}</CardTitle>
                <Badge variant={space.status === 'active' ? 'default' : 'secondary'}>{space.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-500 space-y-1">
                <p className="capitalize">Type: {space.type.replace('_', ' ')}</p>
                <p>Capacity: {space.capacity} {space.capacity === 1 ? 'person' : 'people'}</p>
                <p>Pricing: ${space.pricing}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
