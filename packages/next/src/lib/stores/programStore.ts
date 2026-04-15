import { create } from 'zustand';
import { Program } from '@/types/poc';
import { mockPrograms } from '@/lib/mockData';

interface ProgramStore {
  programs: Program[];
  addProgram: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProgram: (id: string, program: Partial<Program>) => void;
  deleteProgram: (id: string) => void;
  getProgram: (id: string) => Program | undefined;
}

export const useProgramStore = create<ProgramStore>((set, get) => ({
  programs: mockPrograms,

  addProgram: (program) => {
    const now = new Date();
    const newProgram: Program = {
      ...program,
      id: `PROG-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      programs: [...state.programs, newProgram],
    }));
  },

  updateProgram: (id, updates) => {
    set((state) => ({
      programs: state.programs.map((program) =>
        program.id === id
          ? { ...program, ...updates, updatedAt: new Date() }
          : program
      ),
    }));
  },

  deleteProgram: (id) => {
    set((state) => ({
      programs: state.programs.filter((program) => program.id !== id),
    }));
  },

  getProgram: (id) => {
    return get().programs.find((program) => program.id === id);
  },
}));
