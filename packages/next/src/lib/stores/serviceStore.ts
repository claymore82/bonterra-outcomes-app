import { create } from 'zustand';
import { ServiceType, ServiceTransaction } from '@/types/services';
import {
  mockServiceTypes,
  mockServiceTransactions,
} from '@/lib/mockServiceData';

interface ServiceStats {
  totalCost: number;
  totalQuantity: number;
  serviceCount: number;
  byServiceType: Record<
    string,
    { quantity: number; cost: number; count: number }
  >;
  byCategory: Record<string, { quantity: number; cost: number; count: number }>;
}

interface ServiceStore {
  serviceTypes: ServiceType[];
  serviceTransactions: ServiceTransaction[];

  // Service Type CRUD
  getServiceTypeById: (id: string) => ServiceType | undefined;
  createServiceType: (
    serviceType: Omit<ServiceType, 'id' | 'createdAt' | 'updatedAt'>,
  ) => ServiceType;
  updateServiceType: (id: string, updates: Partial<ServiceType>) => void;
  deleteServiceType: (id: string) => void;

  // Service Type Queries
  getServiceTypesByProgram: (programId: string) => ServiceType[];
  getServiceTypesByCategory: (category: string) => ServiceType[];
  getActiveServiceTypes: () => ServiceType[];

  // Service Transaction CRUD
  getServiceTransactionById: (id: string) => ServiceTransaction | undefined;
  createServiceTransaction: (
    transaction: Omit<ServiceTransaction, 'id' | 'createdAt' | 'updatedAt'>,
  ) => ServiceTransaction;
  updateServiceTransaction: (
    id: string,
    updates: Partial<ServiceTransaction>,
  ) => void;
  deleteServiceTransaction: (id: string) => void;

  // Service Transaction Queries
  getTransactionsByEnrollment: (enrollmentId: string) => ServiceTransaction[];
  getTransactionsByParticipant: (participantId: string) => ServiceTransaction[];
  getTransactionsByServiceType: (serviceTypeId: string) => ServiceTransaction[];
  getTransactionsByCaseWorker: (caseWorkerId: string) => ServiceTransaction[];
  getTransactionsByDateRange: (
    startDate: Date,
    endDate: Date,
  ) => ServiceTransaction[];

  // Service Statistics
  calculateServiceStats: (filters?: {
    participantId?: string;
    enrollmentId?: string;
    programId?: string;
    serviceTypeId?: string;
    startDate?: Date;
    endDate?: Date;
  }) => ServiceStats;

  // Bulk Operations
  bulkCreateServiceTypes: (
    serviceTypes: Omit<ServiceType, 'id' | 'createdAt' | 'updatedAt'>[],
  ) => void;
  assignServiceTypeToPrograms: (
    serviceTypeId: string,
    programIds: string[],
  ) => void;

  // Utility
  getServiceTypesForProgram: (programId: string) => ServiceType[];

  // Fund Management
  calculateProgramSpending: (programId: string) => number;
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  serviceTypes: mockServiceTypes,
  serviceTransactions: mockServiceTransactions,

  // Service Type CRUD
  getServiceTypeById: (id: string) => {
    return get().serviceTypes.find((st) => st.id === id);
  },

