'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Button,
  Icon,
} from '@bonterratech/stitch-extension';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useGoalStore } from '@/lib/stores/goalStore';
import { useAssessmentStore } from '@/lib/stores/assessmentStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';
import { calculateEnrollmentMetrics, getSuccessIndicators } from '@/lib/outcomeMetrics';
import { HMIS_GENDER_CODES } from '@/types/poc';
import { TimelineEvent, TimelineEventType } from '@/types/assessments';
import PageLayout from '../../components/PageLayout';
import CompleteEnrollmentModal from '../../components/CompleteEnrollmentModal';

interface EnrollmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function EnrollmentDetailPage({ params }: EnrollmentDetailPageProps) {
  const resolvedParams = use(params);
  const enrollmentId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<'timeline' | 'services' | 'goals' | 'assessments'>('timeline');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const { getEnrollmentById, getEnrollmentDuration } = useEnrollmentStore();
  const { getGoalsByEnrollment } = useGoalStore();
  const { getAssessmentsByEnrollment } = useAssessmentStore();
  const { getProgram } = useProgramStore();
  const { participants } = useParticipantStore();
  const { caseWorkers } = useCaseWorkerStore();

  const enrollment = getEnrollmentById(enrollmentId);
  const goals = getGoalsByEnrollment(enrollmentId);
  const assessments = getAssessmentsByEnrollment(enrollmentId);

  if (!enrollment) {
    return (
      <PageLayout pageTitle="Enrollment Not Found">
        <Stack space="600">
          <Card>
            <Stack space="400">
              <Heading level={2}>Enrollment not found</Heading>
              <Link href="/">
                <Text color="link">Return to home</Text>
              </Link>
            </Stack>
          </Card>
        </Stack>
      </PageLayout>
    );
  }

  const participant = participants.find(p => p.id === enrollment.participantId);
  const program = getProgram(enrollment.programId);
  const caseWorker = caseWorkers.find(cw => cw.id === enrollment.caseWorkerId);
  const daysEnrolled = getEnrollmentDuration(enrollmentId) || 0;

  const metrics = calculateEnrollmentMetrics(enrollment, goals, assessments);
  const successIndicators = getSuccessIndicators(metrics);

  // Build timeline events
  const timelineEvents: TimelineEvent[] = [];

  // Enrollment start
  timelineEvents.push({
    id: `event-start-${enrollment.id}`,
    enrollmentId: enrollment.id,
    participantId: enrollment.participantId,
    eventType: 'enrollment-start',
    eventDate: enrollment.startDate,
    title: 'Enrollment Started',
    description: `Enrolled in ${program?.name}`,
    icon: 'play',
    color: 'green',
  });

  // Assessments
  assessments.forEach(assessment => {
    timelineEvents.push({
      id: `event-assessment-${assessment.id}`,
      enrollmentId: enrollment.id,
      participantId: enrollment.participantId,
      eventType: 'assessment',
      eventDate: assessment.assessmentDate,
      title: assessment.templateName,
      description: `${assessment.assessmentType} assessment completed`,
      metadata: assessment,
      icon: 'clipboard',
      color: 'blue',
    });
  });

  // Goals and milestones
  goals.forEach(goal => {
    goal.milestones.filter(m => m.status === 'completed').forEach(milestone => {
      if (milestone.completedDate) {
        timelineEvents.push({
          id: `event-milestone-${milestone.id}`,
          enrollmentId: enrollment.id,
          participantId: enrollment.participantId,
          eventType: 'goal-milestone',
          eventDate: milestone.completedDate,
          title: `Milestone Achieved: ${milestone.description}`,
          description: `Goal: ${goal.goal}`,
          metadata: { goal, milestone },
          icon: 'check',
          color: 'green',
        });
      }
    });
  });

  // Services
  enrollment.servicesReceived.forEach(service => {
    timelineEvents.push({
      id: `event-service-${service.id}`,
      enrollmentId: enrollment.id,
      participantId: enrollment.participantId,
      eventType: 'service',
      eventDate: service.date,
      title: service.serviceType,
      description: `${service.amount} ${service.unit}`,
      metadata: service,
      icon: 'gift',
      color: 'purple',
    });
  });

