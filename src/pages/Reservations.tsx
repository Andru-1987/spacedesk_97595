import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { mockService } from '../lib/mockService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export default function Reservations() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  
  const [reservations, setReservations] = useState(mockService.getReservations(tenantId));
  const spaces = mockService.getSpaces(tenantId);
  const members = mockService.getUsers(tenantId).filter(u => u.role === 'member');
  
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newRes, setNewRes] = useState({
    userId: '',
    spaceId: '',
    date: '',
    startTime: '',
    endTime: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRes.userId || !newRes.spaceId || !newRes.date || !newRes.startTime || !newRes.endTime) {
      toast.error('Please fill all fields');
      return;
    }
    
    const created = mockService.addReservation({
      tenantId,
      ...newRes,
      status: 'confirmed'
    });
    
    setReservations([...reservations, created]);
    setIsNewOpen(false);
    toast.success('Reservation created successfully');
    setNewRes({ userId: '', spaceId: '', date: '', startTime: '', endTime: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reservations</h1>
          <p className="text-slate-500">Manage space bookings.</p>
        </div>
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger render={<Button />}>
            New Reservation
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Reservation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Member</Label>
                <Select value={newRes.userId} onValueChange={(v) => setNewRes({...newRes, userId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((res) => {
                const member = members.find(m => m.id === res.userId);
                const space = spaces.find(s => s.id === res.spaceId);
                return (
                  <TableRow key={res.id}>
                    <TableCell>{res.date}</TableCell>
                    <TableCell>{res.startTime} - {res.endTime}</TableCell>
                    <TableCell>{member?.name || 'Unknown'}</TableCell>
                    <TableCell>{space?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant={res.status === 'confirmed' ? 'default' : res.status === 'cancelled' ? 'destructive' : 'secondary'}>
                        {res.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
