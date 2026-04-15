'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Button,
  TextField,
  Icon,
} from '@bonterratech/stitch-extension';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useSiteStore } from '@/lib/stores/siteStore';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';
import { useUserStore } from '@/lib/stores/userStore';
import { useHouseholdStore } from '@/lib/stores/householdStore';
import { useEntityStore } from '@/lib/stores/entityStore';
import { EnrolleeType } from '@/types/poc';
import PageLayout from '../components/PageLayout';

interface SelectionCardProps {
  isSelected: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  description: string;
}

function SelectionCard({
  isSelected,
  onClick,
  icon,
  title,
  description,
}: SelectionCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '24px',
        border: isSelected ? '2px solid #7C3AED' : '2px solid #E5E7EB',
        borderRadius: '12px',
        backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: '100%',
        textAlign: 'center',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#D1D5DB';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#E5E7EB';
        }
      }}
    >
      <Stack space="200" align="center">
        <Icon name={icon as any} size="xlarge" />
        <Heading level={3}>{title}</Heading>
        <Text variant="sm" color="subdued">
          {description}
        </Text>
      </Stack>
    </button>
  );
}

interface RadioCardProps {
  isSelected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}

function RadioCard({ isSelected, onClick, title, subtitle }: RadioCardProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        border: isSelected ? '2px solid #7C3AED' : '1px solid #E5E7EB',
        borderRadius: '8px',
        backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#D1D5DB';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#E5E7EB';
        }
      }}
    >
      <input
        type="radio"
        checked={isSelected}
        onChange={onClick}
        style={{ marginRight: '16px', width: '16px', height: '16px' }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ fontSize: '14px', color: '#6B7280' }}>{subtitle}</div>
      </div>
    </label>
  );
}

