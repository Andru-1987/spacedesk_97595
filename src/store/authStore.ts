import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

interface User {
  id: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'superuser';
}

interface AuthState {
  user: User | null;
  tenantSlug: string | null;
  setAuth: (user: User | null, tenantSlug: string | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenantSlug: null,
      setAuth: (user, tenantSlug) => {
        set({ user, tenantSlug });
        if (user) {
          trackEvent('login_success', {
            tenant_slug: tenantSlug,
            user_role: user.role,
          });
        }
      },
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, tenantSlug: null });
      },
    }),
    {
      name: 'spacedesk-auth',
    }
  )
);
