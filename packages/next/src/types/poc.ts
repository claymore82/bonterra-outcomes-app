// Multi-Tenancy: Top-level tenant represents a client organization's database
export interface Tenant {
  id: string;
  name: string; // Organization name (e.g., "Seattle Housing Authority")
  slug: string; // URL-safe identifier (e.g., "seattle-housing")
  domain?: string; // Optional custom domain (e.g., "outcomes.seattlehousing.org")
  status: 'active' | 'inactive' | 'trial' | 'suspended';
  subscriptionTier: 'free' | 'starter' | 'professional' | 'enterprise';
  settings: {
    timezone: string;
    locale: string;
    dateFormat: string;
    enableHMIS: boolean; // HMIS compliance features
    enableBilling: boolean; // Billing/financial features (Penelope-style)
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ExtractedData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  approximateAge?: number;
  dobDataQuality?: 1 | 2 | 8 | 9 | 99; // HMIS codes
  gender?: 0 | 1 | 2 | 3 | 4 | 5 | 99; // HMIS codes
  phoneNumber?: string;
  email?: string;
  program?: string;
  caseWorker?: string;
  outcomeGoal?: string;
  address?: string;
  photo?: string; // base64 encoded image
  documentType?: string; // e.g., "Driver's License", "State ID", "Birth Certificate"
  documentNumber?: string;
  confidence: {
    firstName?: number;
    lastName?: number;
    dateOfBirth?: number;
    gender?: number;
    phoneNumber?: number;
    email?: number;
    program?: number;
    caseWorker?: number;
    outcomeGoal?: number;
    address?: number;
    documentType?: number;
    documentNumber?: number;
  };
}

export interface Participant {
  id: string;
  tenantId: string; // Belongs to a specific tenant/organization
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  approximateAge?: number;
  dobDataQuality: 1 | 2 | 8 | 9 | 99;
  gender: 0 | 1 | 2 | 3 | 4 | 5 | 99;
  phoneNumber?: string;
  email?: string;
  customData: Record<string, any>; // key = field.id, value = field value
  createdAt: Date;
  lastSeenAt: Date;
}

export interface DuplicateMatch {
  participant: Participant;
  confidence: 'high' | 'medium' | 'low';
  matchReason: string;
}

export interface ConversationState {
  messages: Message[];
  extractedData: ExtractedData;
  requiredFields: string[];
  completedFields: string[];
  currentStep:
    | 'greeting'
    | 'collecting'
    | 'duplicateCheck'
    | 'review'
    | 'complete';
  duplicateMatches?: DuplicateMatch[];
  isAgentTyping: boolean;
}

export const HMIS_GENDER_CODES = {
  0: 'Woman',
  1: 'Man',
  2: 'Culturally Specific',
  3: 'Transgender',
  4: 'Non-Binary',
  5: 'Questioning',
  99: 'Data not collected',
} as const;

export const HMIS_DOB_DATA_QUALITY = {
  1: 'Full DOB reported',
  2: 'Approximate or partial DOB reported',
  8: "Client doesn't know",
  9: 'Client prefers not to answer',
  99: 'Data not collected',
} as const;

// Entity Types (Institutions that can be enrolled)
export type EntityType =
  | 'school'
  | 'employer'
  | 'healthcare_provider'
  | 'government_agency'
  | 'nonprofit_partner'
  | 'religious_organization'
  | 'housing_authority'
  | 'other';

export interface Entity {
  id: string;
  tenantId: string; // Belongs to a specific tenant/organization
  name: string;
  entityType: EntityType;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactPerson?: string;
  contactTitle?: string;
  partnershipStatus?: 'active' | 'inactive' | 'pending';
  customData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Enrollment Types
export type EnrollmentStatus =
  | 'active'
  | 'completed'
  | 'dismissed'
  | 'transferred';

// What can be enrolled in a program
export type EnrolleeType = 'participant' | 'family' | 'entity';

export interface ServiceReceived {
  id: string;
  serviceType: string;
  date: Date;
  amount?: number;
  unit?: string; // e.g., "dollars", "hours", "sessions"
  providedBy: string;
  notes?: string;
}

// Generic Enrollment - can enroll individuals, families, or entities
export interface Enrollment {
  id: string;
  tenantId: string; // Belongs to a specific tenant/organization

