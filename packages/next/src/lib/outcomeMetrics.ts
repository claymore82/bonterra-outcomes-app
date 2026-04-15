import { Enrollment, ServiceReceived } from '@/types/poc';
import { Goal, GoalStatus, Assessment, ExitReason } from '@/types/assessments';

export interface OutcomeMetrics {
  // Goal metrics
  goalCompletionRate: number;
  totalGoals: number;
  achievedGoals: number;
  partiallyAchievedGoals: number;
  averageDaysToGoalCompletion: number | null;

  // Service metrics
  totalServices: number;
  totalServiceCost: number;
  servicesByType: Record<string, { count: number; totalCost: number }>;
  costPerSuccessfulOutcome: number | null;

  // Enrollment metrics
  daysEnrolled: number;
  retentionRate: number;
  exitReasons: Record<ExitReason, number>;

  // Assessment metrics
  assessmentsCompleted: number;
  assessmentsByType: Record<string, number>;
  averageScoreChange?: number; // For progress tracking
}

export function calculateEnrollmentMetrics(
  enrollment: Enrollment,
  goals: Goal[],
  assessments: Assessment[]
): OutcomeMetrics {
  // Days enrolled
  const startDate = enrollment.startDate;
  const endDate = enrollment.endDate || new Date();
  const daysEnrolled = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Goal metrics
  const achievedGoals = goals.filter(g => g.status === 'achieved').length;
  const partiallyAchievedGoals = goals.filter(g => g.status === 'partially-achieved').length;
  const goalCompletionRate = goals.length > 0
    ? ((achievedGoals + partiallyAchievedGoals) / goals.length) * 100
    : 0;

  // Average days to goal completion
  const completedGoals = goals.filter(g => g.status === 'achieved' && g.completedDate);
  const averageDaysToGoalCompletion = completedGoals.length > 0
    ? completedGoals.reduce((sum, goal) => {
        const days = Math.ceil(
          ((goal.completedDate!.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        );
        return sum + days;
      }, 0) / completedGoals.length
    : null;

  // Service metrics
  const services = enrollment.servicesReceived || [];
  const totalServices = services.length;

  const servicesByType: Record<string, { count: number; totalCost: number }> = {};
  let totalServiceCost = 0;

  for (const service of services) {
    if (!servicesByType[service.serviceType]) {
      servicesByType[service.serviceType] = { count: 0, totalCost: 0 };
    }
    servicesByType[service.serviceType].count++;

    if (service.amount && service.unit === 'dollars') {
      const cost = service.amount;
      servicesByType[service.serviceType].totalCost += cost;
      totalServiceCost += cost;
    }
  }

  // Cost per successful outcome
  const successfulOutcomes = achievedGoals + partiallyAchievedGoals;
  const costPerSuccessfulOutcome = successfulOutcomes > 0 && totalServiceCost > 0
    ? totalServiceCost / successfulOutcomes
    : null;

  // Assessment metrics
  const assessmentsByType: Record<string, number> = {};
  for (const assessment of assessments) {
    assessmentsByType[assessment.assessmentType] =
      (assessmentsByType[assessment.assessmentType] || 0) + 1;
  }

  return {
    goalCompletionRate,
    totalGoals: goals.length,
    achievedGoals,
    partiallyAchievedGoals,
    averageDaysToGoalCompletion,
    totalServices,
    totalServiceCost,
    servicesByType,
    costPerSuccessfulOutcome,
    daysEnrolled,
    retentionRate: enrollment.status === 'completed' ? 100 : 0, // Simplified
    exitReasons: {
      'completed-successfully': 0,
      'dismissed-violation': 0,
      'dismissed-inactive': 0,
      'transferred': 0,
      'moved-away': 0,
      'deceased': 0,
      'other': 0,
    }, // Would need multiple enrollments to calculate
    assessmentsCompleted: assessments.length,
    assessmentsByType,
  };
}

export function calculateProgramMetrics(
  enrollments: Enrollment[],
  allGoals: Goal[],
  allAssessments: Assessment[]
): OutcomeMetrics {
  let totalGoalCompletionRate = 0;
  let totalGoals = 0;
  let achievedGoals = 0;
  let partiallyAchievedGoals = 0;
  let totalDaysToCompletion = 0;
  let completedGoalsCount = 0;
  let totalServices = 0;
  let totalServiceCost = 0;
  const servicesByType: Record<string, { count: number; totalCost: number }> = {};
  let totalDaysEnrolled = 0;
  let retainedEnrollments = 0;
  const exitReasons: Record<ExitReason, number> = {
    'completed-successfully': 0,
    'dismissed-violation': 0,
    'dismissed-inactive': 0,
    'transferred': 0,
    'moved-away': 0,
    'deceased': 0,
    'other': 0,
  };
  let totalAssessments = 0;
  const assessmentsByType: Record<string, number> = {};

  for (const enrollment of enrollments) {
    const enrollmentGoals = allGoals.filter(g => g.enrollmentId === enrollment.id);
    const enrollmentAssessments = allAssessments.filter(a => a.enrollmentId === enrollment.id);

    const metrics = calculateEnrollmentMetrics(enrollment, enrollmentGoals, enrollmentAssessments);

    totalGoalCompletionRate += metrics.goalCompletionRate;
    totalGoals += metrics.totalGoals;
    achievedGoals += metrics.achievedGoals;
    partiallyAchievedGoals += metrics.partiallyAchievedGoals;

    if (metrics.averageDaysToGoalCompletion !== null) {
      totalDaysToCompletion += metrics.averageDaysToGoalCompletion;
      completedGoalsCount++;
    }

    totalServices += metrics.totalServices;
    totalServiceCost += metrics.totalServiceCost;

    for (const [type, data] of Object.entries(metrics.servicesByType)) {
      if (!servicesByType[type]) {
        servicesByType[type] = { count: 0, totalCost: 0 };
      }
      servicesByType[type].count += data.count;
      servicesByType[type].totalCost += data.totalCost;
    }

    totalDaysEnrolled += metrics.daysEnrolled;
    if (enrollment.status === 'completed') {
      retainedEnrollments++;
    }

    totalAssessments += metrics.assessmentsCompleted;
    for (const [type, count] of Object.entries(metrics.assessmentsByType)) {
      assessmentsByType[type] = (assessmentsByType[type] || 0) + count;
    }
  }

  const averageGoalCompletionRate = enrollments.length > 0
    ? totalGoalCompletionRate / enrollments.length
    : 0;

  const averageDaysToGoalCompletion = completedGoalsCount > 0
    ? totalDaysToCompletion / completedGoalsCount
    : null;

  const retentionRate = enrollments.length > 0
    ? (retainedEnrollments / enrollments.length) * 100
    : 0;

  const successfulOutcomes = achievedGoals + partiallyAchievedGoals;
  const costPerSuccessfulOutcome = successfulOutcomes > 0 && totalServiceCost > 0
    ? totalServiceCost / successfulOutcomes
    : null;

  return {
    goalCompletionRate: averageGoalCompletionRate,
    totalGoals,
    achievedGoals,
    partiallyAchievedGoals,
    averageDaysToGoalCompletion,
    totalServices,
    totalServiceCost,
    servicesByType,
    costPerSuccessfulOutcome,
    daysEnrolled: Math.round(totalDaysEnrolled / (enrollments.length || 1)),
    retentionRate,
    exitReasons,
    assessmentsCompleted: totalAssessments,
    assessmentsByType,
  };
}

export function getSuccessIndicators(metrics: OutcomeMetrics): {
  indicator: string;
  value: string;
  trend: 'positive' | 'negative' | 'neutral';
}[] {
  const indicators = [];

  // Goal completion
  if (metrics.goalCompletionRate >= 75) {
    indicators.push({
      indicator: 'Goal Achievement',
      value: `${Math.round(metrics.goalCompletionRate)}%`,
      trend: 'positive' as const,
    });
  } else if (metrics.goalCompletionRate >= 50) {
    indicators.push({
      indicator: 'Goal Achievement',
      value: `${Math.round(metrics.goalCompletionRate)}%`,
      trend: 'neutral' as const,
    });
  } else if (metrics.totalGoals > 0) {
    indicators.push({
      indicator: 'Goal Achievement',
      value: `${Math.round(metrics.goalCompletionRate)}%`,
      trend: 'negative' as const,
    });
  }

  // Average time to goal
  if (metrics.averageDaysToGoalCompletion !== null) {
    indicators.push({
      indicator: 'Avg. Days to Goal',
      value: `${Math.round(metrics.averageDaysToGoalCompletion)} days`,
      trend: (metrics.averageDaysToGoalCompletion < 90 ? 'positive' : 'neutral') as 'positive' | 'neutral',
    });
  }

  // Service utilization
  if (metrics.totalServices > 0) {
    indicators.push({
      indicator: 'Services Received',
      value: `${metrics.totalServices} services`,
      trend: 'positive' as const,
    });
  }

  // Cost efficiency
  if (metrics.costPerSuccessfulOutcome !== null) {
    indicators.push({
      indicator: 'Cost per Outcome',
      value: `$${Math.round(metrics.costPerSuccessfulOutcome).toLocaleString()}`,
      trend: 'neutral' as const,
    });
  }

  // Retention
  if (metrics.retentionRate >= 80) {
    indicators.push({
      indicator: 'Retention Rate',
      value: `${Math.round(metrics.retentionRate)}%`,
      trend: 'positive' as const,
    });
  }

  return indicators;
}

export function calculateServiceTotals(services: ServiceReceived[]): {
  totalCost: number;
  totalQuantity: number;
  byType: Record<string, { quantity: number; cost: number }>;
} {
  let totalCost = 0;
  let totalQuantity = 0;
  const byType: Record<string, { quantity: number; cost: number }> = {};

  for (const service of services) {
    totalQuantity++;

    if (service.amount && service.unit === 'dollars') {
      totalCost += service.amount;
    }

    if (!byType[service.serviceType]) {
      byType[service.serviceType] = { quantity: 0, cost: 0 };
    }
    byType[service.serviceType].quantity++;

    if (service.amount && service.unit === 'dollars') {
      byType[service.serviceType].cost += service.amount;
    }
  }

  return { totalCost, totalQuantity, byType };
}