  // Enrollment end
  if (enrollment.endDate) {
    timelineEvents.push({
      id: `event-end-${enrollment.id}`,
      enrollmentId: enrollment.id,
      participantId: enrollment.participantId,
      eventType: 'enrollment-end',
      eventDate: enrollment.endDate,
      title: `Enrollment ${enrollment.status === 'completed' ? 'Completed' : 'Ended'}`,
      description: enrollment.dismissalReason || 'Program completed successfully',
      icon: 'flag',
      color: enrollment.status === 'completed' ? 'green' : 'gray',
    });
  }

  // Sort timeline events by date
  timelineEvents.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

  const statusColors: Record<string, string> = {
    active: '#10b981',
    completed: '#3b82f6',
    dismissed: '#ef4444',
    transferred: '#f59e0b',
  };

  return (
    <PageLayout pageTitle={`${participant?.firstName} ${participant?.lastName} - Enrollment`}>
      <Stack space="600">
        {/* Back Link */}
        {participant && (
          <Link href={`/participants/${participant.id}`}>
            <Text color="link">← Back to {participant.firstName} {participant.lastName}</Text>
          </Link>
        )}

        {/* Header */}
        <Card>
          <Stack space="400">
            <InlineStack gap="400" verticalAlign="center" distribute="space-between">
              <Stack space="200">
                <Heading level={1}>
                  {participant?.firstName} {participant?.lastName}
                </Heading>
                <InlineStack gap="300">
                  <Text variant="sm" color="subdued">
                    DOB: {participant?.dateOfBirth.toLocaleDateString()}
                  </Text>
                  <Text variant="sm" color="subdued">
                    Gender: {participant ? HMIS_GENDER_CODES[participant.gender] : 'Unknown'}
                  </Text>
                  <Text variant="sm" color="subdued">
                    Case Worker: {caseWorker?.firstName} {caseWorker?.lastName}
                  </Text>
                </InlineStack>
              </Stack>
              <InlineStack gap="300" verticalAlign="center">
                <Stack space="200" style={{ textAlign: 'right' }}>
                  <Text
                    weight="600"
                    style={{
                      color: statusColors[enrollment.status],
                      textTransform: 'capitalize',
                    }}
                  >
                    {enrollment.status}
                  </Text>
                  <Text variant="sm" color="subdued">
                    {daysEnrolled} days enrolled
                  </Text>
                </Stack>
                {enrollment.status === 'active' && (
                  <Button
                    variant="primary"
                    onPress={() => setShowCompleteModal(true)}
                  >
                    <Icon name="check-circle" />
                    Complete Enrollment
                  </Button>
                )}
              </InlineStack>
            </InlineStack>

            {/* Program Info */}
            <Card>
              <InlineStack gap="600">
                <Stack space="100">
                  <Text variant="sm" color="subdued">Program</Text>
                  <Text weight="600">{program?.name}</Text>
                </Stack>
                <Stack space="100">
                  <Text variant="sm" color="subdued">Enrollment Date</Text>
                  <Text weight="600">{enrollment.startDate.toLocaleDateString()}</Text>
                </Stack>
                <Stack space="100">
                  <Text variant="sm" color="subdued">End Date</Text>
                  <Text weight="600">
                    {enrollment.endDate ? enrollment.endDate.toLocaleDateString() : 'Ongoing'}
                  </Text>
                </Stack>
                {enrollment.nextCheckIn && enrollment.status === 'active' && (
                  <Stack space="100">
                    <Text variant="sm" color="subdued">Next Check-In</Text>
                    <InlineStack gap="200" verticalAlign="center">
                      <Icon
                        name="calendar"
                        size="small"
                        style={{
                          color: new Date(enrollment.nextCheckIn) < new Date() ? '#ef4444' : '#7C3AED',
                        }}
                      />
                      <Text
                        weight="600"
                        style={{
                          color: new Date(enrollment.nextCheckIn) < new Date() ? '#ef4444' : '#7C3AED',
                        }}
                      >
                        {new Date(enrollment.nextCheckIn).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' at '}
                        {new Date(enrollment.nextCheckIn).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </InlineStack>
                  </Stack>
                )}
              </InlineStack>
            </Card>

            {/* Outcomes Achieved */}
            {enrollment.status === 'completed' && enrollment.outcomes.length > 0 && (
              <Card style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
                <Stack space="200">
                  <InlineStack gap="200" verticalAlign="center">
                    <Icon name="check-circle" size="small" style={{ color: '#22c55e' }} />
                    <Text weight="600">Outcomes Achieved</Text>
                  </InlineStack>
                  <Stack space="100">
                    {enrollment.outcomes.map((outcome, idx) => (
                      <InlineStack key={idx} gap="200" verticalAlign="center">
                        <Text variant="sm" style={{ color: '#22c55e' }}>✓</Text>
                        <Text variant="sm">{outcome}</Text>
                      </InlineStack>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            )}

            {/* Dismissal/Transfer Info */}
            {enrollment.status !== 'active' && enrollment.dismissalReason && (
              <Card style={{
                backgroundColor: enrollment.status === 'completed' ? '#eff6ff' : '#fef3c7',
                border: enrollment.status === 'completed' ? '1px solid #93c5fd' : '1px solid #fcd34d'
              }}>
                <Stack space="200">
                  <InlineStack gap="200" verticalAlign="center">
                    <Icon
                      name="info-circle"
                      size="small"
                      style={{ color: enrollment.status === 'completed' ? '#3b82f6' : '#f59e0b' }}
                    />
                    <Text weight="600">
                      {enrollment.status === 'completed' ? 'Completion Notes' :
                       enrollment.status === 'transferred' ? 'Transfer Notes' :
                       'Dismissal Reason'}
                    </Text>
                  </InlineStack>
                  <Text variant="sm">{enrollment.dismissalReason}</Text>
                </Stack>
              </Card>
            )}

            {/* Success Indicators */}
            {successIndicators.length > 0 && (
              <InlineStack gap="400">
                {successIndicators.map((indicator, idx) => (
                  <Card key={idx}>
                    <Stack space="100">
                      <Text variant="sm" color="subdued">{indicator.indicator}</Text>
                      <Heading level={3}>{indicator.value}</Heading>
                    </Stack>
                  </Card>
                ))}
              </InlineStack>
            )}
          </Stack>
        </Card>

        {/* Tabs */}
        <Card>
          <InlineStack gap="400">
            {[
              { id: 'timeline', label: 'Timeline' },
              { id: 'services', label: 'Services' },
              { id: 'goals', label: 'Goals' },
              { id: 'assessments', label: 'Assessments' },
            ].map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'secondary'}
                onPress={() => setActiveTab(tab.id as typeof activeTab)}
              >
                {tab.label}
              </Button>
            ))}
          </InlineStack>
        </Card>

        {/* Content */}
        {activeTab === 'timeline' && (
          <Card>
            <Stack space="500">
              <Heading level={2}>Enrollment Timeline</Heading>
              <Stack space="400">
                {timelineEvents.map((event, idx) => (
                  <div key={event.id} style={{ position: 'relative' }}>
                    {idx !== timelineEvents.length - 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '16px',
                          top: '40px',
                          bottom: '-16px',
                          width: '2px',
                          backgroundColor: '#e5e7eb',
                        }}
                      />
                    )}
                    <InlineStack gap="400" verticalAlign="start">
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          border: '2px solid #7c3aed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          zIndex: 1,
                          position: 'relative',
                        }}
                      >
                        <Icon name="check" size="small" />
                      </div>
                      <Card style={{ flex: 1 }}>
                        <Stack space="200">
                          <InlineStack gap="400" verticalAlign="center">
                            <Text weight="600">{event.title}</Text>
                            <Text variant="sm" color="subdued">
                              {event.eventDate.toLocaleDateString()}
                            </Text>
                          </InlineStack>
                          {event.description && (
                            <Text variant="sm" color="subdued">{event.description}</Text>
                          )}
                        </Stack>
                      </Card>
                    </InlineStack>
                  </div>
                ))}
              </Stack>
            </Stack>
          </Card>
        )}

        {activeTab === 'goals' && (
          <Card>
            <Stack space="500">
              <InlineStack gap="400" verticalAlign="center">
                <Heading level={2}>Goals</Heading>
                <Button variant="primary" size="small">
                  + Add Goal
                </Button>
              </InlineStack>

              <Stack space="400">
                {goals.map(goal => (
                  <Card key={goal.id}>
                    <Stack space="300">
                      <InlineStack gap="400" verticalAlign="center">
                        <Heading level={3}>{goal.goal}</Heading>
                        <Text
                          variant="sm"
                          weight="600"
                          style={{
                            color: goal.status === 'achieved' ? '#10b981' : goal.status === 'in-progress' ? '#3b82f6' : '#6b7280',
                            textTransform: 'capitalize',
                          }}
                        >
                          {goal.status}
                        </Text>
                      </InlineStack>
                      {goal.description && (
                        <Text variant="sm" color="subdued">{goal.description}</Text>
                      )}

                      {/* Milestones */}
                      {goal.milestones.length > 0 && (
                        <Stack space="200">
                          <Text variant="sm" weight="600">Milestones</Text>
                          {goal.milestones.map(milestone => (
                            <InlineStack key={milestone.id} gap="300" verticalAlign="center">
                              <Icon
                                name={milestone.status === 'completed' ? 'check-circle' : 'circle'}
                                size="small"
                                style={{
                                  color: milestone.status === 'completed' ? '#10b981' : milestone.status === 'missed' ? '#ef4444' : '#6b7280',
                                }}
                              />
                              <Text variant="sm">{milestone.description}</Text>
                              <Text variant="sm" color="subdued">
                                {milestone.completedDate
                                  ? `Completed ${milestone.completedDate.toLocaleDateString()}`
                                  : `Due ${milestone.targetDate.toLocaleDateString()}`
                                }
                              </Text>
                            </InlineStack>
                          ))}
                        </Stack>
                      )}

                      {/* Progress notes */}
                      {goal.progressNotes.length > 0 && (
                        <Stack space="200">
                          <Text variant="sm" weight="600">Progress Notes</Text>
                          {goal.progressNotes.map((note, idx) => (
                            <Text key={idx} variant="sm" color="subdued">• {note}</Text>
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Card>
        )}

        {activeTab === 'assessments' && (
          <Card>
            <Stack space="500">
              <InlineStack gap="400" verticalAlign="center">
                <Heading level={2}>Assessments</Heading>
                <Button variant="primary" size="small">
                  + Complete Assessment
                </Button>
              </InlineStack>

              <Stack space="400">
                {assessments.map(assessment => (
                  <Card key={assessment.id}>
                    <Stack space="300">
                      <Heading level={3}>{assessment.templateName}</Heading>
                      <Text variant="sm" color="subdued">
                        {assessment.assessmentType} • Completed {assessment.assessmentDate.toLocaleDateString()}
                      </Text>

                      {/* Scores */}
                      {assessment.scores && Object.keys(assessment.scores).length > 0 && (
                        <Stack space="200">
                          <Text variant="sm" weight="600">Scores</Text>
                          <InlineStack gap="400">
                            {Object.entries(assessment.scores).map(([key, value]) => (
                              <Card key={key}>
                                <Stack space="100">
                                  <Text variant="sm" color="subdued">{key}</Text>
                                  <Heading level={3}>{value}</Heading>
                                </Stack>
                              </Card>
                            ))}
                          </InlineStack>
                        </Stack>
                      )}

                      {/* Recommendations */}
                      {assessment.recommendations.length > 0 && (
                        <Stack space="200">
                          <Text variant="sm" weight="600">Recommendations</Text>
                          {assessment.recommendations.map((rec, idx) => (
                            <Text key={idx} variant="sm" color="subdued">• {rec}</Text>
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Card>
        )}

        {activeTab === 'services' && (
          <Card>
            <Stack space="500">
              <InlineStack gap="400" verticalAlign="center">
                <Heading level={2}>Services Received</Heading>
                <Text variant="sm" color="subdued">
                  Total: {metrics.totalServices} services
                  {metrics.totalServiceCost > 0 && ` • $${metrics.totalServiceCost.toLocaleString()}`}
                </Text>
              </InlineStack>

              <Stack space="300">
                {enrollment.servicesReceived.map(service => (
                  <Card key={service.id}>
                    <InlineStack gap="600">
                      <Stack space="100">
                        <Text weight="600">{service.serviceType}</Text>
                        <Text variant="sm" color="subdued">{service.date.toLocaleDateString()}</Text>
                      </Stack>
                      <Stack space="100">
                        <Text variant="sm" color="subdued">Amount</Text>
                        <Text weight="600">{service.amount} {service.unit}</Text>
                      </Stack>
                      <Stack space="100">
                        <Text variant="sm" color="subdued">Provider</Text>
                        <Text weight="600">{service.providedBy}</Text>
                      </Stack>
                    </InlineStack>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Card>
        )}

        {/* Complete Enrollment Modal */}
        {showCompleteModal && (
          <CompleteEnrollmentModal
            enrollment={enrollment}
            participantName={`${participant?.firstName} ${participant?.lastName}`}
            currentProgramName={program?.name || 'Unknown Program'}
            onClose={() => setShowCompleteModal(false)}
          />
        )}
      </Stack>
    </PageLayout>
  );
}
