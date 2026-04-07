import mockData from '../data/mockData.json';

let data = { ...mockData };

export const mockService = {
  getTenants: () => data.tenants,
  getTenantBySlug: (slug: string) => data.tenants.find(t => t.slug === slug),
  addTenant: (tenant: any) => {
    const newTenant = { ...tenant, id: `t${Date.now()}` };
    data.tenants.push(newTenant);
    return newTenant;
  },
  updateTenant: (id: string, updates: any) => {
    const index = data.tenants.findIndex(t => t.id === id);
    if (index > -1) {
      data.tenants[index] = { ...data.tenants[index], ...updates };
      return data.tenants[index];
    }
    return null;
  },
  deleteTenant: (id: string) => {
    data.tenants = data.tenants.filter(t => t.id !== id);
  },
  
  getUsers: (tenantId: string) => data.users.filter(u => u.tenantId === tenantId),
  getUserByEmail: (email: string) => data.users.find(u => u.email === email),
  addUser: (user: any) => {
    const newUser = { ...user, id: `u${Date.now()}` };
    data.users.push(newUser);
    return newUser;
  },
  updateUser: (id: string, updates: any) => {
    const index = data.users.findIndex(u => u.id === id);
    if (index > -1) {
      data.users[index] = { ...data.users[index], ...updates };
      return data.users[index];
    }
    return null;
  },
  deleteUser: (id: string) => {
    data.users = data.users.filter(u => u.id !== id);
  },
  
  getSpaces: (tenantId: string) => data.spaces.filter(s => s.tenantId === tenantId),
  addSpace: (space: any) => {
    const newSpace = { ...space, id: `s${Date.now()}` };
    data.spaces.push(newSpace);
    return newSpace;
  },
  updateSpace: (id: string, updates: any) => {
    const index = data.spaces.findIndex(s => s.id === id);
    if (index > -1) {
      data.spaces[index] = { ...data.spaces[index], ...updates };
      return data.spaces[index];
    }
    return null;
  },
  deleteSpace: (id: string) => {
    data.spaces = data.spaces.filter(s => s.id !== id);
  },
  
  getPlans: (tenantId: string) => data.plans.filter(p => p.tenantId === tenantId),
  
  getMemberships: () => data.memberships,
  getMembershipByUser: (userId: string) => data.memberships.find(m => m.userId === userId),
  
  getReservations: (tenantId: string) => data.reservations.filter(r => r.tenantId === tenantId),
  addReservation: (reservation: any) => {
    const newReservation = { ...reservation, id: `r${Date.now()}` };
    data.reservations.push(newReservation);
    return newReservation;
  },
  
  getInvoices: (tenantId: string) => data.invoices.filter(i => i.tenantId === tenantId),
  updateInvoiceStatus: (id: string, status: string) => {
    const index = data.invoices.findIndex(i => i.id === id);
    if (index > -1) {
      data.invoices[index].status = status;
      return data.invoices[index];
    }
    return null;
  },
  
  resetData: () => {
    data = { ...mockData };
  }
};
