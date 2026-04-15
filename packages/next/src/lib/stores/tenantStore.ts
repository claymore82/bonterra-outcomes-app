import { create } from 'zustand';
import { Tenant } from '@/types/poc';

// Mock tenants for POC
const mockTenants: Tenant[] = [
  {
    id: 'TENANT-001',
    name: 'Seattle Housing Coalition',
    slug: 'seattle-housing',
    status: 'active',
    subscriptionTier: 'professional',
    settings: {
      timezone: 'America/Los_Angeles',
      locale: 'en-US',
      dateFormat: 'MM/DD/YYYY',
      enableHMIS: true,
      enableBilling: false,
    },
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
  },
  {
    id: 'TENANT-002',
    name: 'Portland Community Services',
    slug: 'portland-services',
    status: 'active',
    subscriptionTier: 'enterprise',
    settings: {
      timezone: 'America/Los_Angeles',
      locale: 'en-US',
      dateFormat: 'MM/DD/YYYY',
      enableHMIS: true,
      enableBilling: true,
    },
    createdAt: new Date('2022-08-10'),
    updatedAt: new Date('2022-08-10'),
  },
  {
    id: 'TENANT-003',
    name: 'Demo Organization',
    slug: 'demo-org',
    status: 'trial',
    subscriptionTier: 'starter',
    settings: {
      timezone: 'America/New_York',
      locale: 'en-US',
      dateFormat: 'MM/DD/YYYY',
      enableHMIS: false,
      enableBilling: false,
    },
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01'),
  },
];

interface TenantStore {
  tenants: Tenant[];

  // Read operations
  getTenant: (id: string) => Tenant | undefined;
  getTenantBySlug: (slug: string) => Tenant | undefined;
  getActiveTenants: () => Tenant[];

  // Write operations
  createTenant: (
    tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Tenant;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
}

export const useTenantStore = create<TenantStore>((set, get) => ({
  tenants: mockTenants,

  getTenant: (id: string) => {
    return get().tenants.find((t) => t.id === id);
  },

  getTenantBySlug: (slug: string) => {
    return get().tenants.find((t) => t.slug === slug);
  },

  getActiveTenants: () => {
    return get().tenants.filter(
      (t) => t.status === 'active' || t.status === 'trial',
    );
  },

  createTenant: (tenantData) => {
    const newTenant: Tenant = {
      ...tenantData,
      id: `TENANT-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      tenants: [...state.tenants, newTenant],
    }));

    return newTenant;
  },

  updateTenant: (id, updates) => {
    set((state) => ({
      tenants: state.tenants.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t,
      ),
    }));
  },

  deleteTenant: (id) => {
    set((state) => ({
      tenants: state.tenants.filter((t) => t.id !== id),
    }));
  },
}));
