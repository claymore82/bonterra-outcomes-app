import { create } from 'zustand';
import {
  DemographicsStandard,
  DemographicsMapping,
  StandardComplianceCheck,
  ProgramReportingRequirement,
} from '@/types/demographics';
import {
  DEMOGRAPHICS_STANDARDS_LIBRARY,
  getStandardById,
  getActiveStandards,
} from '@/lib/demographicsStandardsLibrary';

interface DemographicsStore {
  // Available standards library
  availableStandards: DemographicsStandard[];

  // Custom field to standard mappings
  mappings: DemographicsMapping[];

  // Program reporting requirements
  programRequirements: Map<string, ProgramReportingRequirement[]>; // programId -> requirements

  // Actions
  getStandard: (standardId: string) => DemographicsStandard | undefined;
  getActiveStandards: () => DemographicsStandard[];
  getStandardsByAgency: (agency: string) => DemographicsStandard[];

  // Mapping management
  createMapping: (mapping: Omit<DemographicsMapping, 'id' | 'createdAt' | 'updatedAt'>) => DemographicsMapping;
  updateMapping: (id: string, updates: Partial<DemographicsMapping>) => void;
  deleteMapping: (id: string) => void;
  getMappingsByCustomField: (customFieldId: string) => DemographicsMapping | undefined;
  getMappingsByStandard: (standardId: string) => DemographicsMapping[];

  // Program requirements
  setProgramRequirements: (programId: string, requirements: ProgramReportingRequirement[]) => void;
  getProgramRequirements: (programId: string) => ProgramReportingRequirement[];
  addProgramRequirement: (programId: string, requirement: ProgramReportingRequirement) => void;
  removeProgramRequirement: (programId: string, standardId: string) => void;

  // Compliance checking
  checkCompliance: (
    participantData: any,
    standardId: string
  ) => StandardComplianceCheck;

  // Coverage analysis
  getMappingCoverage: (standardId: string) => {
    totalFields: number;
    mappedFields: number;
    percentage: number;
    unmappedFields: string[];
  };
}

export const useDemographicsStore = create<DemographicsStore>((set, get) => ({
  availableStandards: DEMOGRAPHICS_STANDARDS_LIBRARY,
  mappings: [],
  programRequirements: new Map(),

  getStandard: (standardId: string) => {
    return get().availableStandards.find((s) => s.id === standardId);
  },

  getActiveStandards: () => {
    return get().availableStandards.filter((s) => s.status === 'active');
  },

  getStandardsByAgency: (agency: string) => {
    return get().availableStandards.filter((s) => s.agency === agency);
  },

  createMapping: (mappingData) => {
    const newMapping: DemographicsMapping = {
      ...mappingData,
      id: `MAPPING-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      mappings: [...state.mappings, newMapping],
    }));

    return newMapping;
  },

  updateMapping: (id, updates) => {
    set((state) => ({
      mappings: state.mappings.map((m) =>
        m.id === id
          ? { ...m, ...updates, updatedAt: new Date() }
          : m
      ),
    }));
  },

  deleteMapping: (id) => {
    set((state) => ({
      mappings: state.mappings.filter((m) => m.id !== id),
    }));
  },

  getMappingsByCustomField: (customFieldId) => {
    return get().mappings.find((m) => m.customFieldId === customFieldId);
  },

  getMappingsByStandard: (standardId) => {
    return get().mappings.filter((m) =>
      m.mappings.some((mapping) => mapping.standardId === standardId)
    );
  },

  setProgramRequirements: (programId, requirements) => {
    set((state) => {
      const newMap = new Map(state.programRequirements);
      newMap.set(programId, requirements);
      return { programRequirements: newMap };
    });
  },

  getProgramRequirements: (programId) => {
    return get().programRequirements.get(programId) || [];
  },

  addProgramRequirement: (programId, requirement) => {
    const current = get().programRequirements.get(programId) || [];

    // Check if already exists
    if (current.some((r) => r.standardId === requirement.standardId)) {
      return;
    }

    set((state) => {
      const newMap = new Map(state.programRequirements);
      newMap.set(programId, [...current, requirement]);
      return { programRequirements: newMap };
    });
  },

  removeProgramRequirement: (programId, standardId) => {
    const current = get().programRequirements.get(programId) || [];

    set((state) => {
      const newMap = new Map(state.programRequirements);
      newMap.set(
        programId,
        current.filter((r) => r.standardId !== standardId)
      );
      return { programRequirements: newMap };
    });
  },

  checkCompliance: (participantData, standardId) => {
    const standard = get().getStandard(standardId);

    if (!standard) {
      return {
        standardId,
        standardName: 'Unknown',
        isCompliant: false,
        missingFields: [],
        invalidFields: [],
        coveragePercentage: 0,
      };
    }

    const requiredFields = standard.fields.filter((f) => f.required);
    const missingFields: string[] = [];
    const invalidFields: { fieldKey: string; issue: string }[] = [];

    // Check required fields
    for (const field of requiredFields) {
      const value = participantData[field.fieldKey];

      if (value === undefined || value === null || value === '') {
        missingFields.push(field.fieldKey);
        continue;
      }

      // Validate against options if single/multi-select
      if (field.fieldType === 'single-select' && field.options) {
        const validValues = field.options.map((o) => o.value);
        if (!validValues.includes(value)) {
          invalidFields.push({
            fieldKey: field.fieldKey,
            issue: `Invalid value: ${value}`,
          });
        }
      }

      if (field.fieldType === 'multi-select' && field.options) {
        const validValues = field.options.map((o) => o.value);
        const values = Array.isArray(value) ? value : [value];
        for (const v of values) {
          if (!validValues.includes(v)) {
            invalidFields.push({
              fieldKey: field.fieldKey,
              issue: `Invalid value in array: ${v}`,
            });
          }
        }
      }
    }

    const totalRequired = requiredFields.length;
    const completeFields = totalRequired - missingFields.length - invalidFields.length;
    const coveragePercentage = totalRequired > 0
      ? Math.round((completeFields / totalRequired) * 100)
      : 100;

    return {
      standardId,
      standardName: standard.name,
      isCompliant: missingFields.length === 0 && invalidFields.length === 0,
      missingFields,
      invalidFields,
      coveragePercentage,
    };
  },

  getMappingCoverage: (standardId) => {
    const standard = get().getStandard(standardId);

    if (!standard) {
      return {
        totalFields: 0,
        mappedFields: 0,
        percentage: 0,
        unmappedFields: [],
      };
    }

    const totalFields = standard.fields.length;
    const mappings = get().getMappingsByStandard(standardId);

    // Get all standard field keys that have mappings
    const mappedFieldKeys = new Set<string>();
    for (const mapping of mappings) {
      for (const m of mapping.mappings) {
        if (m.standardId === standardId) {
          mappedFieldKeys.add(m.standardFieldKey);
        }
      }
    }

    const mappedFields = mappedFieldKeys.size;
    const percentage = totalFields > 0
      ? Math.round((mappedFields / totalFields) * 100)
      : 0;

    const unmappedFields = standard.fields
      .filter((f) => !mappedFieldKeys.has(f.fieldKey))
      .map((f) => f.fieldKey);

    return {
      totalFields,
      mappedFields,
      percentage,
      unmappedFields,
    };
  },
}));
