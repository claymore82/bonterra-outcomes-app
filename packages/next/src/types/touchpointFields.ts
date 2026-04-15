export type TouchpointFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'multi-select'
  | 'checkbox'
  | 'scale'; // 1-5 or 1-10 rating

export type TouchpointFieldCategory =
  | 'housing'
  | 'employment'
  | 'health'
  | 'education'
  | 'financial'
  | 'safety'
  | 'legal'
  | 'family'
  | 'general';

export interface TouchpointFieldTrigger {
  keywords: string[]; // Keywords that trigger this field (e.g., "housing", "apartment", "homeless")
  required: boolean; // If triggered, is it required?
  autoPopulate?: boolean; // Should AI try to auto-populate this field?
}

export interface TouchpointCustomField {
  id: string;
  name: string;
  fieldType: TouchpointFieldType;
  category: TouchpointFieldCategory;
  description?: string;
  helpText?: string;
  options?: string[]; // For dropdown/multi-select
  min?: number; // For number/scale
  max?: number; // For number/scale
  trigger: TouchpointFieldTrigger;
  isActive: boolean;
  programIds?: string[]; // Limit to specific programs
  createdAt: Date;
  updatedAt: Date;
}

export interface TouchpointFieldValue {
  fieldId: string;
  fieldName: string;
  value: any;
  confidence?: number; // 0-1, how confident AI is in this value
  source: 'manual' | 'ai-suggested' | 'ai-confirmed'; // How was this value set?
}

export interface TouchpointFieldSuggestion {
  field: TouchpointCustomField;
  suggestedValue: any;
  confidence: number;
  extractedFrom: string; // The part of the note this was extracted from
}

export const TOUCHPOINT_FIELD_LIBRARY: Omit<TouchpointCustomField, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Housing Status',
    fieldType: 'dropdown',
    category: 'housing',
    description: 'Current housing situation',
    options: [
      'Homeless - Street',
      'Homeless - Shelter',
      'Transitional Housing',
      'Permanent Housing',
      'Staying with Friends/Family',
      'Other'
    ],
    trigger: {
      keywords: ['housing', 'apartment', 'house', 'shelter', 'homeless', 'lease', 'rent', 'eviction', 'place to stay'],
      required: true,
      autoPopulate: true,
    },
    isActive: true,
  },
  {
    name: 'Employment Status',
    fieldType: 'dropdown',
    category: 'employment',
    description: 'Current employment situation',
    options: [
      'Employed Full-Time',
      'Employed Part-Time',
      'Unemployed - Looking',
      'Unemployed - Not Looking',
      'Disabled',
      'Retired',
      'Student'
    ],
    trigger: {
      keywords: ['job', 'work', 'employed', 'unemployed', 'hired', 'fired', 'quit', 'career', 'resume', 'interview'],
      required: true,
      autoPopulate: true,
    },
    isActive: true,
  },
  {
    name: 'Income Amount',
    fieldType: 'number',
    category: 'financial',
    description: 'Monthly income in dollars',
    min: 0,
    trigger: {
      keywords: ['income', 'salary', 'wages', 'pay', 'earn', 'making', 'per hour', 'per month'],
      required: false,
      autoPopulate: true,
    },
    isActive: true,
  },
  {
    name: 'Health Concern',
    fieldType: 'multi-select',
    category: 'health',
    description: 'Health issues mentioned',
    options: [
      'Mental Health',
      'Substance Use',
      'Chronic Illness',
      'Disability',
      'Medication Needed',
      'Medical Appointment Needed',
      'Emergency Medical',
      'None'
    ],
    trigger: {
      keywords: ['health', 'doctor', 'medical', 'medication', 'sick', 'mental', 'depression', 'anxiety', 'substance', 'drugs', 'alcohol'],
      required: false,
      autoPopulate: true,
    },
    isActive: true,
  },
  {
    name: 'Risk Level',
    fieldType: 'scale',
    category: 'safety',
    description: 'Overall risk assessment (1=Low, 5=Critical)',
    min: 1,
    max: 5,
    trigger: {
      keywords: ['risk', 'danger', 'unsafe', 'threat', 'violence', 'abuse', 'emergency', 'crisis', 'urgent'],
      required: true,
      autoPopulate: true,
    },
    isActive: true,
  },
  {
    name: 'Safety Concern',
    fieldType: 'multi-select',
    category: 'safety',
    description: 'Safety issues identified',
    options: [
      'Domestic Violence',
      'Child Safety',
      'Elder Abuse',
      'Self Harm Risk',
      'Unsafe Housing',
      'Neighborhood Violence',
      'None'
    ],
    trigger: {
      keywords: ['safety', 'violence', 'abuse', 'dangerous', 'afraid', 'hurt', 'threatened'],
      required: false,
      autoPopulate: true,
    },
    isActive: true,
  },
  {
    name: 'Child Care Need',
    fieldType: 'checkbox',
    category: 'family',
    description: 'Does participant need child care support?',
    trigger: {
      keywords: ['child care', 'daycare', 'babysitter', 'kids', 'children', 'school'],
      required: false,
      autoPopulate: true,
    },
    isActive: true,
  },
  {
    name: 'Transportation Need',
    fieldType: 'checkbox',
    category: 'general',
    description: 'Does participant need transportation support?',
    trigger: {
      keywords: ['transportation', 'bus', 'car', 'ride', 'gas', 'fare', 'transit', 'get around'],
      required: false,
      autoPopulate: true,
    },
    isActive: true,
  },
  {
    name: 'Education Goal',
    fieldType: 'dropdown',
    category: 'education',
    description: 'Educational goal or status',
    options: [
      'Complete High School/GED',
      'Vocational Training',
      'Associate Degree',
      'Bachelor Degree',
      'Graduate Degree',
      'ESL/English Classes',
      'Not Pursuing Education'
    ],
    trigger: {
      keywords: ['education', 'school', 'GED', 'college', 'degree', 'training', 'class', 'study', 'learn'],
      required: false,
      autoPopulate: true,
    },
    isActive: true,
  },
  {
    name: 'Legal Issue',
    fieldType: 'multi-select',
    category: 'legal',
    description: 'Legal issues mentioned',
    options: [
      'Criminal Record',
      'Court Date',
      'Probation/Parole',
      'Custody Issue',
      'Eviction',
      'Immigration',
      'Identity Documents',
      'None'
    ],
    trigger: {
      keywords: ['legal', 'court', 'lawyer', 'attorney', 'criminal', 'arrest', 'probation', 'custody', 'immigration'],
      required: false,
      autoPopulate: true,
    },
    isActive: true,
  },
];
