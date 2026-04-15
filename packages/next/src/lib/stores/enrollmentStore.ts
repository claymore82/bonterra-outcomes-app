import { create } from 'zustand';
import { Enrollment, ServiceReceived, EnrollmentStatus, EnrolleeType } from '@/types/poc';
import { mockEnrollments } from '@/lib/mockData';

interface EnrollmentStore {
  enrollments: Enrollment[];

  // CRUD Operations
  getEnrollmentById: (id: string) => Enrollment | undefined;
  createEnrollment: (enrollment: Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt'>) => Enrollment;
  updateEnrollment: (id: string, updates: Partial<Enrollment>) => void;
  deleteEnrollment: (id: string) => void;

  // Query Operations - Generic (new)
  getEnrollmentsByEnrollee: (enrolleeType: EnrolleeType, enrolleeId: string) => Enrollment[];
  getActiveEnrollmentsByEnrollee: (enrolleeType: EnrolleeType, enrolleeId: string) => Enrollment[];

  // Query Operations - Legacy (backward compatibility)
  getEnrollmentsByParticipant: (participantId: string) => Enrollment[];
  getActiveEnrollments: (participantId?: string) => Enrollment[];
  getEnrollmentHistory: (participantId: string) => Enrollment[];
  getEnrollmentsByProgram: (programId: string) => Enrollment[];
  getEnrollmentsByCaseWorker: (caseWorkerId: string) => Enrollment[];
  getEnrollmentsByFamily: (familyId: string) => Enrollment[];
  getEnrollmentsByEntity: (entityId: string) => Enrollment[];

  // Enrollment Status Operations
  dismissEnrollment: (
    id: string,
    reason: string,
    outcomes?: string[],
    servicesReceived?: ServiceReceived[]
  ) => void;
  completeEnrollment: (
    id: string,
    outcomes: string[],
    servicesReceived?: ServiceReceived[]
  ) => void;
  transferEnrollment: (
    id: string,
    newProgramId: string,
    newCaseWorkerId: string,
    reason?: string
  ) => void;

  // Outcome and Services Operations
  updateEnrollmentOutcomes: (id: string, outcomes: string[]) => void;
  addServiceReceived: (id: string, service: ServiceReceived) => void;
  updateServiceReceived: (enrollmentId: string, serviceId: string, updates: Partial<ServiceReceived>) => void;
  removeServiceReceived: (enrollmentId: string, serviceId: string) => void;

  // Utility
  isEnrollmentActive: (id: string) => boolean;
  getEnrollmentDuration: (id: string) => number | null; // returns days, null if active
}

export const useEnrollmentStore = create<EnrollmentStore>((set, get) => ({
  enrollments: mockEnrollments,

  // CRUD Operations
  getEnrollmentById: (id: string) => {
    return get().enrollments.find(e => e.id === id);
  },

  createEnrollment: (enrollment) => {
    const newEnrollment: Enrollment = {
      ...enrollment,
      id: `ENR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      enrollments: [...state.enrollments, newEnrollment],
    }));

    return newEnrollment;
  },

  updateEnrollment: (id, updates) => {
    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
      ),
    }));
  },

  deleteEnrollment: (id) => {
    set((state) => ({
      enrollments: state.enrollments.filter((e) => e.id !== id),
    }));
  },

  // Query Operations - Generic (new)
  getEnrollmentsByEnrollee: (enrolleeType: EnrolleeType, enrolleeId: string) => {
    return get().enrollments.filter(e =>
      e.enrolleeType === enrolleeType && e.enrolleeId === enrolleeId
    );
  },

  getActiveEnrollmentsByEnrollee: (enrolleeType: EnrolleeType, enrolleeId: string) => {
    return get().enrollments.filter(e =>
      e.enrolleeType === enrolleeType &&
      e.enrolleeId === enrolleeId &&
      e.status === 'active' &&
      e.endDate === null
    );
  },

  // Query Operations - Legacy (backward compatibility)
  getEnrollmentsByParticipant: (participantId: string) => {
    return get().enrollments.filter(e =>
      (e.enrolleeType === 'participant' && e.enrolleeId === participantId) ||
      e.participantId === participantId // Legacy support
    );
  },

  getEnrollmentsByFamily: (familyId: string) => {
    return get().enrollments.filter(e =>
      (e.enrolleeType === 'family' && e.enrolleeId === familyId) ||
      e.householdId === familyId // Legacy support
    );
  },

  getEnrollmentsByEntity: (entityId: string) => {
    return get().enrollments.filter(e =>
      e.enrolleeType === 'entity' && e.enrolleeId === entityId
    );
  },

  getActiveEnrollments: (participantId?: string) => {
    const enrollments = get().enrollments.filter(e => e.status === 'active' && e.endDate === null);
    if (participantId) {
      return enrollments.filter(e =>
        (e.enrolleeType === 'participant' && e.enrolleeId === participantId) ||
        e.participantId === participantId // Legacy support
      );
    }
    return enrollments;
  },

  getEnrollmentHistory: (participantId: string) => {
    return get().enrollments
      .filter(e => e.participantId === participantId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  },

  getEnrollmentsByProgram: (programId: string) => {
    return get().enrollments.filter(e => e.programId === programId);
  },

  getEnrollmentsByCaseWorker: (caseWorkerId: string) => {
    return get().enrollments.filter(e => e.caseWorkerId === caseWorkerId);
  },

  // Enrollment Status Operations
  dismissEnrollment: (id, reason, outcomes = [], servicesReceived = []) => {
    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'dismissed' as EnrollmentStatus,
              endDate: new Date(),
              dismissalReason: reason,
              outcomes: [...e.outcomes, ...outcomes],
              servicesReceived: [...e.servicesReceived, ...servicesReceived],
              updatedAt: new Date(),
            }
          : e
      ),
    }));
  },

  completeEnrollment: (id, outcomes, servicesReceived = []) => {
    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'completed' as EnrollmentStatus,
              endDate: new Date(),
              outcomes: [...e.outcomes, ...outcomes],
              servicesReceived: [...e.servicesReceived, ...servicesReceived],
              updatedAt: new Date(),
            }
          : e
      ),
    }));
  },

  transferEnrollment: (id, newProgramId, newCaseWorkerId, reason) => {
    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'transferred' as EnrollmentStatus,
              endDate: new Date(),
              dismissalReason: reason,
              updatedAt: new Date(),
            }
          : e
      ),
    }));

    // Create new enrollment in the new program
    const oldEnrollment = get().getEnrollmentById(id);
    if (oldEnrollment) {
      get().createEnrollment({
        tenantId: oldEnrollment.tenantId,
        enrolleeType: oldEnrollment.enrolleeType,
        enrolleeId: oldEnrollment.enrolleeId,
        participantId: oldEnrollment.participantId, // Legacy support
        programId: newProgramId,
        siteId: oldEnrollment.siteId,
        caseWorkerId: newCaseWorkerId,
        startDate: new Date(),
        endDate: null,
        status: 'active',
        outcomes: [],
        servicesReceived: [],
        outcomeGoals: oldEnrollment.outcomeGoals,
        notes: reason ? `Transferred from previous program. Reason: ${reason}` : 'Transferred from previous program',
      });
    }
  },

  // Outcome and Services Operations
  updateEnrollmentOutcomes: (id, outcomes) => {
    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.id === id ? { ...e, outcomes, updatedAt: new Date() } : e
      ),
    }));
  },

  addServiceReceived: (id, service) => {
    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.id === id
          ? {
              ...e,
              servicesReceived: [...e.servicesReceived, service],
              updatedAt: new Date(),
            }
          : e
      ),
    }));
  },

  updateServiceReceived: (enrollmentId, serviceId, updates) => {
    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.id === enrollmentId
          ? {
              ...e,
              servicesReceived: e.servicesReceived.map((s) =>
                s.id === serviceId ? { ...s, ...updates } : s
              ),
              updatedAt: new Date(),
            }
          : e
      ),
    }));
  },

  removeServiceReceived: (enrollmentId, serviceId) => {
    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.id === enrollmentId
          ? {
              ...e,
              servicesReceived: e.servicesReceived.filter((s) => s.id !== serviceId),
              updatedAt: new Date(),
            }
          : e
      ),
    }));
  },

  // Utility
  isEnrollmentActive: (id) => {
    const enrollment = get().getEnrollmentById(id);
    return enrollment ? enrollment.status === 'active' && enrollment.endDate === null : false;
  },

  getEnrollmentDuration: (id) => {
    const enrollment = get().getEnrollmentById(id);
    if (!enrollment) return null;

    const endDate = enrollment.endDate || new Date();
    const startDate = enrollment.startDate;

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  },
}));
