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

export default function Portal() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  const userId = user?.id || '';
  
  const [membership, setMembership] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newRes, setNewRes] = useState({
    spaceId: '',
    date: '',
    startTime: '',
    endTime: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [membershipRes, reservationsRes, spacesRes] = await Promise.all([
        supabase.from('memberships').select('*, plans(*)').eq('user_id', userId).maybeSingle(),
        supabase.from('reservations').select('*, spaces(name)').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('spaces').select('*').eq('status', 'active')
      ]);

      if (membershipRes.data) {
        setMembership(membershipRes.data);
        setPlan(membershipRes.data.plans);
      }
      if (reservationsRes.data) setReservations(reservationsRes.data);
      if (spacesRes.data) setSpaces(spacesRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchData();

    // Realtime for own reservations
    const subscription = supabase
      .channel('portal_reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `user_id=eq.${userId}` }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRes.spaceId || !newRes.date || !newRes.startTime || !newRes.endTime) {
      toast.error('Please fill all fields');
      return;
    }
    
    const { error } = await supabase.from('reservations').insert([{
      tenant_id: tenantId,
      user_id: userId,
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
    toast.success('Reservation created successfully');
    setNewRes({ spaceId: '', date: '', startTime: '', endTime: '' });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Member Portal</h1>
        <p className="text-slate-500">Welcome back, {user?.name}. Manage your coworking experience.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">{plan.name}</span>
                  <Badge variant={membership?.status === 'active' ? 'default' : 'destructive'}>
                    {membership?.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>Access: {plan.access_hours}</p>
                  <p>Room Credits: {plan.room_credits} / month</p>
                  <p>Valid until: {membership?.end_date}</p>
                </div>
              </>
            ) : (
              <p className="text-slate-500">No active plan found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Book</CardTitle>
            <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Book Space</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book a Space</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Space</Label>
                    <Select value={newRes.spaceId} onValueChange={(v) => setNewRes({...newRes, spaceId: v})}>
                      <SelectTrigger><SelectValue placeholder="Select space" /></SelectTrigger>
                      <SelectContent>
                        {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
                  <Button type="submit" className="w-full">Confirm Booking</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">Your upcoming reservations.</p>
            <div className="space-y-3">
              {reservations.filter(r => new Date(r.date) >= new Date()).slice(0, 3).map(res => (
                <div key={res.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <p className="font-medium">{res.spaces?.name}</p>
                    <p className="text-slate-500">{res.date} ({res.start_time?.slice(0,5)} - {res.end_time?.slice(0,5)})</p>
                  </div>
                  <Badge variant="outline">{res.status}</Badge>
                </div>
              ))}
              {reservations.filter(r => new Date(r.date) >= new Date()).length === 0 && (
                <p className="text-sm text-slate-400">No upcoming reservations.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservation History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Space</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((res) => (
                <TableRow key={res.id}>
                  <TableCell>{res.date}</TableCell>
                  <TableCell>{res.start_time?.slice(0,5)} - {res.end_time?.slice(0,5)}</TableCell>
                  <TableCell>{res.spaces?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge variant={res.status === 'confirmed' ? 'default' : res.status === 'cancelled' ? 'destructive' : 'secondary'}>
                      {res.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {reservations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                    No reservations found.
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
