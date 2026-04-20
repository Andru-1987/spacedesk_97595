import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  tenantId: z.string().min(1, { message: "Please select a space" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Para que un usuario nuevo vea los coworking spaces debe tener permisos de lectura anónima sobre tenants.
    // De lo contrario, este array retornará vacio por RLS.
    const fetchTenants = async () => {
      const { data } = await supabase.from('tenants').select('id, name');
      if (data) setTenants(data);
    };
    fetchTenants();
  }, []);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      tenantId: '',
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    // Auth Signup con inyección en options.data para que el Trigger los capture y ponga en Profiles
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          tenant_id: data.tenantId,
          full_name: data.name,
          role: 'member'
        }
      }
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Registration successful! Please login.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Join SpaceDesk</CardTitle>
          <CardDescription className="text-center">
            Create an account to book spaces
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                {...register("name")}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john@example.com" 
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantId">Coworking Space</Label>
              <Select onValueChange={(value) => setValue('tenantId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={tenants.length === 0 ? "Loading spaces..." : "Select a space"} />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenantId && <p className="text-sm text-red-500">{errors.tenantId.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
            <div className="text-sm text-center text-slate-500">
              Already have an account? <Button variant="link" className="p-0" onClick={() => navigate('/login')} type="button">Login</Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
