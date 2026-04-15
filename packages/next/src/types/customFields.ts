export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'multi-select'
  | 'checkbox'
  | 'textarea'
  | 'phone'
  | 'email'
  | 'ssn';

export type FieldAppliesTo = 'individual' | 'household' | 'entity' | 'all';

export type DemographicProfile =
  | 'hmis'
  | 'workforce'
  | 'healthcare'
  | 'general'
  | 'custom';

export const PROFILE_LABELS: Record<DemographicProfile, string> = {
  hmis: 'HMIS',
  workforce: 'Workforce Development',
  healthcare: 'Healthcare/HIPAA',
  general: 'General Nonprofit',
  custom: 'Custom',
};

export const PROFILE_DESCRIPTIONS: Record<DemographicProfile, string> = {
  hmis: 'HUD HMIS Data Standards - numeric codes, specific terminology',
  workforce: 'WIOA/Workforce Innovation standards - employment-focused',
  healthcare: 'HIPAA-compliant healthcare standards',
  general: 'General nonprofit/social services - flexible and inclusive',
  custom: 'Organization-specific custom fields',
};

export interface CustomFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface CustomField {
  id: string;
  name: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  options?: string[]; // for dropdown/multi-select
  validation?: CustomFieldValidation;
  helpText?: string;
  defaultValue?: any;
  visibleInIntake: boolean;
  visibleInProfile: boolean;
  programSpecific: boolean; // if true, only collect for specific programs
  programIds?: string[]; // which programs use this field
  hmisCompliant: boolean; // is this an HMIS standard field?

  // NEW: Who does this field apply to?
  appliesTo: FieldAppliesTo; // individual, household, entity, or all

  // NEW: Profile/vertical tags (Option A - lightweight approach)
  profiles?: DemographicProfile[]; // e.g., ['hmis', 'workforce'] - field follows these standards
  synonyms?: string[]; // e.g., ["Gender Identity", "Sex"] - alternative names

  order: number; // for display ordering
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomFieldTemplate {
  name: string;
  label: string;
  fieldType: FieldType;
  description: string;
  required: boolean;
  options?: string[];
  validation?: CustomFieldValidation;
  helpText?: string;
  hmisCompliant: boolean;
  category:
    | 'demographics'
    | 'contact'
    | 'housing'
    | 'income'
    | 'health'
    | 'hmis'
    | 'other';

  // NEW
  appliesTo: FieldAppliesTo;
  profiles?: DemographicProfile[];
  synonyms?: string[];
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  dropdown: 'Dropdown',
  'multi-select': 'Multi-Select',
  checkbox: 'Checkbox',
  textarea: 'Text Area',
  phone: 'Phone Number',
  email: 'Email',
  ssn: 'SSN (Masked)',
};
