import { create } from 'zustand';
import {
  Assessment,
  AssessmentTemplate,
  AssessmentType,
} from '@/types/assessments';
import {
  mockAssessments,
  mockAssessmentTemplates,
} from '@/lib/mockAssessmentData';

interface AssessmentStore {
  assessments: Assessment[];
  templates: AssessmentTemplate[];

  // Assessment CRUD
  getAssessmentById: (id: string) => Assessment | undefined;
  getAssessmentsByEnrollment: (enrollmentId: string) => Assessment[];
  getAssessmentsByParticipant: (participantId: string) => Assessment[];
  getAssessmentsByType: (
    enrollmentId: string,
    type: AssessmentType,
  ) => Assessment[];
  createAssessment: (
    assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Assessment;
  updateAssessment: (id: string, updates: Partial<Assessment>) => void;
  deleteAssessment: (id: string) => void;

  // Template CRUD
  getTemplateById: (id: string) => AssessmentTemplate | undefined;
  getTemplatesByProgram: (programId: string) => AssessmentTemplate[];
  getTemplatesByType: (type: AssessmentType) => AssessmentTemplate[];
  getAllTemplates: () => AssessmentTemplate[];
  createTemplate: (
    template: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  ) => AssessmentTemplate;
  updateTemplate: (id: string, updates: Partial<AssessmentTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Utility methods
  calculateScores: (assessment: Assessment) => Record<string, number>;
  getRecommendations: (assessment: Assessment) => string[];
  getNextAssessmentDue: (
    enrollmentId: string,
    templateId: string,
  ) => Date | null;
}

export const useAssessmentStore = create<AssessmentStore>((set, get) => ({
  assessments: mockAssessments,
  templates: mockAssessmentTemplates,

  // Assessment CRUD
  getAssessmentById: (id: string) => {
    return get().assessments.find((a) => a.id === id);
  },

  getAssessmentsByEnrollment: (enrollmentId: string) => {
    return get()
      .assessments.filter((a) => a.enrollmentId === enrollmentId)
      .sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime());
  },

  getAssessmentsByParticipant: (participantId: string) => {
    return get()
      .assessments.filter((a) => a.participantId === participantId)
      .sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime());
  },

  getAssessmentsByType: (enrollmentId: string, type: AssessmentType) => {
    return get()
      .assessments.filter(
        (a) => a.enrollmentId === enrollmentId && a.assessmentType === type,
      )
      .sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime());
  },

  createAssessment: (assessment) => {
    const template = get().getTemplateById(assessment.templateId);

    const newAssessment: Assessment = {
      ...assessment,
      id: `ASM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Calculate scores if template has scoring rules
    if (template?.scoringRules) {
      newAssessment.scores = get().calculateScores(newAssessment);
    }

    // Get recommendations based on responses
    newAssessment.recommendations = get().getRecommendations(newAssessment);

    set((state) => ({
      assessments: [...state.assessments, newAssessment],
    }));

    return newAssessment;
  },

  updateAssessment: (id, updates) => {
    set((state) => ({
      assessments: state.assessments.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a,
      ),
    }));
  },

  deleteAssessment: (id) => {
    set((state) => ({
      assessments: state.assessments.filter((a) => a.id !== id),
    }));
  },

  // Template CRUD
  getTemplateById: (id: string) => {
    return get().templates.find((t) => t.id === id);
  },

  getTemplatesByProgram: (programId: string) => {
    return get().templates.filter(
      (t) => t.programs.length === 0 || t.programs.includes(programId),
    );
  },

  getTemplatesByType: (type: AssessmentType) => {
    return get().templates.filter((t) => t.assessmentType === type);
  },

  getAllTemplates: () => {
    return get().templates;
  },

  createTemplate: (template) => {
    const newTemplate: AssessmentTemplate = {
      ...template,
      id: `TPL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      templates: [...state.templates, newTemplate],
    }));

    return newTemplate;
  },

  updateTemplate: (id, updates) => {
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t,
      ),
    }));
  },

  deleteTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    }));
  },

  // Utility methods
  calculateScores: (assessment: Assessment) => {
    const template = get().getTemplateById(assessment.templateId);
    if (!template?.scoringRules) return {};

    const scores: Record<string, number> = {};

    for (const rule of template.scoringRules) {
      let score = 0;

      if (rule.calculation === 'sum') {
        for (const response of assessment.responses) {
          if (rule.questionIds.includes(response.questionId)) {
            const question = template.questions.find(
              (q) => q.id === response.questionId,
            );
            if (question?.scoringValue !== undefined) {
              score += question.scoringValue;
            } else if (typeof response.response === 'number') {
              score += response.response;
            }
          }
        }
      } else if (rule.calculation === 'average') {
        const relevantResponses = assessment.responses.filter((r) =>
          rule.questionIds.includes(r.questionId),
        );
        if (relevantResponses.length > 0) {
          const sum = relevantResponses.reduce((acc, r) => {
            const question = template.questions.find(
              (q) => q.id === r.questionId,
            );
            if (question?.scoringValue !== undefined) {
              return acc + question.scoringValue;
            } else if (typeof r.response === 'number') {
              return acc + r.response;
            }
            return acc;
          }, 0);
          score = sum / relevantResponses.length;
        }
      }

      scores[rule.name] = score;
    }

    return scores;
  },

  getRecommendations: (assessment: Assessment) => {
    const template = get().getTemplateById(assessment.templateId);
    if (!template?.scoringRules) return [];

    const recommendations: string[] = [];
    const scores = assessment.scores || get().calculateScores(assessment);

    for (const rule of template.scoringRules) {
      const score = scores[rule.name];
      if (score !== undefined && rule.ranges) {
        const range = rule.ranges.find((r) => score >= r.min && score <= r.max);
        if (range?.recommendation) {
          recommendations.push(range.recommendation);
        }
      }
    }

    return recommendations;
  },

  getNextAssessmentDue: (enrollmentId: string, templateId: string) => {
    const template = get().getTemplateById(templateId);
    if (!template?.frequencyDays) return null;

    const assessments = get()
      .getAssessmentsByEnrollment(enrollmentId)
      .filter((a) => a.templateId === templateId);

    if (assessments.length === 0) return new Date(); // Due now if never done

    const lastAssessment = assessments[0]; // Already sorted by date desc
    const nextDue = new Date(lastAssessment.assessmentDate);
    nextDue.setDate(nextDue.getDate() + template.frequencyDays);

    return nextDue;
  },
}));
