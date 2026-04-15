import { create } from 'zustand';
import { CaseWorker } from '@/types/poc';

// Initialize with mock case workers
const mockCaseWorkers: CaseWorker[] = [
  {
    id: 'CW-001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sjohnson@organization.org',
    phone: '(206) 555-0100',
    role: 'Case Manager',
    programIds: [], // Works with all programs
    status: 'active',
    maxCaseload: 25,
    currentCaseload: 12,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'CW-002',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'mchen@organization.org',
    phone: '(206) 555-0101',
    role: 'Case Manager',
    programIds: [], // Works with all programs
    status: 'active',
    maxCaseload: 25,
    currentCaseload: 18,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'CW-003',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'erodriguez@organization.org',
    phone: '(206) 555-0102',
    role: 'Senior Case Manager',
    programIds: [], // Works with all programs
    status: 'active',
    maxCaseload: 30,
    currentCaseload: 22,
    createdAt: new Date('2023-08-10'),
    updatedAt: new Date('2023-08-10'),
  },
  {
    id: 'CW-004',
    firstName: 'David',
    lastName: 'Williams',
    email: 'dwilliams@organization.org',
    phone: '(206) 555-0103',
    role: 'Case Manager',
    programIds: [], // Works with all programs
    status: 'active',
    maxCaseload: 25,
    currentCaseload: 15,
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
];

interface CaseWorkerStore {
  caseWorkers: CaseWorker[];
  getCaseWorker: (id: string) => CaseWorker | undefined;
  getActiveCaseWorkers: () => CaseWorker[];
  getCaseWorkersByProgram: (programId: string) => CaseWorker[];
  createCaseWorker: (
    caseWorker: Omit<
      CaseWorker,
      'id' | 'createdAt' | 'updatedAt' | 'currentCaseload'
    >,
  ) => CaseWorker;
  updateCaseWorker: (id: string, updates: Partial<CaseWorker>) => void;
  deleteCaseWorker: (id: string) => void;
  incrementCaseload: (id: string) => void;
  decrementCaseload: (id: string) => void;
}

export const useCaseWorkerStore = create<CaseWorkerStore>((set, get) => ({
  caseWorkers: mockCaseWorkers,

  getCaseWorker: (id: string) => {
    return get().caseWorkers.find((cw) => cw.id === id);
  },

  getActiveCaseWorkers: () => {
    return get().caseWorkers.filter((cw) => cw.status === 'active');
  },

  getCaseWorkersByProgram: (programId: string) => {
    return get().caseWorkers.filter((cw) => {
      // If programIds is empty, case worker works with all programs
      if (cw.programIds.length === 0) return cw.status === 'active';
      // Otherwise, check if this program is in their list
      return cw.status === 'active' && cw.programIds.includes(programId);
    });
  },

  createCaseWorker: (caseWorkerData) => {
    const newCaseWorker: CaseWorker = {
      ...caseWorkerData,
      id: `CW-${Date.now()}`,
      currentCaseload: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      caseWorkers: [...state.caseWorkers, newCaseWorker],
    }));

    return newCaseWorker;
  },

  updateCaseWorker: (id, updates) => {
    set((state) => ({
      caseWorkers: state.caseWorkers.map((cw) =>
        cw.id === id ? { ...cw, ...updates, updatedAt: new Date() } : cw,
      ),
    }));
  },

  deleteCaseWorker: (id) => {
    set((state) => ({
      caseWorkers: state.caseWorkers.filter((cw) => cw.id !== id),
    }));
  },

  incrementCaseload: (id) => {
    set((state) => ({
      caseWorkers: state.caseWorkers.map((cw) =>
        cw.id === id
          ? {
              ...cw,
              currentCaseload: (cw.currentCaseload || 0) + 1,
              updatedAt: new Date(),
            }
          : cw,
      ),
    }));
  },

  decrementCaseload: (id) => {
    set((state) => ({
      caseWorkers: state.caseWorkers.map((cw) =>
        cw.id === id
          ? {
              ...cw,
              currentCaseload: Math.max(0, (cw.currentCaseload || 0) - 1),
              updatedAt: new Date(),
            }
          : cw,
      ),
    }));
  },
}));
