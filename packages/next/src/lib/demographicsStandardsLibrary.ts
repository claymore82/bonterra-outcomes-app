// Pre-built Demographics Standards Library
// Based on official government standards for race, ethnicity, gender, and other demographics

import { DemographicsStandard } from '@/types/demographics';

// HMIS Data Standards 2024 (Current - based on older OMB standards)
// Source: HUD HMIS Data Standards effective October 2023
export const HMIS_2024: DemographicsStandard = {
  id: 'HMIS_2024',
  name: 'HMIS Data Standards',
  version: '2024',
  status: 'active',
  agency: 'HUD',
  description: 'Current HMIS data standards for homeless services programs (based on pre-2024 OMB standards)',
  effectiveDate: new Date('2023-10-01'),
  retirementDate: new Date('2025-09-30'), // Anticipated when HMIS adopts OMB 2024
  documentationUrl: 'https://hudexchange.info/programs/hmis/hmis-data-standards/',
  fields: [
    {
      fieldKey: 'race',
      label: 'Race',
      fieldType: 'multi-select',
      required: true,
      helpText: 'Select all that apply',
      options: [
        { value: '1', label: 'American Indian, Alaska Native, or Indigenous', code: '1' },
        { value: '2', label: 'Asian or Asian American', code: '2' },
        { value: '3', label: 'Black, African American, or African', code: '3' },
        { value: '4', label: 'Native Hawaiian or Pacific Islander', code: '4' },
        { value: '5', label: 'White', code: '5' },
        { value: '8', label: 'Client doesn\'t know', code: '8' },
        { value: '9', label: 'Client prefers not to answer', code: '9' },
        { value: '99', label: 'Data not collected', code: '99' },
      ],
    },
    {
      fieldKey: 'ethnicity',
      label: 'Ethnicity',
      fieldType: 'single-select',
      required: true,
      options: [
        { value: '0', label: 'Non-Hispanic/Non-Latin(a)(o)(x)', code: '0' },
        { value: '1', label: 'Hispanic/Latin(a)(o)(x)', code: '1' },
        { value: '8', label: 'Client doesn\'t know', code: '8' },
        { value: '9', label: 'Client prefers not to answer', code: '9' },
        { value: '99', label: 'Data not collected', code: '99' },
      ],
    },
    {
      fieldKey: 'gender',
      label: 'Gender',
      fieldType: 'multi-select',
      required: true,
      helpText: 'Select all that apply',
      options: [
        { value: '0', label: 'Woman', code: '0' },
        { value: '1', label: 'Man', code: '1' },
        { value: '2', label: 'Non-Binary', code: '2' },
        { value: '3', label: 'Culturally Specific Identity', code: '3' },
        { value: '4', label: 'Transgender', code: '4' },
        { value: '5', label: 'Questioning', code: '5' },
        { value: '6', label: 'Different Identity', code: '6' },
        { value: '8', label: 'Client doesn\'t know', code: '8' },
        { value: '9', label: 'Client prefers not to answer', code: '9' },
        { value: '99', label: 'Data not collected', code: '99' },
      ],
    },
    {
      fieldKey: 'veteranStatus',
      label: 'Veteran Status',
      fieldType: 'single-select',
      required: false,
      options: [
        { value: '0', label: 'No', code: '0' },
        { value: '1', label: 'Yes', code: '1' },
        { value: '8', label: 'Client doesn\'t know', code: '8' },
        { value: '9', label: 'Client prefers not to answer', code: '9' },
        { value: '99', label: 'Data not collected', code: '99' },
      ],
    },
  ],
};

// OMB 2024 Standards (New as of March 28, 2024)
// Source: OMB Statistical Policy Directive No. 15 (Revised 2024)
export const OMB_2024: DemographicsStandard = {
  id: 'OMB_2024',
  name: 'OMB Statistical Policy Directive No. 15',
  version: '2024',
  status: 'active',
  agency: 'OMB',
  description: 'Updated federal race and ethnicity standards released March 28, 2024. Includes Middle Eastern/North African category and combined race/ethnicity question.',
  effectiveDate: new Date('2024-03-28'),
  documentationUrl: 'https://www.federalregister.gov/documents/2024/03/29/2024-06469/revisions-to-ombs-statistical-policy-directive-no-15-standards-for-maintaining-collecting-and',
  fields: [
    {
      fieldKey: 'raceEthnicity',
      label: 'Race and Ethnicity',
      fieldType: 'multi-select',
      required: true,
      helpText: 'Select all categories that apply to you (OMB 2024 combined question)',
      options: [
        {
          value: 'HISPANIC_LATINO',
          label: 'Hispanic or Latino',
          code: 'HL',
          description: 'Includes persons of Cuban, Mexican, Puerto Rican, South or Central American, or other Spanish culture or origin',
        },
        {
          value: 'AMERICAN_INDIAN_ALASKA_NATIVE',
          label: 'American Indian or Alaska Native',
          code: 'AIAN',
          description: 'A person having origins in any of the original peoples of North and South America (including Central America) and who maintains tribal affiliation or community attachment',
        },
        {
          value: 'ASIAN',
          label: 'Asian',
          code: 'A',
          description: 'A person having origins in any of the original peoples of the Far East, Southeast Asia, or the Indian subcontinent',
        },
        {
          value: 'BLACK_AFRICAN_AMERICAN',
          label: 'Black or African American',
          code: 'B',
          description: 'A person having origins in any of the Black racial groups of Africa',
        },
        {
          value: 'MIDDLE_EASTERN_NORTH_AFRICAN',
          label: 'Middle Eastern or North African',
          code: 'MENA',
          description: 'A person having origins in any of the original peoples of the Middle East or North Africa (NEW in 2024)',
        },
        {
          value: 'NATIVE_HAWAIIAN_PACIFIC_ISLANDER',
          label: 'Native Hawaiian or Pacific Islander',
          code: 'NHPI',
          description: 'A person having origins in any of the original peoples of Hawaii, Guam, Samoa, or other Pacific Islands',
        },
        {
          value: 'WHITE',
          label: 'White',
          code: 'W',
          description: 'A person having origins in any of the original peoples of Europe',
        },
      ],
    },
  ],
};

