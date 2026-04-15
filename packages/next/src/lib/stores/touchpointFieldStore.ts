import { create } from 'zustand';
import {
  TouchpointCustomField,
  TOUCHPOINT_FIELD_LIBRARY,
} from '@/types/touchpointFields';

interface TouchpointFieldStore {
  fields: TouchpointCustomField[];
  getFieldById: (id: string) => TouchpointCustomField | undefined;
  getActiveFields: () => TouchpointCustomField[];
  getFieldsByCategory: (category: string) => TouchpointCustomField[];
  getFieldsByProgram: (programId: string) => TouchpointCustomField[];
  createField: (
    field: Omit<TouchpointCustomField, 'id' | 'createdAt' | 'updatedAt'>,
  ) => TouchpointCustomField;
  updateField: (id: string, updates: Partial<TouchpointCustomField>) => void;
  deleteField: (id: string) => void;
  toggleFieldActive: (id: string) => void;
  initializeFromLibrary: () => void;
}

// Initialize with library fields
const initialFields: TouchpointCustomField[] = TOUCHPOINT_FIELD_LIBRARY.map(
  (field, index) => ({
    ...field,
    id: `field-${index + 1}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
);

export const useTouchpointFieldStore = create<TouchpointFieldStore>(
  (set, get) => ({
    fields: initialFields,

    getFieldById: (id: string) => {
      return get().fields.find((f) => f.id === id);
    },

    getActiveFields: () => {
      return get().fields.filter((f) => f.isActive);
    },

    getFieldsByCategory: (category: string) => {
      return get().fields.filter((f) => f.category === category && f.isActive);
    },

    getFieldsByProgram: (programId: string) => {
      return get().fields.filter((f) => {
        if (!f.programIds || f.programIds.length === 0) return true; // Available to all programs
        return f.programIds.includes(programId) && f.isActive;
      });
    },

    createField: (fieldData) => {
      const newField: TouchpointCustomField = {
        ...fieldData,
        id: `field-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => ({
        fields: [...state.fields, newField],
      }));

      return newField;
    },

    updateField: (id, updates) => {
      set((state) => ({
        fields: state.fields.map((field) =>
          field.id === id
            ? { ...field, ...updates, updatedAt: new Date() }
            : field,
        ),
      }));
    },

    deleteField: (id) => {
      set((state) => ({
        fields: state.fields.filter((field) => field.id !== id),
      }));
    },

    toggleFieldActive: (id) => {
      set((state) => ({
        fields: state.fields.map((field) =>
          field.id === id
            ? { ...field, isActive: !field.isActive, updatedAt: new Date() }
            : field,
        ),
      }));
    },

    initializeFromLibrary: () => {
      const libraryFields: TouchpointCustomField[] =
        TOUCHPOINT_FIELD_LIBRARY.map((field, index) => ({
          ...field,
          id: `field-${index + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

      set({ fields: libraryFields });
    },
  }),
);
