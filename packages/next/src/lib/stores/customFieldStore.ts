import { create } from 'zustand';
import { CustomField } from '@/types/customFields';
import { mockCustomFields } from '@/lib/mockData';

interface CustomFieldStore {
  customFields: CustomField[];
  addCustomField: (field: Omit<CustomField, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateCustomField: (id: string, field: Partial<CustomField>) => void;
  deleteCustomField: (id: string) => void;
  getCustomField: (id: string) => CustomField | undefined;
  getFieldsByProgram: (programId: string) => CustomField[];
  getRequiredFields: () => CustomField[];
  getIntakeFields: () => CustomField[];
  getProfileFields: () => CustomField[];
  reorderFields: (fieldIds: string[]) => void;
}

export const useCustomFieldStore = create<CustomFieldStore>((set, get) => ({
  customFields: mockCustomFields,

  addCustomField: (field) => {
    const now = new Date();
    const existingFields = get().customFields;
    const maxOrder = existingFields.length > 0 ? Math.max(...existingFields.map((f) => f.order)) : 0;

    const newField: CustomField = {
      ...field,
      id: `CF-${Date.now()}`,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      customFields: [...state.customFields, newField],
    }));
  },

  updateCustomField: (id, updates) => {
    set((state) => ({
      customFields: state.customFields.map((field) =>
        field.id === id
          ? { ...field, ...updates, updatedAt: new Date() }
          : field
      ),
    }));
  },

  deleteCustomField: (id) => {
    set((state) => ({
      customFields: state.customFields.filter((field) => field.id !== id),
    }));
  },

  getCustomField: (id) => {
    return get().customFields.find((field) => field.id === id);
  },

  getFieldsByProgram: (programId) => {
    return get().customFields.filter((field) => {
      if (!field.programSpecific) return true;
      return field.programIds?.includes(programId);
    }).sort((a, b) => a.order - b.order);
  },

  getRequiredFields: () => {
    return get().customFields.filter((field) => field.required);
  },

  getIntakeFields: () => {
    return get().customFields
      .filter((field) => field.visibleInIntake)
      .sort((a, b) => a.order - b.order);
  },

  getProfileFields: () => {
    return get().customFields
      .filter((field) => field.visibleInProfile)
      .sort((a, b) => a.order - b.order);
  },

  reorderFields: (fieldIds) => {
    set((state) => {
      const fieldsMap = new Map(state.customFields.map((f) => [f.id, f]));
      const reorderedFields = fieldIds.map((id, index) => {
        const field = fieldsMap.get(id);
        if (field) {
          return { ...field, order: index + 1, updatedAt: new Date() };
        }
        return null;
      }).filter((f): f is CustomField => f !== null);

      // Add any fields not in the reorder list at the end
      const reorderedIds = new Set(fieldIds);
      const remainingFields = state.customFields
        .filter((f) => !reorderedIds.has(f.id))
        .map((f, index) => ({ ...f, order: reorderedFields.length + index + 1 }));

      return {
        customFields: [...reorderedFields, ...remainingFields],
      };
    });
  },
}));