// HHS Medicaid/CHIP Demographics
export const HHS_MEDICAID: DemographicsStandard = {
  id: 'HHS_MEDICAID',
  name: 'HHS Medicaid/CHIP Demographics',
  version: '2024',
  status: 'active',
  agency: 'HHS',
  description: 'Health and Human Services demographics for Medicaid and CHIP enrollment',
  effectiveDate: new Date('2024-01-01'),
  documentationUrl: 'https://www.medicaid.gov/',
  fields: [
    {
      fieldKey: 'race',
      label: 'Race',
      fieldType: 'multi-select',
      required: true,
      options: [
        { value: 'AIAN', label: 'American Indian or Alaska Native', code: 'AIAN' },
        { value: 'A', label: 'Asian', code: 'A' },
        { value: 'B', label: 'Black or African American', code: 'B' },
        { value: 'NHPI', label: 'Native Hawaiian or Other Pacific Islander', code: 'NHPI' },
        { value: 'W', label: 'White', code: 'W' },
        { value: 'O', label: 'Other', code: 'O' },
        { value: 'U', label: 'Unknown', code: 'U' },
      ],
    },
    {
      fieldKey: 'ethnicity',
      label: 'Ethnicity',
      fieldType: 'single-select',
      required: true,
      options: [
        { value: 'H', label: 'Hispanic or Latino', code: 'H' },
        { value: 'NH', label: 'Not Hispanic or Latino', code: 'NH' },
        { value: 'U', label: 'Unknown', code: 'U' },
      ],
    },
    {
      fieldKey: 'sex',
      label: 'Sex',
      fieldType: 'single-select',
      required: true,
      options: [
        { value: 'M', label: 'Male', code: 'M' },
        { value: 'F', label: 'Female', code: 'F' },
        { value: 'U', label: 'Unknown', code: 'U' },
      ],
    },
    {
      fieldKey: 'preferredLanguage',
      label: 'Preferred Language',
      fieldType: 'single-select',
      required: false,
      options: [
        { value: 'eng', label: 'English', code: 'eng' },
        { value: 'spa', label: 'Spanish', code: 'spa' },
        { value: 'chi', label: 'Chinese', code: 'chi' },
        { value: 'vie', label: 'Vietnamese', code: 'vie' },
        { value: 'kor', label: 'Korean', code: 'kor' },
        { value: 'oth', label: 'Other', code: 'oth' },
      ],
    },
  ],
};

// Department of Education IPEDS
export const DOE_IPEDS: DemographicsStandard = {
  id: 'DOE_IPEDS',
  name: 'IPEDS (Integrated Postsecondary Education Data System)',
  version: '2024',
  status: 'active',
  agency: 'Department of Education',
  description: 'Demographics for higher education reporting',
  effectiveDate: new Date('2024-01-01'),
  documentationUrl: 'https://nces.ed.gov/ipeds/',
  fields: [
    {
      fieldKey: 'race',
      label: 'Race/Ethnicity',
      fieldType: 'single-select',
      required: true,
      helpText: 'Students may report multiple races, but only one category is recorded',
      options: [
        { value: '1', label: 'Nonresident alien', code: '1' },
        { value: '2', label: 'Hispanic/Latino', code: '2' },
        { value: '3', label: 'American Indian or Alaska Native', code: '3' },
        { value: '4', label: 'Asian', code: '4' },
        { value: '5', label: 'Black or African American', code: '5' },
        { value: '6', label: 'Native Hawaiian or Other Pacific Islander', code: '6' },
        { value: '7', label: 'White', code: '7' },
        { value: '8', label: 'Two or more races', code: '8' },
        { value: '9', label: 'Race and ethnicity unknown', code: '9' },
      ],
    },
    {
      fieldKey: 'gender',
      label: 'Gender',
      fieldType: 'single-select',
      required: true,
      options: [
        { value: 'M', label: 'Male', code: 'M' },
        { value: 'F', label: 'Female', code: 'F' },
        { value: 'NB', label: 'Non-binary', code: 'NB' },
        { value: 'U', label: 'Unknown', code: 'U' },
      ],
    },
  ],
};

