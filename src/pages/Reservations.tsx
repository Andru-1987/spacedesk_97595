import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { trackEvent } from '../lib/analytics';

export default function Reservations() {
  const { user, tenantSlug } = useAuthStore();
  const tenantId = user?.tenantId || '';
  const isOwnerAdmin = ['owner', 'admin'].includes(user?.role || '');

  const [reservations, setReservations] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newRes, setNewRes] = useState({
    userId: user?.role === 'member' ? user.id : '',
    spaceId: '',
    date: '',
    startTime: '',
    endTime: ''
  });

  const fetchData = async () => {
    try {
      const [resData, spacesData, membersData] = await Promise.all([
        supabase.from('reservations').select('*, profiles(full_name), spaces(name)'),
        supabase.from('spaces').select('*').eq('status', 'active'),
        supabase.from('profiles').select('*').eq('role', 'member')
      ]);

      if (resData.data) setReservations(resData.data);
      if (spacesData.data) setSpaces(spacesData.data);
      if (membersData.data) setMembers(membersData.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!tenantId) return;
    
    fetchData();

    // Supabase Realtime Subscription
    const subscription = supabase
      .channel('reservations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        // Al detectar un cambio (INSERT, UPDATE), refetch de datos
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [tenantId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRes.userId || !newRes.spaceId || !newRes.date || !newRes.startTime || !newRes.endTime) {
      toast.error('Please fill all fields');
      return;
    }
    
    const { error } = await supabase.from('reservations').insert([{
      tenant_id: tenantId,
      user_id: newRes.userId,
      space_id: newRes.spaceId,
      date: newRes.date,
      start_time: newRes.startTime + ":00", 
      end_time: newRes.endTime + ":00",
      status: 'confirmed'
    }]);

    if (error) {
      toast.error(error.message);
      return;
    }

    setIsNewOpen(false);
    
    const selectedSpace = spaces.find(s => s.id === newRes.spaceId);
    trackEvent('reservation_created', {
      tenant_slug: tenantSlug,
      user_role: user?.role,
      space_type: selectedSpace?.type,
    });

    toast.success('Reservation created successfully');
    setNewRes({ userId: user?.role === 'member' ? user.id : '', spaceId: '', date: '', startTime: '', endTime: '' });
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Reservation cancelled');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reservations</h1>
          <p className="text-slate-500">Manage space bookings.</p>
        </div>
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger asChild>
            <Button>New Reservation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Reservation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              
              {isOwnerAdmin && (
                <div className="space-y-2">
                  <Label>Member</Label>
                  <Select value={newRes.userId} onValueChange={(v) => setNewRes({...newRes, userId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Space</Label>
                <Select value={newRes.spaceId} onValueChange={(v) => setNewRes({...newRes, spaceId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select space" /></SelectTrigger>
                  <SelectContent>
                    {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.type})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={newRes.date} onChange={(e) => setNewRes({...newRes, date: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={newRes.startTime} onChange={(e) => setNewRes({...newRes, startTime: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={newRes.endTime} onChange={(e) => setNewRes({...newRes, endTime: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Space</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((res) => (
                <TableRow key={res.id}>
                  <TableCell>{res.date}</TableCell>
                  <TableCell>{res.start_time.slice(0,5)} - {res.end_time.slice(0,5)}</TableCell>
                  <TableCell>{res.profiles?.full_name || 'Unknown'}</TableCell>
                  <TableCell>{res.spaces?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge variant={res.status === 'confirmed' ? 'default' : res.status === 'cancelled' ? 'destructive' : 'secondary'}>
                      {res.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {res.status === 'confirmed' && (
                      <Button variant="ghost" size="sm" onClick={() => handleCancel(res.id)} className="text-red-500">
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
