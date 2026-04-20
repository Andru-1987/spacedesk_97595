import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
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
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error('Invalid credentials');
      setIsLoading(false);
      return;
    }

    if (authData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, tenant:tenants(slug)')
        .eq('id', authData.user.id)
        .single();
      
      const role = profile?.role || 'member';
      const tenantId = profile?.tenant_id || null;
      let tenantSlug = profile?.tenant?.slug || 'default';

      setAuth({
        id: authData.user.id,
        tenantId: tenantId,
        name: profile?.full_name || authData.user.email || 'User',
        email: authData.user.email || '',
        role: role as 'owner' | 'admin' | 'member' | 'superuser'
      }, tenantSlug);

      toast.success('Logged in successfully');

      if (role === 'superuser') {
        navigate('/superuser/tenants');
      } else if (['owner', 'admin'].includes(role)) {
        navigate(`/t/${tenantSlug}/dashboard`);
      } else {
        navigate(`/t/${tenantSlug}/portal`);
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">SpaceDesk</CardTitle>
          <CardDescription className="text-center">
            Enter your email to sign in to your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="developer@example.com" 
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-sm text-center text-slate-500">
              Don't have an account? <Button variant="link" className="p-0" onClick={() => navigate('/register')} type="button">Register</Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
