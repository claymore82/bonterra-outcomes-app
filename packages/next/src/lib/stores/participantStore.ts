import { create } from 'zustand';
import { Participant } from '@/types/poc';
import { mockParticipants } from '@/lib/mockData';

interface ParticipantStore {
  participants: Participant[];

  // CRUD Operations
  getParticipantById: (id: string) => Participant | undefined;
  createParticipant: (participant: Omit<Participant, 'id' | 'createdAt' | 'lastSeenAt'>) => Participant;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  deleteParticipant: (id: string) => void;

  // Queries
  getAllParticipants: () => Participant[];
  searchParticipants: (query: string) => Participant[];
  updateLastSeen: (id: string) => void;
}

export const useParticipantStore = create<ParticipantStore>((set, get) => ({
  participants: mockParticipants,

  // CRUD Operations
  getParticipantById: (id: string) => {
    return get().participants.find(p => p.id === id);
  },

  createParticipant: (participant) => {
    const newParticipant: Participant = {
      ...participant,
      id: `P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      lastSeenAt: new Date(),
    };

    set((state) => ({
      participants: [...state.participants, newParticipant],
    }));

    return newParticipant;
  },

  updateParticipant: (id, updates) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, ...updates, lastSeenAt: new Date() } : p
      ),
    }));
  },

  deleteParticipant: (id) => {
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== id),
    }));
  },

  // Queries
  getAllParticipants: () => {
    return get().participants;
  },

  searchParticipants: (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return get().participants.filter(
      (p) =>
        p.firstName.toLowerCase().includes(lowercaseQuery) ||
        p.lastName.toLowerCase().includes(lowercaseQuery) ||
        p.email?.toLowerCase().includes(lowercaseQuery) ||
        p.phoneNumber?.includes(query)
    );
  },

  updateLastSeen: (id: string) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, lastSeenAt: new Date() } : p
      ),
    }));
  },
}));
