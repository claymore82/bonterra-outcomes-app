export type AssessmentType =
  | 'intake'
  | 'progress'
  | 'exit'
  | 'crisis'
  | 'custom';

export interface AssessmentResponse {
  questionId: string;
  question: string;
  response: any;
  notes?: string;
}

export interface Assessment {
  id: string;
  enrollmentId: string;
  participantId: string;
  assessmentType: AssessmentType;
  templateId: string;
  templateName: string;
  assessmentDate: Date;
  completedBy: string;
  responses: AssessmentResponse[];
  scores?: Record<string, number>; // calculated scores (e.g., PHQ-9 depression score)
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type:
    | 'text'
    | 'number'
    | 'scale'
    | 'yes-no'
    | 'multiple-choice'
    | 'checkbox'
    | 'textarea';
  options?: string[];
  required: boolean;
  scoringKey?: string; // for calculated scores
  scoringValue?: number;
  helpText?: string;
  min?: number;
  max?: number;
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string;
  assessmentType: AssessmentType;
  questions: AssessmentQuestion[];
  programs: string[]; // which programs use this
  frequencyDays?: number; // how often (e.g., every 30 days for progress)
  scoringRules?: ScoringRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoringRule {
  name: string;
  description: string;
  calculation: 'sum' | 'average' | 'custom';
  questionIds: string[]; // which questions to include in the score
  ranges?: ScoreRange[];
}

export interface ScoreRange {
  min: number;
  max: number;
  label: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  recommendation?: string;
}

// Goal tracking types (enhanced from poc.ts)
export type GoalStatus =
  | 'not-started'
  | 'in-progress'
  | 'achieved'
  | 'partially-achieved'
  | 'not-achieved'
  | 'abandoned';

export interface GoalMilestone {
  id: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'completed' | 'missed';
  notes?: string;
}

export interface Goal {
  id: string;
  enrollmentId: string;
  participantId: string;
  goal: string;
  description?: string;
  category:
    | 'housing'
    | 'employment'
    | 'health'
    | 'education'
    | 'financial'
    | 'other';
  status: GoalStatus;
  targetDate?: Date;
  completedDate?: Date;
  milestones: GoalMilestone[];
  progressNotes: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Timeline event types
export type TimelineEventType =
  | 'enrollment-start'
  | 'enrollment-end'
  | 'assessment'
  | 'touchpoint'
  | 'service'
  | 'goal-milestone'
  | 'risk-flag'
  | 'status-change'
  | 'document';

export interface TimelineEvent {
  id: string;
  enrollmentId: string;
  participantId: string;
  eventType: TimelineEventType;
  eventDate: Date;
  title: string;
  description?: string;
  metadata?: Record<string, any>; // flexible storage for event-specific data
  createdBy?: string;
  icon?: string;
  color?: string;
}

// Exit/Dismissal types
export type ExitReason =
  | 'completed-successfully'
  | 'dismissed-violation'
  | 'dismissed-inactive'
  | 'transferred'
  | 'moved-away'
  | 'deceased'
  | 'other';

export interface ExitAssessment {
  enrollmentId: string;
  exitDate: Date;
  exitReason: ExitReason;
  exitReasonDetails?: string;
  goalOutcomes: GoalOutcome[];
  servicesSummary: ServiceSummary;
  outcomeChanges: OutcomeChanges;
  recommendations: string[];
  nextSteps?: string;
  referrals?: string[];
  completedBy: string;
  completedAt: Date;
}

export interface GoalOutcome {
  goalId: string;
  goal: string;
  status: GoalStatus;
  notes?: string;
}

export interface ServiceSummary {
  totalServices: number;
  totalCost?: number;
  servicesByType: Record<string, { count: number; total?: number }>;
}

export interface OutcomeChanges {
  housingStatus?: {
    before: string;
    after: string;
    improved: boolean;
  };
  employmentStatus?: {
    before: string;
    after: string;
    improved: boolean;
  };
  income?: {
    before: number;
    after: number;
    increased: boolean;
  };
  healthStatus?: {
    improved: boolean;
    notes: string;
  };
  otherChanges?: Record<string, any>;
}
