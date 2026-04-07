import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'superuser';
}

interface AuthState {
  user: User | null;
  tenantSlug: string | null;
  login: (user: User, tenantSlug: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenantSlug: null,
      login: (user, tenantSlug) => set({ user, tenantSlug }),
      logout: () => set({ user: null, tenantSlug: null }),
    }),
    {
      name: 'spacedesk-auth',
    }
  )
);