  // Polymorphic enrollee - what is being enrolled
  enrolleeType: EnrolleeType;
  enrolleeId: string; // Can be participantId, familyId, or entityId

  // Legacy fields for backward compatibility (optional)
  participantId?: string; // Deprecated: use enrolleeId with enrolleeType='participant'
  householdId?: string; // Deprecated: use enrolleeId with enrolleeType='family'

  programId: string;
  siteId?: string;
  caseWorkerId?: string; // Optional - not all programs require case workers
  startDate: Date;
  endDate: Date | null; // null = active
  status: EnrollmentStatus;
  dismissalReason?: string;
  outcomes: string[];
  servicesReceived: ServiceReceived[];
  outcomeGoals: string[];
  notes?: string;
  nextCheckIn?: Date; // Scheduled next check-in/appointment date
  nextCheckInZoomLink?: string; // Optional Zoom/meeting link for virtual check-ins
  createdAt: Date;
  updatedAt: Date;
}

// Case Notes Types
export interface EnrolledParticipant {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 0 | 1 | 2 | 3 | 4 | 5 | 99;
  program: string;
  enrollmentDate: Date;
  caseWorker: string;
  outcomeGoal?: string;
  lastContactDate?: Date;
  phoneNumber?: string;
  email?: string;
}

export interface CaseNoteExtraction {
  servicesProvided?: string[];
  goalProgress?: {
    goal: string;
    status: 'positive' | 'negative' | 'neutral';
    notes: string;
  }[];
  newNeeds?: string[];
  actionItems?: string[];
  emotionalState?: string;
  riskFlags?: {
    type: 'housing' | 'health' | 'safety' | 'financial' | 'legal' | 'other';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  employmentChanges?: string;
  housingChanges?: string;
  incomeChanges?: string;
  confidence: {
    servicesProvided?: number;
    goalProgress?: number;
    newNeeds?: number;
    actionItems?: number;
    emotionalState?: number;
    riskFlags?: number;
    employmentChanges?: number;
    housingChanges?: number;
    incomeChanges?: number;
  };
}

export interface CaseNote {
  id: string;
  participantId: string;
  enrollmentId: string; // Case notes belong to specific enrollment
  caseWorker: string;
  date: Date;
  rawNotes: string;
  extraction: CaseNoteExtraction;
  createdAt: Date;
}

// Enhanced Touchpoints System (ETO-aligned)
export type TouchpointType =
  | 'in-person'
  | 'phone'
  | 'home-visit'
  | 'video'
  | 'email'
  | 'text'
  | 'group-session'
  | 'other';

export interface ServiceMention {
  serviceType: string;
  quantity?: number;
  unit?: string; // e.g., "dollars", "sessions", "hours"
  amount?: number; // dollar amount
  confidence: number;
  createTransaction: boolean; // should we auto-create service transaction?
}

export interface ActionItem {
  description: string;
  dueDate?: Date;
  completed: boolean;
}

export interface EmotionalState {
  primary: string; // e.g., "anxious", "hopeful", "frustrated"
  description: string;
}

export interface RiskFlag {
  type: 'housing' | 'health' | 'safety' | 'financial' | 'legal' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface OutcomeAchievement {
  goal: string;
  achieved: boolean;
  date: Date;
  evidence: string;
  confidence: number;
}

export interface StatusChange {
  from: string;
  to: string;
  date: Date;
  description: string;
}

export interface GoalProgress {
  goal: string;
  status: 'positive' | 'negative' | 'neutral';
  notes: string;
  percentComplete?: number;
}

export interface TouchpointExtraction {
  // Service delivery
  servicesProvided: ServiceMention[];

  // Goal tracking
  progressOnGoals: GoalProgress[];
  outcomeAchievements: OutcomeAchievement[];

  // Participant needs and follow-up
  newNeeds: string[];
  actionItems: ActionItem[];

  // Status changes
  employmentChange?: StatusChange;
  housingChange?: StatusChange;
  incomeChange?: StatusChange;
  healthChange?: StatusChange;

  // Participant state
  emotionalState?: EmotionalState;
  riskFlags: RiskFlag[];

