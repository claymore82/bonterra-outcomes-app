export type ServiceCategory =
  | 'housing'
  | 'employment'
  | 'education'
  | 'health'
  | 'financial'
  | 'legal'
  | 'transportation'
  | 'food'
  | 'case-management'
  | 'other';

export type ServiceUnit =
  | 'nights'
  | 'sessions'
  | 'hours'
  | 'dollars'
  | 'meals'
  | 'items'
  | 'visits'
  | 'referrals'
  | 'assessments';

export type ServiceOutcome =
  | 'successful'
  | 'partially-successful'
  | 'unsuccessful'
  | 'pending';

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  unit: ServiceUnit;
  defaultAmount?: number;
  costPerUnit?: number; // for reporting/budgets
  programs: string[]; // which programs offer this service
  requiresDocumentation: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceTransaction {
  id: string;
  serviceTypeId: string;
  participantId: string;
  enrollmentId: string;
  providedBy: string; // case worker ID or name
  serviceDate: Date;
  quantity: number;
  unit: ServiceUnit;
  totalCost?: number;
  outcome?: ServiceOutcome;
  notes?: string;
  location?: string; // site ID
  documentationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const SERVICE_CATEGORIES: Record<ServiceCategory, string> = {
  housing: 'Housing',
  employment: 'Employment',
  education: 'Education',
  health: 'Health',
  financial: 'Financial',
  legal: 'Legal',
  transportation: 'Transportation',
  food: 'Food',
  'case-management': 'Case Management',
  other: 'Other',
};

export const SERVICE_UNITS: Record<ServiceUnit, string> = {
  nights: 'Nights',
  sessions: 'Sessions',
  hours: 'Hours',
  dollars: 'Dollars',
  meals: 'Meals',
  items: 'Items',
  visits: 'Visits',
  referrals: 'Referrals',
  assessments: 'Assessments',
};

export const SERVICE_OUTCOMES: Record<ServiceOutcome, string> = {
  successful: 'Successful',
  'partially-successful': 'Partially Successful',
  unsuccessful: 'Unsuccessful',
  pending: 'Pending',
};