export default function EnrollPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { participants, createParticipant } = useParticipantStore();
  const { createEnrollment } = useEnrollmentStore();
  const { programs } = useProgramStore();
  const { sites } = useSiteStore();
  const { caseWorkers } = useCaseWorkerStore();
  const { households } = useHouseholdStore();
  const { entities } = useEntityStore();
  const { currentProgramId, currentSiteId, currentTenantId } = useUserStore();

  // State
  const [enrolleeType, setEnrolleeType] = useState<EnrolleeType>('participant');
  const [selectedEnrolleeId, setSelectedEnrolleeId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pre-select participant from URL query parameter
  useEffect(() => {
    const participantId = searchParams.get('participantId');
    if (participantId && participants.find((p) => p.id === participantId)) {
      setEnrolleeType('participant');
      setSelectedEnrolleeId(participantId);
    }
  }, [searchParams, participants]);

  // Program/site selection (use master selectors as defaults)
  const [programId, setProgramId] = useState(currentProgramId || '');
  const [siteId, setSiteId] = useState(currentSiteId || '');
  const [caseWorkerId, setCaseWorkerId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState('');
  const [enrolleeName, setEnrolleeName] = useState('');

  const activePrograms = programs.filter((p) => p.active);
  const activeSites = sites.filter((s) => s.active);
  const activeCaseWorkers = caseWorkers.filter((cw) => cw.status === 'active');

  // Filter lists based on search
  const filteredParticipants = useMemo(() => {
    if (!searchQuery) return participants;
    const query = searchQuery.toLowerCase();
    return participants.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.phone?.includes(query),
    );
  }, [participants, searchQuery]);

  const filteredHouseholds = useMemo(() => {
    if (!searchQuery) return households;
    const query = searchQuery.toLowerCase();
    return households.filter((h) =>
      h.householdName.toLowerCase().includes(query),
    );
  }, [households, searchQuery]);

  const filteredEntities = useMemo(() => {
    if (!searchQuery) return entities;
    const query = searchQuery.toLowerCase();
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.entityType.toLowerCase().includes(query),
    );
  }, [entities, searchQuery]);

  const handleSubmit = async () => {
    // Validation
    if (!programId) {
      alert('Please select a program from the header dropdown');
      return;
    }

    if (!selectedEnrolleeId) {
      alert(`Please select a ${enrolleeType}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const enrolleeId = selectedEnrolleeId;
      let name = '';

      // Get name from selected enrollee
      if (enrolleeType === 'participant') {
        const participant = participants.find((p) => p.id === enrolleeId);
        name = participant
          ? `${participant.firstName} ${participant.lastName}`
          : 'Participant';
      } else if (enrolleeType === 'family') {
        const family = households.find((h) => h.id === enrolleeId);
        name = family ? family.householdName : 'Family';
      } else if (enrolleeType === 'entity') {
        const entity = entities.find((e) => e.id === enrolleeId);
        name = entity ? entity.name : 'Entity';
      }

      // Create enrollment
      const enrollment = createEnrollment({
        tenantId: currentTenantId || 'TENANT-001',
        enrolleeType,
        enrolleeId,
        participantId: enrolleeType === 'participant' ? enrolleeId : undefined,
        householdId: enrolleeType === 'family' ? enrolleeId : undefined,
        programId,
        siteId: siteId || undefined,
        caseWorkerId: caseWorkerId || undefined,
        status: 'active',
        startDate: new Date(),
        outcomes: [],
        servicesReceived: [],
        outcomeGoals: [],
      });

      setEnrollmentId(enrollment.id);
      setEnrolleeName(name);
      setShowSuccess(true);
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Error creating enrollment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEnrolleeType('participant');
    setSelectedEnrolleeId('');
    setSearchQuery('');
    setProgramId(currentProgramId || '');
    setSiteId(currentSiteId || '');
    setCaseWorkerId('');
    setShowSuccess(false);
    setEnrollmentId('');
    setEnrolleeName('');
  };

  const getEnrolleeTypeLabel = () => {
    switch (enrolleeType) {
      case 'participant':
        return 'Participant';
      case 'family':
        return 'Family';
      case 'entity':
        return 'Entity';
    }
  };

  if (showSuccess) {
    return (
      <PageLayout>
        <Stack space="600">
          <Card>
            <Stack space="500">
              <div style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '48px' }}>✅</Text>
                <Heading level={1}>Enrollment Complete!</Heading>
              </div>

              <Stack space="300">
                <Text>
                  <strong>{enrolleeName || getEnrolleeTypeLabel()}</strong> has
                  been successfully enrolled.
                </Text>
                <Text variant="sm" color="subdued">
                  Enrollment ID: {enrollmentId}
                </Text>
              </Stack>

              <InlineStack gap="300">
                <Button variant="primary" onPress={resetForm}>
                  Create Another Enrollment
                </Button>
                <Button variant="secondary" onPress={() => router.push('/')}>
                  Go to Home
                </Button>
              </InlineStack>
            </Stack>
          </Card>
        </Stack>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Stack space="600">
        {/* Header */}
        <Stack space="300">
          <Link href="/">
            <Text color="link">← Back to Home</Text>
          </Link>
          <Heading level={1}>Manual Enrollment</Heading>
          <Text>
            Quickly enroll existing participants, families, or entities in
            programs
          </Text>
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fbbf24',
            }}
          >
            <Text variant="sm">
              💡 <strong>Looking to create a new participant?</strong> Use the{' '}
              <Link
                href="/intake"
                style={{ color: '#7c3aed', textDecoration: 'underline' }}
              >
                Intake Agent
              </Link>{' '}
              for AI-assisted data collection.
            </Text>
          </div>
        </Stack>

        {/* Step 1: Select Enrollment Type */}
        <Card>
          <Stack space="400">
            <Heading level={2}>Step 1: Select Type</Heading>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
              }}
            >
              <SelectionCard
                isSelected={enrolleeType === 'participant'}
                onClick={() => {
                  setEnrolleeType('participant');
                  setSelectedEnrolleeId('');
                }}
                icon="user"
                title="Participant"
                description="Enroll an individual"
              />
              <SelectionCard
                isSelected={enrolleeType === 'family'}
                onClick={() => {
                  setEnrolleeType('family');
                  setSelectedEnrolleeId('');
                }}
                icon="users"
                title="Family"
                description="Enroll a household"
              />
              <SelectionCard
                isSelected={enrolleeType === 'entity'}
                onClick={() => {
                  setEnrolleeType('entity');
                  setSelectedEnrolleeId('');
                }}
                icon="building"
                title="Entity"
                description="Enroll an institution"
              />
            </div>
          </Stack>
        </Card>

        {/* Step 2: Search & Select */}
        <Card>
          <Stack space="400">
            <Heading level={2}>
              Step 2: Search & Select {getEnrolleeTypeLabel()}
            </Heading>

            <TextField
              label={`Search ${getEnrolleeTypeLabel()}s`}
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search by name${enrolleeType === 'participant' ? ', email, or phone' : ''}...`}
            />

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Stack space="200">
                {enrolleeType === 'participant' &&
                  (filteredParticipants.length === 0 ? (
                    <Text
                      color="subdued"
                      style={{ textAlign: 'center', padding: '32px 0' }}
                    >
                      No participants found
                    </Text>
                  ) : (
                    filteredParticipants.map((participant) => (
                      <RadioCard
                        key={participant.id}
                        isSelected={selectedEnrolleeId === participant.id}
                        onClick={() => setSelectedEnrolleeId(participant.id)}
                        title={`${participant.firstName} ${participant.lastName}`}
                        subtitle={`${participant.email || 'No email'} • ${participant.phone || 'No phone'}`}
                      />
                    ))
                  ))}

                {enrolleeType === 'family' &&
                  (filteredHouseholds.length === 0 ? (
                    <Text
                      color="subdued"
                      style={{ textAlign: 'center', padding: '32px 0' }}
                    >
                      No families found
                    </Text>
                  ) : (
                    filteredHouseholds.map((household) => (
                      <RadioCard
                        key={household.id}
                        isSelected={selectedEnrolleeId === household.id}
                        onClick={() => setSelectedEnrolleeId(household.id)}
                        title={household.householdName}
                        subtitle={`${household.members.length} members`}
                      />
                    ))
                  ))}

                {enrolleeType === 'entity' &&
                  (filteredEntities.length === 0 ? (
                    <Text
                      color="subdued"
                      style={{ textAlign: 'center', padding: '32px 0' }}
                    >
                      No entities found
                    </Text>
                  ) : (
                    filteredEntities.map((entity) => (
                      <RadioCard
                        key={entity.id}
                        isSelected={selectedEnrolleeId === entity.id}
                        onClick={() => setSelectedEnrolleeId(entity.id)}
                        title={entity.name}
                        subtitle={`${entity.entityType} • ${entity.partnershipStatus}`}
                      />
                    ))
                  ))}
              </Stack>
            </div>
          </Stack>
        </Card>

        {/* Submit Buttons */}
        <Card>
          <Stack space="400">
            <Text variant="sm" color="subdued">
              <strong>Note:</strong> Program and site are selected from the
              header dropdowns.
              {!programId && (
                <span style={{ color: '#DC2626' }}>
                  {' '}
                  Please select a program before enrolling.
                </span>
              )}
            </Text>

            <InlineStack gap="300">
              <Button
                variant="primary"
                onPress={handleSubmit}
                isDisabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Creating Enrollment...'
                  : 'Complete Enrollment'}
              </Button>
              <Button variant="secondary" onPress={() => router.push('/')}>
                Cancel
              </Button>
            </InlineStack>
          </Stack>
        </Card>
      </Stack>
    </PageLayout>
  );
}
