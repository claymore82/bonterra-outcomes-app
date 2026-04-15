'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Divider,
} from '@bonterratech/stitch-extension';
import { mockTouchpoints, mockEnrollments } from '@/lib/mockData';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';
import { HMIS_GENDER_CODES } from '@/types/poc';
import PageLayout from '../../components/PageLayout';
import SimpleBadge from '../../components/SimpleBadge';

const TOUCHPOINT_TYPE_LABELS = {
  'in-person': 'In-Person Meeting',
  phone: 'Phone Call',
  'home-visit': 'Home Visit',
  video: 'Video Call',
  email: 'Email',
  text: 'Text Message',
  'group-session': 'Group Session',
  other: 'Other',
};

export default function TouchpointDetailPage() {
  const params = useParams();
  const touchpointId = params.id as string;

  const { participants } = useParticipantStore();
  const { getProgram } = useProgramStore();
  const { getCaseWorker } = useCaseWorkerStore();

  const touchpoint = mockTouchpoints.find((t) => t.id === touchpointId);

  if (!touchpoint) {
    return (
      <PageLayout pageTitle="Touchpoint Not Found">
        <Stack space="400">
          <Card>
            <Stack space="300">
              <Text>Touchpoint not found</Text>
              <Link href="/case-notes">
                <Text color="link">← Back to Case Notes</Text>
              </Link>
            </Stack>
          </Card>
        </Stack>
      </PageLayout>
    );
  }

  const enrollment = mockEnrollments.find(
    (e) => e.id === touchpoint.enrollmentId,
  );
  const participant = participants.find(
    (p) => p.id === touchpoint.participantId,
  );
  const program = enrollment ? getProgram(enrollment.programId) : null;
  const caseWorker = touchpoint.caseWorkerId
    ? getCaseWorker(touchpoint.caseWorkerId)
    : null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const extractedData = touchpoint.extractedData;

  return (
    <PageLayout pageTitle="Touchpoint Details">
      <Stack space="400">
        {/* Header */}
        <Stack space="300">
          <Link href="/case-notes">
            <Text color="link">← Back to Case Notes</Text>
          </Link>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <Heading level={1}>Touchpoint Details</Heading>
              <Text color="subdued">
                {formatDate(touchpoint.createdAt)} at{' '}
                {formatTime(touchpoint.createdAt)}
              </Text>
            </div>
            <InlineStack gap="200">
              <SimpleBadge variant="primary">
                {TOUCHPOINT_TYPE_LABELS[touchpoint.touchpointType]}
              </SimpleBadge>
              {touchpoint.duration && (
                <SimpleBadge variant="neutral">
                  {touchpoint.duration} min
                </SimpleBadge>
              )}
            </InlineStack>
          </div>
        </Stack>

        {/* Main Content Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px',
          }}
        >
          {/* Main Content */}
          <Stack space="400">
            {/* Original Notes */}
            <Card>
              <Stack space="400">
                <div
                  style={{
                    padding: '16px 0',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <Heading level={2}>Original Case Notes</Heading>
                </div>
                <div>
                  <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {touchpoint.content}
                  </Text>
                  {touchpoint.location && (
                    <>
                      <Divider />
                      <Text variant="sm" color="subdued">
                        <strong>Location:</strong> {touchpoint.location}
                      </Text>
                    </>
                  )}
                </div>
              </Stack>
            </Card>

            {/* AI Extracted Data */}
            <Card>
              <Stack space="400">
                <div
                  style={{
                    padding: '16px 0',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '#f5f3ff',
                  }}
                >
                  <Heading level={2}>AI-Extracted Insights</Heading>
                </div>

                {/* Services Provided */}
                {extractedData.servicesProvided &&
                  extractedData.servicesProvided.length > 0 && (
                    <Stack space="300">
                      <Heading level={3}>Services Provided</Heading>
                      <Stack space="200">
                        {extractedData.servicesProvided.map((service, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px',
                              backgroundColor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                            }}
                          >
                            <Text weight="500">{service.serviceType}</Text>
                            <Text variant="sm" color="subdued">
                              {service.quantity} {service.unit}
                              {service.amount &&
                                ` - $${service.amount.toFixed(2)}`}{' '}
                              (confidence:{' '}
                              {Math.round(service.confidence * 100)}%)
                            </Text>
                          </div>
                        ))}
                      </Stack>
                      {touchpoint.servicesRecorded.length > 0 && (
                        <Text variant="sm" style={{ color: '#16a34a' }}>
                          ✓ {touchpoint.servicesRecorded.length} service
                          transaction(s) recorded
                        </Text>
                      )}
                    </Stack>
                  )}

                {/* Goal Progress */}
                {extractedData.progressOnGoals &&
                  extractedData.progressOnGoals.length > 0 && (
                    <Stack space="300">
                      <Heading level={3}>Goal Progress</Heading>
                      <Stack space="200">
                        {extractedData.progressOnGoals.map((progress, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px',
                              backgroundColor:
                                progress.status === 'positive'
                                  ? '#f0fdf4'
                                  : progress.status === 'negative'
                                    ? '#fef2f2'
                                    : '#f9fafb',
                              border: `1px solid ${
                                progress.status === 'positive'
                                  ? '#bbf7d0'
                                  : progress.status === 'negative'
                                    ? '#fecaca'
                                    : '#e5e7eb'
                              }`,
                              borderRadius: '6px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '4px',
                              }}
                            >
                              <SimpleBadge
                                variant={
                                  progress.status === 'positive'
                                    ? 'success'
                                    : progress.status === 'negative'
                                      ? 'danger'
                                      : 'neutral'
                                }
                              >
                                {progress.status}
                              </SimpleBadge>
                              <Text variant="sm" weight="500">
                                {progress.goal}
                              </Text>
                              {progress.percentComplete && (
                                <Text
                                  variant="sm"
                                  color="subdued"
                                  style={{ marginLeft: 'auto' }}
                                >
                                  {progress.percentComplete}% complete
                                </Text>
                              )}
                            </div>
                            <Text variant="sm">{progress.notes}</Text>
                          </div>
                        ))}
                      </Stack>
                    </Stack>
                  )}

                {/* Outcome Achievements */}
                {extractedData.outcomeAchievements &&
                  extractedData.outcomeAchievements.length > 0 && (
                    <Stack space="300">
                      <Heading level={3}>Outcome Achievements</Heading>
                      <Stack space="200">
                        {extractedData.outcomeAchievements.map(
                          (outcome, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '12px',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px',
                              }}
                            >
                              <Text weight="500">{outcome.goal}</Text>
                              <Text variant="sm">{outcome.evidence}</Text>
                              <Text variant="sm" color="subdued">
                                {formatDate(outcome.date)} (confidence:{' '}
                                {Math.round(outcome.confidence * 100)}%)
                              </Text>
                            </div>
                          ),
                        )}
                      </Stack>
                    </Stack>
                  )}

                {/* Status Changes */}
                {(extractedData.employmentChange ||
                  extractedData.housingChange ||
                  extractedData.incomeChange ||
                  extractedData.healthChange) && (
                  <Stack space="300">
                    <Heading level={3}>Status Changes</Heading>
                    <Stack space="200">
                      {extractedData.employmentChange && (
                        <div
                          style={{
                            padding: '12px',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                          }}
                        >
                          <Text variant="sm" weight="500">
                            Employment Change
                          </Text>
                          <Text variant="sm">
                            {extractedData.employmentChange.from} →{' '}
                            {extractedData.employmentChange.to}
                          </Text>
                          <Text variant="sm" color="subdued">
                            {extractedData.employmentChange.description}
                          </Text>
                        </div>
                      )}
                      {extractedData.housingChange && (
                        <div
                          style={{
                            padding: '12px',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                          }}
                        >
                          <Text variant="sm" weight="500">
                            Housing Change
                          </Text>
                          <Text variant="sm">
                            {extractedData.housingChange.from} →{' '}
                            {extractedData.housingChange.to}
                          </Text>
                          <Text variant="sm" color="subdued">
                            {extractedData.housingChange.description}
                          </Text>
                        </div>
                      )}
                      {extractedData.incomeChange && (
                        <div
                          style={{
                            padding: '12px',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                          }}
                        >
                          <Text variant="sm" weight="500">
                            Income Change
                          </Text>
                          <Text variant="sm">
                            {extractedData.incomeChange.from} →{' '}
                            {extractedData.incomeChange.to}
                          </Text>
                          <Text variant="sm" color="subdued">
                            {extractedData.incomeChange.description}
                          </Text>
                        </div>
                      )}
                      {extractedData.healthChange && (
                        <div
                          style={{
                            padding: '12px',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                          }}
                        >
                          <Text variant="sm" weight="500">
                            Health Change
                          </Text>
                          <Text variant="sm">
                            {extractedData.healthChange.from} →{' '}
                            {extractedData.healthChange.to}
                          </Text>
                          <Text variant="sm" color="subdued">
                            {extractedData.healthChange.description}
                          </Text>
                        </div>
                      )}
                    </Stack>
                  </Stack>
                )}

                {/* Risk Flags */}
                {extractedData.riskFlags &&
                  extractedData.riskFlags.length > 0 && (
                    <Stack space="300">
                      <Heading level={3}>Risk Flags</Heading>
                      <Stack space="200">
                        {extractedData.riskFlags.map((risk, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px',
                              backgroundColor:
                                risk.severity === 'high'
                                  ? '#fef2f2'
                                  : risk.severity === 'medium'
                                    ? '#fefce8'
                                    : '#eff6ff',
                              border: `1px solid ${
                                risk.severity === 'high'
                                  ? '#fca5a5'
                                  : risk.severity === 'medium'
                                    ? '#fde047'
                                    : '#93c5fd'
                              }`,
                              borderRadius: '6px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <SimpleBadge
                                variant={
                                  risk.severity === 'high'
                                    ? 'danger'
                                    : risk.severity === 'medium'
                                      ? 'warning'
                                      : 'info'
                                }
                              >
                                {risk.severity}
                              </SimpleBadge>
                              <Text
                                variant="sm"
                                weight="500"
                                style={{ textTransform: 'capitalize' }}
                              >
                                {risk.type}
                              </Text>
                            </div>
                            <Text variant="sm">{risk.description}</Text>
                          </div>
                        ))}
                      </Stack>
                    </Stack>
                  )}

                {/* Action Items */}
                {extractedData.actionItems &&
                  extractedData.actionItems.length > 0 && (
                    <Stack space="300">
                      <Heading level={3}>Action Items</Heading>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {extractedData.actionItems.map((item, idx) => (
                          <li
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              marginBottom: '8px',
                            }}
                          >
                            <span
                              style={{ color: '#7c3aed', marginRight: '8px' }}
                            >
                              •
                            </span>
                            <div>
                              <Text variant="sm">{item.description}</Text>
                              {item.dueDate && (
                                <Text variant="sm" color="subdued">
                                  {' '}
                                  Due: {formatDate(item.dueDate)}
                                </Text>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Stack>
                  )}

                {/* Emotional State */}
                {extractedData.emotionalState && (
                  <Stack space="200">
                    <Heading level={3}>Emotional State</Heading>
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: '#faf5ff',
                        border: '1px solid #e9d5ff',
                        borderRadius: '6px',
                      }}
                    >
                      <Text
                        variant="sm"
                        weight="500"
                        style={{
                          color: '#7c3aed',
                          textTransform: 'capitalize',
                        }}
                      >
                        {extractedData.emotionalState.primary}
                      </Text>
                      <Text variant="sm">
                        {extractedData.emotionalState.description}
                      </Text>
                    </div>
                  </Stack>
                )}

                {/* New Needs */}
                {extractedData.newNeeds &&
                  extractedData.newNeeds.length > 0 && (
                    <Stack space="200">
                      <Heading level={3}>New Needs Identified</Heading>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {extractedData.newNeeds.map((need, idx) => (
                          <li
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              marginBottom: '4px',
                            }}
                          >
                            <span
                              style={{ color: '#7c3aed', marginRight: '8px' }}
                            >
                              •
                            </span>
                            <Text variant="sm">{need}</Text>
                          </li>
                        ))}
                      </ul>
                    </Stack>
                  )}
              </Stack>
            </Card>
          </Stack>

          {/* Sidebar - Context */}
          <Stack space="400">
            {/* Participant Info */}
            {participant && (
              <Card>
                <Stack space="300">
                  <Heading level={3}>Participant</Heading>
                  <Stack space="200">
                    <div>
                      <Text variant="sm" color="subdued">
                        Name
                      </Text>
                      <Text weight="500">
                        {participant.firstName} {participant.lastName}
                      </Text>
                    </div>
                    <div>
                      <Text variant="sm" color="subdued">
                        Gender
                      </Text>
                      <Text variant="sm">
                        {HMIS_GENDER_CODES[participant.gender]}
                      </Text>
                    </div>
                    {participant.phoneNumber && (
                      <div>
                        <Text variant="sm" color="subdued">
                          Phone
                        </Text>
                        <Text variant="sm">{participant.phoneNumber}</Text>
                      </div>
                    )}
                    {participant.email && (
                      <div>
                        <Text variant="sm" color="subdued">
                          Email
                        </Text>
                        <Text variant="sm">{participant.email}</Text>
                      </div>
                    )}
                  </Stack>
                </Stack>
              </Card>
            )}

            {/* Enrollment Info */}
            {enrollment && program && (
              <Card>
                <Stack space="300">
                  <Heading level={3}>Enrollment</Heading>
                  <Stack space="200">
                    <div>
                      <Text variant="sm" color="subdued">
                        Program
                      </Text>
                      <Text weight="500">{program.name}</Text>
                    </div>
                    <div>
                      <Text variant="sm" color="subdued">
                        Enrollment Date
                      </Text>
                      <Text variant="sm">
                        {formatDate(enrollment.startDate)}
                      </Text>
                    </div>
                    <div>
                      <Text variant="sm" color="subdued">
                        Status
                      </Text>
                      <SimpleBadge
                        variant="success"
                        style={{ textTransform: 'capitalize' }}
                      >
                        {enrollment.status}
                      </SimpleBadge>
                    </div>
                  </Stack>
                </Stack>
              </Card>
            )}

            {/* Case Worker Info */}
            {caseWorker && (
              <Card>
                <Stack space="300">
                  <Heading level={3}>Case Worker</Heading>
                  <Stack space="200">
                    <div>
                      <Text variant="sm" color="subdued">
                        Name
                      </Text>
                      <Text weight="500">
                        {caseWorker.firstName} {caseWorker.lastName}
                      </Text>
                    </div>
                    <div>
                      <Text variant="sm" color="subdued">
                        Role
                      </Text>
                      <Text variant="sm">{caseWorker.role}</Text>
                    </div>
                    {caseWorker.email && (
                      <div>
                        <Text variant="sm" color="subdued">
                          Email
                        </Text>
                        <Text variant="sm">{caseWorker.email}</Text>
                      </div>
                    )}
                  </Stack>
                </Stack>
              </Card>
            )}
          </Stack>
        </div>
      </Stack>
    </PageLayout>
  );
}