// Fair Housing (HUD) Demographics
export const FAIR_HOUSING: DemographicsStandard = {
  id: 'FAIR_HOUSING',
  name: 'Fair Housing Demographics',
  version: '2024',
  status: 'active',
  agency: 'HUD',
  description: 'Demographics for fair housing and mortgage lending monitoring',
  effectiveDate: new Date('2024-01-01'),
  documentationUrl: 'https://www.hud.gov/program_offices/fair_housing_equal_opp',
  fields: [
    {
      fieldKey: 'race',
      label: 'Race',
      fieldType: 'multi-select',
      required: false,
      helpText: 'Applicant may select one or more (voluntary)',
      options: [
        { value: 'AIAN', label: 'American Indian or Alaska Native', code: 'AIAN' },
        { value: 'A', label: 'Asian', code: 'A' },
        { value: 'B', label: 'Black or African American', code: 'B' },
        { value: 'NHPI', label: 'Native Hawaiian or Other Pacific Islander', code: 'NHPI' },
        { value: 'W', label: 'White', code: 'W' },
        { value: 'DNA', label: 'I do not wish to provide this information', code: 'DNA' },
      ],
    },
    {
      fieldKey: 'ethnicity',
      label: 'Ethnicity',
      fieldType: 'single-select',
      required: false,
      options: [
        { value: 'H', label: 'Hispanic or Latino', code: 'H' },
        { value: 'NH', label: 'Not Hispanic or Latino', code: 'NH' },
        { value: 'DNA', label: 'I do not wish to provide this information', code: 'DNA' },
      ],
    },
    {
      fieldKey: 'sex',
      label: 'Sex',
      fieldType: 'single-select',
      required: false,
      options: [
        { value: 'M', label: 'Male', code: 'M' },
        { value: 'F', label: 'Female', code: 'F' },
        { value: 'DNA', label: 'I do not wish to provide this information', code: 'DNA' },
      ],
    },
  ],
};

// EEO-1 (Equal Employment Opportunity) Reporting
export const EEO_REPORTING: DemographicsStandard = {
  id: 'EEO_REPORTING',
  name: 'EEO-1 Reporting Standards',
  version: '2024',
  status: 'active',
  agency: 'EEOC',
  description: 'Demographics for Equal Employment Opportunity reporting',
  effectiveDate: new Date('2024-01-01'),
  documentationUrl: 'https://www.eeoc.gov/employers/eeo-1-data-collection',
  fields: [
    {
      fieldKey: 'race',
      label: 'Race/Ethnicity',
      fieldType: 'single-select',
      required: true,
      options: [
        { value: 'HL', label: 'Hispanic or Latino', code: 'HL' },
        { value: 'WNH', label: 'White (Not Hispanic or Latino)', code: 'WNH' },
        { value: 'BNH', label: 'Black or African American (Not Hispanic or Latino)', code: 'BNH' },
        { value: 'NHPI', label: 'Native Hawaiian or Other Pacific Islander (Not Hispanic or Latino)', code: 'NHPI' },
        { value: 'ANH', label: 'Asian (Not Hispanic or Latino)', code: 'ANH' },
        { value: 'AIAN', label: 'American Indian or Alaska Native (Not Hispanic or Latino)', code: 'AIAN' },
        { value: 'TMR', label: 'Two or More Races (Not Hispanic or Latino)', code: 'TMR' },
      ],
    },
    {
      fieldKey: 'sex',
      label: 'Sex',
      fieldType: 'single-select',
      required: true,
      options: [
        { value: 'M', label: 'Male', code: 'M' },
        { value: 'F', label: 'Female', code: 'F' },
      ],
    },
  ],
};

// Export all standards
export const DEMOGRAPHICS_STANDARDS_LIBRARY: DemographicsStandard[] = [
  HMIS_2024,
  OMB_2024,
  HHS_MEDICAID,
  DOE_IPEDS,
  FAIR_HOUSING,
  EEO_REPORTING,
];

// Helper to get standard by ID
export function getStandardById(standardId: string): DemographicsStandard | undefined {
  return DEMOGRAPHICS_STANDARDS_LIBRARY.find((s) => s.id === standardId);
}

// Helper to get active standards
export function getActiveStandards(): DemographicsStandard[] {
  return DEMOGRAPHICS_STANDARDS_LIBRARY.filter((s) => s.status === 'active');
}

// Helper to get standards by agency
export function getStandardsByAgency(agency: string): DemographicsStandard[] {
  return DEMOGRAPHICS_STANDARDS_LIBRARY.filter((s) => s.agency === agency);
}
