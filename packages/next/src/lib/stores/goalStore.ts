import { create } from 'zustand';
import { Goal, GoalMilestone, GoalStatus } from '@/types/assessments';
import { mockGoals } from '@/lib/mockAssessmentData';

interface GoalStore {
  goals: Goal[];

  // CRUD Operations
  getGoalById: (id: string) => Goal | undefined;
  getGoalsByEnrollment: (enrollmentId: string) => Goal[];
  getGoalsByParticipant: (participantId: string) => Goal[];
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // Milestone Operations
  addMilestone: (goalId: string, milestone: Omit<GoalMilestone, 'id'>) => void;
  updateMilestone: (
    goalId: string,
    milestoneId: string,
    updates: Partial<GoalMilestone>,
  ) => void;
  completeMilestone: (
    goalId: string,
    milestoneId: string,
    notes?: string,
  ) => void;
  deleteMilestone: (goalId: string, milestoneId: string) => void;

  // Progress Operations
  addProgressNote: (goalId: string, note: string) => void;
  updateGoalStatus: (
    goalId: string,
    status: GoalStatus,
    completedDate?: Date,
  ) => void;

  // Query Operations
  getActiveGoals: (enrollmentId: string) => Goal[];
  getCompletedGoals: (enrollmentId: string) => Goal[];
  getGoalsByCategory: (enrollmentId: string, category: string) => Goal[];
  getGoalCompletionRate: (enrollmentId: string) => number;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: mockGoals,

  // CRUD Operations
  getGoalById: (id: string) => {
    return get().goals.find((g) => g.id === id);
  },

  getGoalsByEnrollment: (enrollmentId: string) => {
    return get()
      .goals.filter((g) => g.enrollmentId === enrollmentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  getGoalsByParticipant: (participantId: string) => {
    return get()
      .goals.filter((g) => g.participantId === participantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  createGoal: (goal) => {
    const newGoal: Goal = {
      ...goal,
      id: `GOAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      goals: [...state.goals, newGoal],
    }));

    return newGoal;
  },

  updateGoal: (id, updates) => {
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === id ? { ...g, ...updates, updatedAt: new Date() } : g,
      ),
    }));
  },

  deleteGoal: (id) => {
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
  },

  // Milestone Operations
  addMilestone: (goalId, milestone) => {
    const newMilestone: GoalMilestone = {
      ...milestone,
      id: `MS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: [...g.milestones, newMilestone],
              updatedAt: new Date(),
            }
          : g,
      ),
    }));
  },

  updateMilestone: (goalId, milestoneId, updates) => {
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === milestoneId ? { ...m, ...updates } : m,
              ),
              updatedAt: new Date(),
            }
          : g,
      ),
    }));
  },

  completeMilestone: (goalId, milestoneId, notes) => {
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === milestoneId
                  ? {
                      ...m,
                      status: 'completed' as const,
                      completedDate: new Date(),
                      notes: notes || m.notes,
                    }
                  : m,
              ),
              updatedAt: new Date(),
            }
          : g,
      ),
    }));
  },

  deleteMilestone: (goalId, milestoneId) => {
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.filter((m) => m.id !== milestoneId),
              updatedAt: new Date(),
            }
          : g,
      ),
    }));
  },

  // Progress Operations
  addProgressNote: (goalId, note) => {
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              progressNotes: [...g.progressNotes, note],
              updatedAt: new Date(),
            }
          : g,
      ),
    }));
  },

  updateGoalStatus: (goalId, status, completedDate) => {
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              status,
              completedDate:
                completedDate ||
                (status === 'achieved' ? new Date() : g.completedDate),
              updatedAt: new Date(),
            }
          : g,
      ),
    }));
  },

  // Query Operations
  getActiveGoals: (enrollmentId: string) => {
    return get().goals.filter(
      (g) => g.enrollmentId === enrollmentId && g.status === 'in-progress',
    );
  },

  getCompletedGoals: (enrollmentId: string) => {
    return get().goals.filter(
      (g) =>
        g.enrollmentId === enrollmentId &&
        (g.status === 'achieved' || g.status === 'partially-achieved'),
    );
  },

  getGoalsByCategory: (enrollmentId: string, category: string) => {
    return get().goals.filter(
      (g) => g.enrollmentId === enrollmentId && g.category === category,
    );
  },

  getGoalCompletionRate: (enrollmentId: string) => {
    const goals = get().getGoalsByEnrollment(enrollmentId);
    if (goals.length === 0) return 0;

    const completed = goals.filter(
      (g) => g.status === 'achieved' || g.status === 'partially-achieved',
    ).length;

    return (completed / goals.length) * 100;
  },
}));
