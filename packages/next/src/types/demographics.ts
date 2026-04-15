// Demographics Standards and Mapping System

export type DemographicsFieldType =
  | 'single-select'
  | 'multi-select'
  | 'text'
  | 'date'
  | 'number'
  | 'boolean';

export type StandardStatus = 'active' | 'deprecated' | 'upcoming' | 'draft';

export interface DemographicsFieldOption {
  value: string;
  label: string;
  code?: string; // Official code from standard (e.g., "1" for Male in HMIS)
  description?: string;
}

export interface DemographicsFieldDefinition {
  fieldKey: string; // "race", "ethnicity", "gender", etc.
  label: string;
  fieldType: DemographicsFieldType;
  required: boolean;
  options?: DemographicsFieldOption[];
  validations?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  }[];
  helpText?: string;
}

export interface DemographicsStandard {
  id: string;
  name: string;
  version: string;
  status: StandardStatus;
  agency: string; // "HUD", "HHS", "OMB", "Department of Education"
  description: string;
  effectiveDate: Date;
  retirementDate?: Date;
  supersedes?: string; // ID of standard this replaces
  documentationUrl?: string;
  fields: DemographicsFieldDefinition[];
}

export interface TransformRule {
  [customValue: string]: string; // Maps custom value to standard code
}

export interface StandardMapping {
  standardId: string;
  standardFieldKey: string;
  transformRule?: TransformRule; // How to convert between custom and standard values
}

export interface DemographicsMapping {
  id: string;
  customFieldId: string; // Your internal field
  customFieldLabel: string;
  mappings: StandardMapping[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceStandardMapping {
  standardId: string;
  standardServiceCode: string;
  standardServiceName: string;
  standardCategory?: string;
}

export interface ProgramReportingRequirement {
  standardId: string;
  required: boolean;
  reportingFrequency: 'monthly' | 'quarterly' | 'annual' | 'as-needed';
  nextReportingDate?: Date;
}

// For exporting data in standard format
export interface StandardExportRecord {
  standardId: string;
  participantId: string;
  fields: {
    [fieldKey: string]: string | string[]; // Standard field values
  };
  mappingMetadata?: {
    customFieldId: string;
    originalValue: any;
    transformedValue: any;
  }[];
}

// Validation result for checking if participant data meets standard requirements
export interface StandardComplianceCheck {
  standardId: string;
  standardName: string;
  isCompliant: boolean;
  missingFields: string[];
  invalidFields: {
    fieldKey: string;
    issue: string;
  }[];
  coveragePercentage: number;
}
