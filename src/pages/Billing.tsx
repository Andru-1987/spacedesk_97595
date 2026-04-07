import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { mockService } from '../lib/mockService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function Billing() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  
  const [invoices, setInvoices] = useState(mockService.getInvoices(tenantId));
  const members = mockService.getUsers(tenantId).filter(u => u.role === 'member');
  
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = invoices.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const membersInArrears = new Set(invoices.filter(i => i.status === 'overdue').map(i => i.userId)).size;

  const handleMarkPaid = (id: string) => {
    const updated = mockService.updateInvoiceStatus(id, 'paid');
    if (updated) {
      setInvoices(invoices.map(i => i.id === id ? updated : i));
      toast.success('Invoice marked as paid');
    }
  };

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
              {invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((invoice) => {
                const member = members.find(m => m.id === invoice.userId);
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="font-medium">{member?.name || 'Unknown'}</TableCell>
                    <TableCell>${invoice.amount}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
