'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Button,
  TextField,
  Select,
  SelectItem,
  Icon,
} from '@bonterratech/stitch-extension';
import { useServiceStore } from '@/lib/stores/serviceStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';
import {
  SERVICE_UNITS,
  ServiceOutcome,
  SERVICE_OUTCOMES,
} from '@/types/services';
import { HMIS_GENDER_CODES } from '@/types/poc';
import PageLayout from '../../../components/PageLayout';

interface RecordServicePageProps {
  params: Promise<{ id: string }>;
}

export default function RecordServicePage({ params }: RecordServicePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const enrollmentIdFromUrl = searchParams.get('enrollmentId');

  const {
    serviceTypes,
    createServiceTransaction,
    getTransactionsByParticipant,
    calculateServiceStats,
  } = useServiceStore();
  const { getEnrollmentsByParticipant } = useEnrollmentStore();
  const { participants } = useParticipantStore();
  const { caseWorkers } = useCaseWorkerStore();

  const participant = participants.find((p) => p.id === id);
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>('');
  const [formData, setFormData] = useState({
    serviceTypeId: '',
    serviceDate: new Date().toISOString().split('T')[0],
    quantity: '1',
    outcome: 'pending' as ServiceOutcome,
    notes: '',
    providedBy: caseWorkers[0]?.id || '',
  });

  const [showHistory, setShowHistory] = useState(false);

  const enrollments = participant
    ? getEnrollmentsByParticipant(participant.id)
    : [];
  const activeEnrollments = participant
    ? enrollments.filter((e) => e.status === 'active')
    : [];
  const enrollment = enrollments.find((e) => e.id === selectedEnrollment);
  const selectedServiceType = serviceTypes.find(
    (st) => st.id === formData.serviceTypeId,
  );

  // Pre-select enrollment if provided in URL
  useEffect(() => {
    if (
      enrollmentIdFromUrl &&
      enrollments.some((e) => e.id === enrollmentIdFromUrl)
    ) {
      setSelectedEnrollment(enrollmentIdFromUrl);
    } else if (activeEnrollments.length === 1) {
      // Auto-select if only one active enrollment
      setSelectedEnrollment(activeEnrollments[0].id);
    }
  }, [enrollmentIdFromUrl, enrollments, activeEnrollments]);

  // Filter services by enrollment's program
  const availableServices = enrollment
    ? serviceTypes.filter(
        (st) => st.active && st.programs.includes(enrollment.programId),
      )
    : [];

  const handleSubmit = () => {
    if (!participant || !selectedEnrollment || !formData.serviceTypeId) {
      alert('Please select enrollment and service type');
      return;
    }

    const serviceType = serviceTypes.find(
      (st) => st.id === formData.serviceTypeId,
    );
    if (!serviceType) {
      alert('Invalid service type');
      return;
    }

    createServiceTransaction({
      serviceTypeId: formData.serviceTypeId,
      participantId: participant.id,
      enrollmentId: selectedEnrollment,
      providedBy: formData.providedBy,
      serviceDate: new Date(formData.serviceDate),
      quantity: parseFloat(formData.quantity),
      unit: serviceType.unit,
      outcome: formData.outcome,
      notes: formData.notes,
      location: enrollment?.siteId,
    });

    // Reset form but keep enrollment selected
    setFormData({
      ...formData,
      serviceTypeId: '',
      quantity: '1',
      outcome: 'pending',
      notes: '',
    });

    // Show success and redirect after short delay
    alert('Service recorded successfully!');
    setTimeout(() => {
      router.push(`/participants/${participant.id}?tab=services`);
    }, 500);
  };

  const serviceHistory = participant
    ? getTransactionsByParticipant(participant.id)
    : [];

  const stats = participant
    ? calculateServiceStats({ participantId: participant.id })
    : null;

  if (!participant) {
    return (
      <PageLayout pageTitle="Record Service">
        <Card>
          <Stack space="300" style={{ padding: '40px', textAlign: 'center' }}>
            <Icon name="user" size="large" />
            <Heading level={3}>Participant not found</Heading>
            <Button
              variant="primary"
              onPress={() => router.push('/participants')}
            >
              Back to Individuals
            </Button>
          </Stack>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      pageTitle={`Record Service - ${participant.firstName} ${participant.lastName}`}
    >
      <Stack space="600">
        {/* Header */}
        <Stack space="300">
          <Button
            variant="secondary"
            onPress={() => router.push(`/participants/${participant.id}`)}
          >
            <Icon name="arrow-left" />
            Back to {participant.firstName}'s Profile
          </Button>
          <Heading level={1}>Record Service Delivery</Heading>
          <InlineStack gap="300" verticalAlign="center">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '600',
                color: '#ffffff',
              }}
            >
              {participant.firstName[0]}
              {participant.lastName[0]}
            </div>
            <div>
              <Text weight="600">
                {participant.firstName} {participant.lastName}
              </Text>
              <Text variant="sm" color="subdued">
                {HMIS_GENDER_CODES[participant.gender]}, DOB:{' '}
                {participant.dateOfBirth.toLocaleDateString()}
              </Text>
            </div>
          </InlineStack>
        </Stack>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px',
          }}
        >
          {/* Main Form */}
          <div>
            <Card>
              <Stack space="500">
                <Heading level={2}>Service Information</Heading>

                <Stack space="400">
                  {/* Enrollment Selection */}
                  <Select
                    label="Select Enrollment *"
                    placeholder="Choose an enrollment..."
                    selectedKey={selectedEnrollment}
                    onSelectionChange={(key) => {
                      setSelectedEnrollment(key as string);
                      setFormData({ ...formData, serviceTypeId: '' });
                    }}
                  >
                    {enrollments.map((e) => (
                      <SelectItem key={e.id} id={e.id}>
                        {e.id} -{' '}
                        {e.status === 'active'
                          ? '✓ Active'
                          : `Ended ${e.endDate?.toLocaleDateString()}`}
                      </SelectItem>
                    ))}
                  </Select>
                  {activeEnrollments.length === 0 && (
                    <Text variant="sm" style={{ color: '#f59e0b' }}>
                      Warning: No active enrollments for this participant
                    </Text>
                  )}

                  {/* Service Type Selection */}
                  {selectedEnrollment && (
                    <>
                      <Select
                        label="Service Type *"
                        placeholder="Choose a service..."
                        selectedKey={formData.serviceTypeId}
                        onSelectionChange={(key) => {
                          const st = serviceTypes.find((s) => s.id === key);
                          setFormData({
                            ...formData,
                            serviceTypeId: key as string,
                            quantity: st?.defaultAmount?.toString() || '1',
                          });
                        }}
                      >
                        {availableServices.map((st) => (
                          <SelectItem key={st.id} id={st.id}>
                            {st.name} ({SERVICE_UNITS[st.unit]})
                          </SelectItem>
                        ))}
                      </Select>
                      {selectedServiceType && (
                        <Text variant="sm" color="subdued">
                          {selectedServiceType.description}
                          {selectedServiceType.costPerUnit &&
                            selectedServiceType.costPerUnit > 0 && (
                              <span
                                style={{ color: '#3b82f6', marginLeft: '8px' }}
                              >
                                (${selectedServiceType.costPerUnit}/
                                {SERVICE_UNITS[
                                  selectedServiceType.unit
                                ].toLowerCase()}
                                )
                              </span>
                            )}
                        </Text>
                      )}

                      {/* Service Details */}
                      <InlineStack gap="400">
                        <TextField
                          label="Date *"
                          type="date"
                          value={formData.serviceDate}
                          onChange={(value) =>
                            setFormData({ ...formData, serviceDate: value })
                          }
                        />
                        <TextField
                          label={`Quantity * ${selectedServiceType ? `(${SERVICE_UNITS[selectedServiceType.unit]})` : ''}`}
                          type="number"
                          value={formData.quantity}
                          onChange={(value) =>
                            setFormData({ ...formData, quantity: value })
                          }
                        />
                      </InlineStack>

                      {selectedServiceType?.costPerUnit &&
                        parseFloat(formData.quantity) > 0 && (
                          <Text variant="sm" color="subdued">
                            Total Cost: $
                            {(
                              selectedServiceType.costPerUnit *
                              parseFloat(formData.quantity)
                            ).toFixed(2)}
                          </Text>
                        )}

                      <InlineStack gap="400">
                        <Select
                          label="Provided By"
                          selectedKey={formData.providedBy}
                          onSelectionChange={(key) =>
                            setFormData({
                              ...formData,
                              providedBy: key as string,
                            })
                          }
                        >
                          {caseWorkers.map((cw) => (
                            <SelectItem key={cw.id} id={cw.id}>
                              {cw.firstName} {cw.lastName} ({cw.role})
                            </SelectItem>
                          ))}
                        </Select>

                        <Select
                          label="Outcome"
                          selectedKey={formData.outcome}
                          onSelectionChange={(key) =>
                            setFormData({
                              ...formData,
                              outcome: key as ServiceOutcome,
                            })
                          }
                        >
                          {Object.entries(SERVICE_OUTCOMES).map(
                            ([key, label]) => (
                              <SelectItem key={key} id={key}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </Select>
                      </InlineStack>

                      <TextField
                        label="Notes"
                        value={formData.notes}
                        onChange={(value) =>
                          setFormData({ ...formData, notes: value })
                        }
                        placeholder="Additional details about this service..."
                      />

                      <InlineStack gap="300">
                        <Button
                          variant="secondary"
                          onPress={() =>
                            router.push(`/participants/${participant.id}`)
                          }
                        >
                          Cancel
                        </Button>
                        <Button variant="primary" onPress={handleSubmit}>
                          <Icon name="check" />
                          Record Service
                        </Button>
                      </InlineStack>
                    </>
                  )}
                </Stack>
              </Stack>
            </Card>
          </div>

          {/* Sidebar - Stats and History (Sticky) */}
          <div style={{ position: 'sticky', top: '20px', alignSelf: 'start' }}>
            <Stack space="500">
              {stats && (
                <Card>
                  <Stack space="400">
                    <Heading level={3}>Service Summary</Heading>
                    <Stack space="300">
                      <div>
                        <Text variant="sm" color="subdued">
                          Total Services
                        </Text>
                        <Heading level={2}>{stats.serviceCount}</Heading>
                      </div>
                      <div>
                        <Text variant="sm" color="subdued">
                          Total Cost
                        </Text>
                        <Heading level={2}>
                          ${stats.totalCost.toFixed(2)}
                        </Heading>
                      </div>
                      <div>
                        <Text variant="sm" color="subdued">
                          By Category
                        </Text>
                        <Stack space="200">
                          {Object.entries(stats.byCategory).map(
                            ([category, data]) => (
                              <InlineStack key={category} gap="200">
                                <Text
                                  variant="sm"
                                  style={{ textTransform: 'capitalize' }}
                                >
                                  {category}:
                                </Text>
                                <Text variant="sm" weight="600">
                                  {data.count} (${data.cost.toFixed(2)})
                                </Text>
                              </InlineStack>
                            ),
                          )}
                        </Stack>
                      </div>
                    </Stack>
                  </Stack>
                </Card>
              )}

              <Card>
                <Stack space="400">
                  <InlineStack
                    gap="300"
                    verticalAlign="center"
                    distribute="space-between"
                  >
                    <Heading level={3}>Service History</Heading>
                    <Button
                      variant="secondary"
                      size="small"
                      onPress={() => setShowHistory(!showHistory)}
                    >
                      {showHistory ? 'Hide' : 'Show'} ({serviceHistory.length})
                    </Button>
                  </InlineStack>

                  {showHistory && (
                    <Stack
                      space="300"
                      style={{ maxHeight: '400px', overflowY: 'auto' }}
                    >
                      {serviceHistory.length === 0 ? (
                        <Text variant="sm" color="subdued">
                          No services recorded yet
                        </Text>
                      ) : (
                        serviceHistory
                          .sort(
                            (a, b) =>
                              b.serviceDate.getTime() - a.serviceDate.getTime(),
                          )
                          .map((transaction) => {
                            const serviceType = serviceTypes.find(
                              (st) => st.id === transaction.serviceTypeId,
                            );
                            return (
                              <div
                                key={transaction.id}
                                style={{
                                  borderLeft: '4px solid #3b82f6',
                                  paddingLeft: '12px',
                                  paddingTop: '8px',
                                  paddingBottom: '8px',
                                }}
                              >
                                <Text variant="sm" weight="600">
                                  {serviceType?.name}
                                </Text>
                                <Text variant="sm" color="subdued">
                                  {transaction.serviceDate.toLocaleDateString()}{' '}
                                  • {transaction.quantity}{' '}
                                  {SERVICE_UNITS[
                                    transaction.unit
                                  ].toLowerCase()}
                                  {transaction.totalCost &&
                                    ` • $${transaction.totalCost.toFixed(2)}`}
                                </Text>
                                {transaction.notes && (
                                  <Text variant="sm" color="subdued">
                                    {transaction.notes}
                                  </Text>
                                )}
                              </div>
                            );
                          })
                      )}
                    </Stack>
                  )}
                </Stack>
              </Card>
            </Stack>
          </div>
        </div>
      </Stack>
    </PageLayout>
  );
}
