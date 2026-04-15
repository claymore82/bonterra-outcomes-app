import { create } from 'zustand';
import { Touchpoint } from '@/types/poc';

// Mock touchpoints for development
const mockTouchpoints: Touchpoint[] = [];

interface TouchpointStore {
  touchpoints: Touchpoint[];

  // Read operations
  getTouchpoint: (id: string) => Touchpoint | undefined;
  getTouchpointsByEnrollment: (enrollmentId: string) => Touchpoint[];
  getTouchpointsByParticipant: (participantId: string) => Touchpoint[];
  getTouchpointsByCaseWorker: (caseWorkerId: string) => Touchpoint[];

  // Write operations
  createTouchpoint: (touchpoint: Omit<Touchpoint, 'id' | 'createdAt' | 'updatedAt'>) => Touchpoint;
  updateTouchpoint: (id: string, updates: Partial<Touchpoint>) => void;
  deleteTouchpoint: (id: string) => void;
}

export const useTouchpointStore = create<TouchpointStore>((set, get) => ({
  touchpoints: mockTouchpoints,

  // Read operations
  getTouchpoint: (id) => {
    return get().touchpoints.find((t) => t.id === id);
  },

  getTouchpointsByEnrollment: (enrollmentId) => {
    return get().touchpoints.filter((t) => t.enrollmentId === enrollmentId);
  },

  getTouchpointsByParticipant: (participantId) => {
    return get().touchpoints.filter((t) => t.participantId === participantId);
  },

  getTouchpointsByCaseWorker: (caseWorkerId) => {
    return get().touchpoints.filter((t) => t.caseWorkerId === caseWorkerId);
  },

  // Write operations
  createTouchpoint: (touchpoint) => {
    const newTouchpoint: Touchpoint = {
      ...touchpoint,
      id: `TP-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      touchpoints: [newTouchpoint, ...state.touchpoints],
    }));

    return newTouchpoint;
  },

  updateTouchpoint: (id, updates) => {
    set((state) => ({
      touchpoints: state.touchpoints.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              updatedAt: new Date(),
            }
          : t
      ),
    }));
  },

  deleteTouchpoint: (id) => {
    set((state) => ({
      touchpoints: state.touchpoints.filter((t) => t.id !== id),
    }));
  },
}));
