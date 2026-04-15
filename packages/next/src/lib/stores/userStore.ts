import { create } from 'zustand';
import { User, UserRole } from '@/types/poc';

// Initialize with mock users across different roles
const mockUsers: User[] = [
  // Case Workers
  {
    id: 'USER-001',
    tenantId: 'TENANT-001', // Seattle Housing Coalition
    uniqueKey: 'sjohnson@organization.org',
    bonterraAuthId: 'auth0|case-worker-001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sjohnson@organization.org',
    phone: '(206) 555-0100',
    role: 'case_worker',
    status: 'active',
    programIds: [], // Access to all programs
    siteIds: [], // Access to all sites
    caseWorkerProfile: {
      title: 'Case Manager',
      programIds: [], // Works with all programs
      maxCaseload: 25,
      currentCaseload: 12,
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    lastLoginAt: new Date('2026-03-28'),
  },
  {
    id: 'USER-002',
    tenantId: 'TENANT-001',
    uniqueKey: 'mchen@organization.org',
    bonterraAuthId: 'auth0|case-worker-002',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'mchen@organization.org',
    phone: '(206) 555-0101',
    role: 'case_worker',
    status: 'active',
    programIds: [],
    siteIds: [],
    caseWorkerProfile: {
      title: 'Case Manager',
      programIds: [],
      maxCaseload: 25,
      currentCaseload: 18,
    },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    lastLoginAt: new Date('2026-03-30'),
  },
  {
    id: 'USER-003',
    tenantId: 'TENANT-001',
    uniqueKey: 'erodriguez@organization.org',
    bonterraAuthId: 'auth0|case-worker-003',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'erodriguez@organization.org',
    phone: '(206) 555-0102',
    role: 'case_worker',
    status: 'active',
    programIds: [],
    siteIds: [],
    caseWorkerProfile: {
      title: 'Senior Case Manager',
      programIds: [],
      maxCaseload: 30,
      currentCaseload: 22,
    },
    createdAt: new Date('2023-08-10'),
    updatedAt: new Date('2023-08-10'),
    lastLoginAt: new Date('2026-04-01'),
  },
  {
    id: 'USER-004',
    tenantId: 'TENANT-001',
    uniqueKey: 'dwilliams@organization.org',
    bonterraAuthId: 'auth0|case-worker-004',
    firstName: 'David',
    lastName: 'Williams',
    email: 'dwilliams@organization.org',
    phone: '(206) 555-0103',
    role: 'case_worker',
    status: 'active',
    programIds: [],
    siteIds: [],
    caseWorkerProfile: {
      title: 'Case Manager',
      programIds: [],
      maxCaseload: 25,
      currentCaseload: 15,
    },
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
    lastLoginAt: new Date('2026-03-29'),
  },

  // Program Managers
  {
    id: 'USER-005',
    tenantId: 'TENANT-001',
    uniqueKey: 'jmartinez@organization.org',
    bonterraAuthId: 'auth0|program-manager-001',
    firstName: 'Jennifer',
    lastName: 'Martinez',
    email: 'jmartinez@organization.org',
    phone: '(206) 555-0200',
    role: 'program_manager',
    status: 'active',
    programIds: [],
    siteIds: [],
    createdAt: new Date('2023-05-10'),
    updatedAt: new Date('2023-05-10'),
    lastLoginAt: new Date('2026-03-31'),
  },
  {
    id: 'USER-006',
    tenantId: 'TENANT-001',
    uniqueKey: 'rthompson@organization.org',
    bonterraAuthId: 'auth0|program-manager-002',
    firstName: 'Robert',
    lastName: 'Thompson',
    email: 'rthompson@organization.org',
    phone: '(206) 555-0201',
    role: 'program_manager',
    status: 'active',
    programIds: [],
    siteIds: [],
    createdAt: new Date('2022-11-15'),
    updatedAt: new Date('2022-11-15'),
    lastLoginAt: new Date('2026-03-30'),
  },

  // Staff
  {
    id: 'USER-007',
    tenantId: 'TENANT-001',
    uniqueKey: 'landerson@organization.org',
    bonterraAuthId: 'auth0|staff-001',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'landerson@organization.org',
    phone: '(206) 555-0300',
    role: 'staff',
    status: 'active',
    programIds: [],
    siteIds: [],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    lastLoginAt: new Date('2026-03-29'),
  },

  // Super Admins (Bonterra support staff) - no tenant restriction
  {
    id: 'USER-008',
    tenantId: 'SYSTEM', // Super admins can access all tenants
    uniqueKey: 'support@bonterra.com',
    bonterraAuthId: 'auth0|super-admin-001',
    firstName: 'Admin',
    lastName: 'Support',
    email: 'support@bonterra.com',
    phone: '(800) 555-0000',
    role: 'super_admin',
    status: 'active',
    programIds: [],
    siteIds: [],
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2022-01-01'),
    lastLoginAt: new Date('2026-04-01'),
  },
];

interface UserStore {
  users: User[];
  currentUser: User | null; // Currently logged in user
  currentTenantId: string | null; // Currently active tenant
  currentProgramId: string | null; // Currently selected program for filtering
  currentSiteId: string | null; // Currently selected site for filtering

  // Read operations
  getUser: (id: string) => User | undefined;
  getUserByUniqueKey: (uniqueKey: string) => User | undefined;
  getUserByAuthId: (bonterraAuthId: string) => User | undefined;
  getUsersByRole: (role: UserRole) => User[];
  getUsersByTenant: (tenantId: string) => User[];
  getActiveUsers: () => User[];
  getCaseWorkers: () => User[]; // Helper to get all active case workers
  getCaseWorkersByProgram: (programId: string) => User[];

  // Write operations
  createUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updateCaseload: (id: string, increment: boolean) => void;

  // Authentication operations
  recordLogin: (id: string) => void;
  setCurrentUser: (user: User | null) => void;

  // Context management
  setCurrentTenant: (tenantId: string | null) => void;
  setCurrentProgram: (programId: string | null) => void;
  setCurrentSite: (siteId: string | null) => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: mockUsers,
  currentUser: mockUsers[0], // Default to Sarah Johnson (case worker) for demo
  currentTenantId: 'TENANT-001', // Default to Seattle Housing Coalition for demo
  currentProgramId: null, // null = "All Programs"
  currentSiteId: null, // null = "All Sites"

  getUser: (id: string) => {
    return get().users.find((u) => u.id === id);
  },

  getUserByUniqueKey: (uniqueKey: string) => {
    return get().users.find((u) => u.uniqueKey === uniqueKey);
  },

  getUserByAuthId: (bonterraAuthId: string) => {
    return get().users.find((u) => u.bonterraAuthId === bonterraAuthId);
  },

  getUsersByRole: (role: UserRole) => {
    return get().users.filter((u) => u.role === role && u.status === 'active');
  },

  getUsersByTenant: (tenantId: string) => {
    return get().users.filter((u) => u.tenantId === tenantId && u.status === 'active');
  },

  getActiveUsers: () => {
    const currentTenantId = get().currentTenantId;
    return get().users.filter((u) => {
      if (u.status !== 'active') return false;
      // Filter by current tenant (unless super_admin or no tenant selected)
      if (currentTenantId && u.tenantId !== currentTenantId && u.tenantId !== 'SYSTEM') {
        return false;
      }
      return true;
    });
  },

  getCaseWorkers: () => {
    const currentTenantId = get().currentTenantId;
    return get().users.filter((u) => {
      if (u.role !== 'case_worker' || u.status !== 'active') return false;
      // Filter by current tenant
      if (currentTenantId && u.tenantId !== currentTenantId) return false;
      return true;
    });
  },

  getCaseWorkersByProgram: (programId: string) => {
    return get().users.filter((u) => {
      if (u.role !== 'case_worker' || u.status !== 'active' || !u.caseWorkerProfile) {
        return false;
      }
      // If programIds is empty, case worker works with all programs
      if (u.caseWorkerProfile.programIds.length === 0) return true;
      // Otherwise, check if this program is in their list
      return u.caseWorkerProfile.programIds.includes(programId);
    });
  },

  createUser: (userData) => {
    const newUser: User = {
      ...userData,
      id: `USER-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      users: [...state.users, newUser],
    }));

    return newUser;
  },

  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id
          ? { ...u, ...updates, updatedAt: new Date() }
          : u
      ),
    }));
  },

  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    }));
  },

  updateCaseload: (id, increment) => {
    set((state) => ({
      users: state.users.map((u) => {
        if (u.id === id && u.caseWorkerProfile) {
          return {
            ...u,
            caseWorkerProfile: {
              ...u.caseWorkerProfile,
              currentCaseload: increment
                ? u.caseWorkerProfile.currentCaseload + 1
                : Math.max(0, u.caseWorkerProfile.currentCaseload - 1),
            },
            updatedAt: new Date(),
          };
        }
        return u;
      }),
    }));
  },

  recordLogin: (id) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id
          ? { ...u, lastLoginAt: new Date() }
          : u
      ),
    }));
  },

  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  setCurrentTenant: (tenantId) => {
    set({ currentTenantId: tenantId });
  },

  setCurrentProgram: (programId) => {
    set({ currentProgramId: programId });
  },

  setCurrentSite: (siteId) => {
    set({ currentSiteId: siteId });
  },
}));
