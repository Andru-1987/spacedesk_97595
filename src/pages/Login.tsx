import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../store/authStore';
import { mockService } from '../lib/mockService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    const user = mockService.getUserByEmail(data.email);
    
    if (user && user.password === data.password) {
      if (user.role === 'superuser') {
        login(user as any, 'admin');
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/superuser/tenants');
        return;
      }

      const tenant = mockService.getTenants().find(t => t.id === user.tenantId);
      if (tenant) {
        login(user as any, tenant.slug);
        toast.success(`Welcome back, ${user.name}!`);
        if (user.role === 'member') {
          navigate(`/t/${tenant.slug}/portal`);
        } else {
          navigate(`/t/${tenant.slug}/dashboard`);
        }
      }
    } else {
      toast.error('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">SpaceDesk</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to login
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="owner@palermo.com" 
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="password123"
                {...register("password")}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <div className="text-sm text-slate-500 bg-slate-100 p-3 rounded-md">
              <p className="font-medium mb-1">Demo Credentials:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>super@spacedesk.com / password123 (SuperUser)</li>
                <li>owner@palermo.com / password123</li>
                <li>admin@palermo.com / password123</li>
                <li>member1@palermo.com / password123</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">Login</Button>
            <div className="text-sm text-center text-slate-500">
              Don't have an account? <Button variant="link" className="p-0" onClick={() => navigate('/register')}>Register</Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
