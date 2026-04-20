import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function Memberships() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('plans').select('*');
      if (error) {
        toast.error(error.message);
      } else {
        setPlans(data || []);
      }
      setIsLoading(false);
    };
    if (user?.tenantId) fetchPlans();
  }, [user]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Memberships</h1>
          <p className="text-slate-500">Manage subscription plans.</p>
        </div>
        <Button>Create Plan</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map(plan => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">${plan.pricing}<span className="text-sm font-normal text-slate-500">/mo</span></div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center">
                  <span className="mr-2">✓</span> {plan.room_credits} room credits/mo
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Access: {plan.access_hours}
                </li>
              </ul>
              <Button variant="outline" className="w-full">Edit Plan</Button>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && (
          <p className="text-slate-500 col-span-3 text-center py-8">No plans created yet.</p>
        )}
      </div>
    </div>
  );
}
