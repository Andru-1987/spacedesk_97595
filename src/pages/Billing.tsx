import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function Billing() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*, profiles(full_name)')
        .order('date', { ascending: false });

      if (error) {
        toast.error(error.message);
      } else {
        setInvoices(data || []);
      }
      setIsLoading(false);
    };
    if (user?.tenantId) fetchInvoices();
  }, [user]);

  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPending = invoices.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0);
  const membersInArrears = new Set(invoices.filter(i => i.status === 'overdue').map(i => i.user_id)).size;

  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setInvoices(invoices.map(i => i.id === id ? { ...i, status: 'paid' } : i));
    toast.success('Invoice marked as paid');
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Billing</h1>
        <p className="text-slate-500">Manage invoices and payments.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Billed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBilled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${totalPending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Members in Arrears</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{membersInArrears}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell className="font-medium">{invoice.profiles?.full_name || 'Unknown'}</TableCell>
                  <TableCell>${invoice.amount}</TableCell>
                  <TableCell>{invoice.due_date}</TableCell>
                  <TableCell>
                    <Badge variant={
                      invoice.status === 'paid' ? 'default' : 
                      invoice.status === 'overdue' ? 'destructive' : 'secondary'
                    }>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {invoice.status !== 'paid' && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkPaid(invoice.id)}>
                        Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                    No invoices found.
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