  createServiceType: (serviceType) => {
    const newServiceType: ServiceType = {
      ...serviceType,
      id: `SVC-TYPE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      serviceTypes: [...state.serviceTypes, newServiceType],
    }));

    return newServiceType;
  },

  updateServiceType: (id, updates) => {
    set((state) => ({
      serviceTypes: state.serviceTypes.map((st) =>
        st.id === id ? { ...st, ...updates, updatedAt: new Date() } : st,
      ),
    }));
  },

  deleteServiceType: (id) => {
    set((state) => ({
      serviceTypes: state.serviceTypes.filter((st) => st.id !== id),
    }));
  },

  // Service Type Queries
  getServiceTypesByProgram: (programId: string) => {
    return get().serviceTypes.filter((st) => st.programs.includes(programId));
  },

  getServiceTypesByCategory: (category: string) => {
    return get().serviceTypes.filter((st) => st.category === category);
  },

  getActiveServiceTypes: () => {
    return get().serviceTypes.filter((st) => st.active);
  },

  // Service Transaction CRUD
  getServiceTransactionById: (id: string) => {
    return get().serviceTransactions.find((t) => t.id === id);
  },

  createServiceTransaction: (transaction) => {
    const serviceType = get().getServiceTypeById(transaction.serviceTypeId);
    const totalCost =
      transaction.totalCost ??
      (serviceType?.costPerUnit
        ? transaction.quantity * serviceType.costPerUnit
        : undefined);

    const newTransaction: ServiceTransaction = {
      ...transaction,
      id: `SVC-TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      totalCost,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      serviceTransactions: [...state.serviceTransactions, newTransaction],
    }));

    return newTransaction;
  },

  updateServiceTransaction: (id, updates) => {
    set((state) => ({
      serviceTransactions: state.serviceTransactions.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t,
      ),
    }));
  },

  deleteServiceTransaction: (id) => {
    set((state) => ({
      serviceTransactions: state.serviceTransactions.filter((t) => t.id !== id),
    }));
  },

  // Service Transaction Queries
  getTransactionsByEnrollment: (enrollmentId: string) => {
    return get().serviceTransactions.filter(
      (t) => t.enrollmentId === enrollmentId,
    );
  },

  getTransactionsByParticipant: (participantId: string) => {
    return get().serviceTransactions.filter(
      (t) => t.participantId === participantId,
    );
  },

  getTransactionsByServiceType: (serviceTypeId: string) => {
    return get().serviceTransactions.filter(
      (t) => t.serviceTypeId === serviceTypeId,
    );
  },

  getTransactionsByCaseWorker: (caseWorkerId: string) => {
    return get().serviceTransactions.filter(
      (t) => t.providedBy === caseWorkerId,
    );
  },

  getTransactionsByDateRange: (startDate: Date, endDate: Date) => {
    return get().serviceTransactions.filter((t) => {
      const serviceDate = new Date(t.serviceDate);
      return serviceDate >= startDate && serviceDate <= endDate;
    });
  },

  // Service Statistics
  calculateServiceStats: (filters = {}) => {
    let transactions = get().serviceTransactions;

    // Apply filters
    if (filters.participantId) {
      transactions = transactions.filter(
        (t) => t.participantId === filters.participantId,
      );
    }
    if (filters.enrollmentId) {
      transactions = transactions.filter(
        (t) => t.enrollmentId === filters.enrollmentId,
      );
    }
    if (filters.serviceTypeId) {
      transactions = transactions.filter(
        (t) => t.serviceTypeId === filters.serviceTypeId,
      );
    }
    if (filters.startDate && filters.endDate) {
      transactions = transactions.filter((t) => {
        const serviceDate = new Date(t.serviceDate);
        return (
          serviceDate >= filters.startDate! && serviceDate <= filters.endDate!
        );
      });
    }

    // Calculate stats
    const stats: ServiceStats = {
      totalCost: 0,
      totalQuantity: 0,
      serviceCount: transactions.length,
      byServiceType: {},
      byCategory: {},
    };

    const serviceTypes = get().serviceTypes;

    transactions.forEach((transaction) => {
      const serviceType = serviceTypes.find(
        (st) => st.id === transaction.serviceTypeId,
      );

      // Total cost and quantity
      stats.totalCost += transaction.totalCost || 0;
      stats.totalQuantity += transaction.quantity;

      // By service type
      if (!stats.byServiceType[transaction.serviceTypeId]) {
        stats.byServiceType[transaction.serviceTypeId] = {
          quantity: 0,
          cost: 0,
          count: 0,
        };
      }
      stats.byServiceType[transaction.serviceTypeId].quantity +=
        transaction.quantity;
      stats.byServiceType[transaction.serviceTypeId].cost +=
        transaction.totalCost || 0;
      stats.byServiceType[transaction.serviceTypeId].count += 1;

      // By category
      if (serviceType) {
        const category = serviceType.category;
        if (!stats.byCategory[category]) {
          stats.byCategory[category] = {
            quantity: 0,
            cost: 0,
            count: 0,
          };
        }
        stats.byCategory[category].quantity += transaction.quantity;
        stats.byCategory[category].cost += transaction.totalCost || 0;
        stats.byCategory[category].count += 1;
      }
    });

    return stats;
  },

  // Bulk Operations
  bulkCreateServiceTypes: (serviceTypes) => {
    const newServiceTypes = serviceTypes.map((st) => ({
      ...st,
      id: `SVC-TYPE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    set((state) => ({
      serviceTypes: [...state.serviceTypes, ...newServiceTypes],
    }));
  },

  assignServiceTypeToPrograms: (serviceTypeId, programIds) => {
    set((state) => ({
      serviceTypes: state.serviceTypes.map((st) =>
        st.id === serviceTypeId
          ? {
              ...st,
              programs: [...new Set([...st.programs, ...programIds])],
              updatedAt: new Date(),
            }
          : st,
      ),
    }));
  },

  // Utility
  getServiceTypesForProgram: (programId: string) => {
    return get().serviceTypes.filter(
      (st) => st.active && st.programs.includes(programId),
    );
  },

  // Fund Management
  calculateProgramSpending: (programId: string) => {
    const { serviceTransactions, serviceTypes } = get();

    // Get all service transactions for this program
    // We need to filter by enrollments that belong to this program
    const programTransactions = serviceTransactions.filter((txn) => {
      const serviceType = serviceTypes.find(
        (st) => st.id === txn.serviceTypeId,
      );
      return serviceType && serviceType.programs.includes(programId);
    });

    // Calculate total cost
    const totalSpent = programTransactions.reduce((sum, txn) => {
      return sum + (txn.totalCost || 0);
    }, 0);

    return totalSpent;
  },
}));
