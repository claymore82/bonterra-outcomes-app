import { create } from 'zustand';
import { Household, HouseholdMember } from '@/types/household';
import { Participant } from '@/types/poc';

interface HouseholdStore {
  households: Household[];

  // CRUD Operations
  getHouseholdById: (id: string) => Household | undefined;
  createHousehold: (headOfHouseholdId: string, members: HouseholdMember[]) => Household;
  updateHousehold: (id: string, updates: Partial<Household>) => void;
  deleteHousehold: (id: string) => void;

  // Member Operations
  addMemberToHousehold: (householdId: string, member: HouseholdMember) => void;
  removeMemberFromHousehold: (householdId: string, memberId: string) => void;
  updateMember: (householdId: string, memberId: string, updates: Partial<HouseholdMember>) => void;
  setHeadOfHousehold: (householdId: string, newHeadId: string) => void;

  // Queries
  getHouseholdByParticipant: (participantId: string) => Household | undefined;
  getAllHouseholds: () => Household[];
  getHouseholdMembers: (householdId: string) => HouseholdMember[];
  isParticipantInHousehold: (participantId: string) => boolean;
}

export const useHouseholdStore = create<HouseholdStore>((set, get) => ({
  households: [],

  // CRUD Operations
  getHouseholdById: (id: string) => {
    return get().households.find(h => h.id === id);
  },

  createHousehold: (headOfHouseholdId: string, members: HouseholdMember[]) => {
    const newHousehold: Household = {
      id: `HH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      headOfHouseholdId,
      members,
      createdAt: new Date(),
    };

    set((state) => ({
      households: [...state.households, newHousehold],
    }));

    return newHousehold;
  },

  updateHousehold: (id: string, updates: Partial<Household>) => {
    set((state) => ({
      households: state.households.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    }));
  },

  deleteHousehold: (id: string) => {
    set((state) => ({
      households: state.households.filter((h) => h.id !== id),
    }));
  },

  // Member Operations
  addMemberToHousehold: (householdId: string, member: HouseholdMember) => {
    set((state) => ({
      households: state.households.map((h) =>
        h.id === householdId
          ? { ...h, members: [...h.members, member] }
          : h
      ),
    }));
  },

  removeMemberFromHousehold: (householdId: string, memberId: string) => {
    set((state) => ({
      households: state.households.map((h) =>
        h.id === householdId
          ? { ...h, members: h.members.filter(m => m.id !== memberId) }
          : h
      ),
    }));
  },

  updateMember: (householdId: string, memberId: string, updates: Partial<HouseholdMember>) => {
    set((state) => ({
      households: state.households.map((h) =>
        h.id === householdId
          ? {
              ...h,
              members: h.members.map(m =>
                m.id === memberId ? { ...m, ...updates } : m
              ),
            }
          : h
      ),
    }));
  },

  setHeadOfHousehold: (householdId: string, newHeadId: string) => {
    set((state) => ({
      households: state.households.map((h) => {
        if (h.id !== householdId) return h;

        // Update relationship for old head (if they're staying in household)
        const updatedMembers = h.members.map(m => {
          if (m.id === h.headOfHouseholdId) {
            return { ...m, relationshipToHoH: 'other' as const };
          }
          if (m.id === newHeadId) {
            return { ...m, relationshipToHoH: 'self' as const };
          }
          return m;
        });

        return {
          ...h,
          headOfHouseholdId: newHeadId,
          members: updatedMembers,
        };
      }),
    }));
  },

  // Queries
  getHouseholdByParticipant: (participantId: string) => {
    return get().households.find(h =>
      h.members.some(m => m.id === participantId) || h.headOfHouseholdId === participantId
    );
  },

  getAllHouseholds: () => {
    return get().households;
  },

  getHouseholdMembers: (householdId: string) => {
    const household = get().getHouseholdById(householdId);
    return household?.members || [];
  },

  isParticipantInHousehold: (participantId: string) => {
    return get().households.some(h =>
      h.members.some(m => m.id === participantId) || h.headOfHouseholdId === participantId
    );
  },
}));