  // Confidence scores
  confidence: Record<string, number>;
}

export interface Touchpoint {
  id: string;
  enrollmentId: string; // specific enrollment
  participantId: string; // denormalized for queries
  caseWorkerId?: string; // UPDATED: Optional - not all programs have case workers
  touchpointType: TouchpointType;
  content: string; // raw notes
  duration?: number; // minutes
  location?: string; // site ID or description
  extractedData: TouchpointExtraction;
  servicesRecorded: string[]; // service transaction IDs created from this touchpoint
  createdAt: Date;
  updatedAt: Date;
}

// Program Management Types
export type ProgramType =
  | 'emergency_shelter'
  | 'rapid_rehousing'
  | 'educational_support'
  | 'job_training'
  | 'mental_health_services'
  | 'substance_abuse_treatment'
  | 'transitional_housing'
  | 'permanent_supportive_housing'
  | 'day_shelter'
  | 'street_outreach'
  | 'other';

export interface Program {
  id: string;
  tenantId: string; // Belongs to a specific tenant/organization
  name: string;
  description?: string;
  programType: ProgramType;
  eligibilityCriteria?: string;
  servicesOffered: string[];
  enrollmentRequirements: string[];
  outcomeGoals: string[];
  siteIds: string[]; // Sites where this program operates (empty = all sites)
  capacity?: number;
  currentEnrollment?: number;
  status: 'active' | 'inactive';
  active: boolean; // Convenience flag for filtering
  requiresCaseWorker: boolean; // Does this program require case worker assignment?
  budget?: number; // Total funds allocated to this program
  createdAt: Date;
  updatedAt: Date;
}

// User Management & Authentication
export type UserRole =
  | 'case_worker'
  | 'program_manager'
  | 'staff'
  | 'super_admin';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  case_worker: 'Case Worker',
  program_manager: 'Program Manager',
  staff: 'Staff',
  super_admin: 'Super Admin',
};

export interface User {
  id: string;
  tenantId: string; // Belongs to a specific tenant/organization
  uniqueKey: string; // Unique identifier for user (e.g., email or employee ID)
  bonterraAuthId: string; // Auth0 user ID from bonterra-auth
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  // Access control - empty arrays = access to all
  programIds: string[]; // Which programs this user can access (empty = all)
  siteIds: string[]; // Which sites this user can access (empty = all)
  // Role-specific data
  caseWorkerProfile?: CaseWorkerProfile; // Only present if role is 'case_worker'
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Case Worker specific profile data
export interface CaseWorkerProfile {
  title: string; // e.g., "Case Manager", "Senior Case Manager", "Care Coordinator"
  programIds: string[]; // Which programs this case worker works with (empty = all programs)
  maxCaseload?: number; // Optional caseload limit
  currentCaseload: number; // Current number of active enrollments
}

// Legacy CaseWorker interface - kept for backward compatibility during migration
// TODO: Remove once all references are updated to use User with role='case_worker'
export interface CaseWorker {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string; // e.g., "Case Manager", "Senior Case Manager", "Care Coordinator"
  programIds: string[]; // Which programs this case worker works with
  status: 'active' | 'inactive';
  maxCaseload?: number; // Optional caseload limit
  currentCaseload?: number; // Current number of active enrollments
  createdAt: Date;
  updatedAt: Date;
}

export const PROGRAM_TYPES: Record<ProgramType, string> = {
  emergency_shelter: 'Emergency Shelter',
  rapid_rehousing: 'Rapid Rehousing',
  educational_support: 'Educational Support',
  job_training: 'Job Training',
  mental_health_services: 'Mental Health Services',
  substance_abuse_treatment: 'Substance Abuse Treatment',
  transitional_housing: 'Transitional Housing',
  permanent_supportive_housing: 'Permanent Supportive Housing',
  day_shelter: 'Day Shelter',
  street_outreach: 'Street Outreach',
  other: 'Other',
};

// Site Management Types
export interface Site {
  id: string;
  tenantId: string; // Belongs to a specific tenant/organization
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  capacity?: number;
  active: boolean; // Is this site currently operational?
  status: 'active' | 'inactive'; // Legacy - kept for backward compatibility
  hoursOfOperation?: string;
  accessibilityFeatures?: string[];
  contactPerson?: string;
  createdAt: Date;
  updatedAt: Date;
}
