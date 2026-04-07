import { useAuthStore } from '../store/authStore';
import { mockService } from '../lib/mockService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Memberships() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';
  
  const plans = mockService.getPlans(tenantId);

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
                  <span className="mr-2">✓</span> {plan.roomCredits} room credits/mo
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Access: {plan.accessHours}
                </li>
              </ul>
              <Button variant="outline" className="w-full">Edit Plan</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
