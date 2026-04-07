import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { mockService } from '../lib/mockService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, CalendarCheck, Percent, Receipt } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, subDays } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  
  const members = mockService.getUsers(tenantId).filter(u => u.role === 'member');
  const reservations = mockService.getReservations(tenantId);
  const invoices = mockService.getInvoices(tenantId);
  const spaces = mockService.getSpaces(tenantId);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayReservations = reservations.filter(r => r.date === today && r.status === 'confirmed');
  
  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Generate mock chart data
  const chartData = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'MMM dd'),
        occupancy: Math.floor(Math.random() * 40) + 40, // Random between 40-80%
      };
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your coworking space.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-slate-500">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Today's Reservations</CardTitle>
            <CalendarCheck className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayReservations.length}</div>
            <p className="text-xs text-slate-500">Across {spaces.length} spaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Occupancy</CardTitle>
            <Percent className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-slate-500">+5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Receipt className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPendingAmount}</div>
            <p className="text-xs text-slate-500">{pendingInvoices.length} invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Occupancy (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="occupancy" stroke="#0f172a" fillOpacity={1} fill="url(#colorOccupancy)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {reservations.slice(0, 5).map((res) => {
                const space = spaces.find(s => s.id === res.spaceId);
                const member = members.find(m => m.id === res.userId);
                return (
                  <div key={res.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{member?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-500">
                        {space?.name} • {res.date} ({res.startTime} - {res.endTime})
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        res.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        res.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {res.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
