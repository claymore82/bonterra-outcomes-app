'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from '@bonterratech/stitch-extension';
import { useServiceStore } from '@/lib/stores/serviceStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { SERVICE_UNITS, ServiceOutcome, SERVICE_OUTCOMES } from '@/types/services';
import { HMIS_GENDER_CODES } from '@/types/poc';
import PageLayout from '../../components/PageLayout';

export default function RecordServicePage() {
  const { serviceTypes, createServiceTransaction, getTransactionsByParticipant, calculateServiceStats, calculateProgramSpending } = useServiceStore();
  const { getEnrollmentsByParticipant } = useEnrollmentStore();
  const { participants } = useParticipantStore();
  const { caseWorkers } = useCaseWorkerStore();
  const { programs } = useProgramStore();

  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
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

  const participant = participants.find(p => p.id === selectedParticipant);
  const enrollments = participant ? getEnrollmentsByParticipant(participant.id) : [];
  const activeEnrollments = participant ? enrollments.filter(e => e.status === 'active') : [];
  const enrollment = enrollments.find(e => e.id === selectedEnrollment);
  const selectedServiceType = serviceTypes.find(st => st.id === formData.serviceTypeId);

  // Filter services by enrollment's program
  const availableServices = enrollment
    ? serviceTypes.filter(st => st.active && st.programs.includes(enrollment.programId))
    : [];

  // Budget calculations
  const program = enrollment ? programs.find(p => p.id === enrollment.programId) : null;
  const programBudget = program?.budget || 0;
  const programSpending = program ? calculateProgramSpending(program.id) : 0;
  const remainingFunds = programBudget - programSpending;
  const serviceCost = selectedServiceType?.costPerUnit ? selectedServiceType.costPerUnit * parseFloat(formData.quantity || '0') : 0;
  const hasSufficientFunds = !programBudget || serviceCost <= remainingFunds;
  const budgetUtilization = programBudget ? (programSpending / programBudget) * 100 : 0;

  const handleSubmit = () => {
    if (!selectedParticipant || !selectedEnrollment || !formData.serviceTypeId) {
      alert('Please select participant, enrollment, and service type');
      return;
    }

    const serviceType = serviceTypes.find(st => st.id === formData.serviceTypeId);
    if (!serviceType) {
      alert('Invalid service type');
      return;
    }

    // Check budget availability if the service has a cost and the program has a budget
    if (enrollment && serviceType.costPerUnit) {
      const program = programs.find(p => p.id === enrollment.programId);
      if (program && program.budget) {
        const currentSpending = calculateProgramSpending(program.id);
        const serviceCost = serviceType.costPerUnit * parseFloat(formData.quantity);
        const remainingFunds = program.budget - currentSpending;

        if (serviceCost > remainingFunds) {
          alert(
            `Insufficient funds!\n\n` +
            `Program: ${program.name}\n` +
            `Service cost: $${serviceCost.toFixed(2)}\n` +
            `Available funds: $${remainingFunds.toFixed(2)}\n` +
            `Budget: $${program.budget.toFixed(2)}\n` +
            `Already spent: $${currentSpending.toFixed(2)}\n\n` +
            `Cannot provide this service due to insufficient program funds.`
          );
          return;
        }
      }
    }

    createServiceTransaction({
      serviceTypeId: formData.serviceTypeId,
      participantId: selectedParticipant,
      enrollmentId: selectedEnrollment,
      providedBy: formData.providedBy,
      serviceDate: new Date(formData.serviceDate),
      quantity: parseFloat(formData.quantity),
      unit: serviceType.unit,
      outcome: formData.outcome,
      notes: formData.notes,
      location: enrollment?.siteId,
    });

    alert('Service recorded successfully!');

    // Reset form but keep participant and enrollment selected
    setFormData({
      ...formData,
      serviceTypeId: '',
      quantity: '1',
      outcome: 'pending',
      notes: '',
    });
  };

  const serviceHistory = selectedParticipant
    ? getTransactionsByParticipant(selectedParticipant)
    : [];

  const stats = selectedParticipant
    ? calculateServiceStats({ participantId: selectedParticipant })
    : null;

  return (
    <PageLayout pageTitle="Record Service">
      <Stack space="600">
        {/* Header */}
        <Stack space="300">
          <Link href="/">
            <Text color="link">← Back to Home</Text>
          </Link>
          <Heading level={1}>Record Service Delivery</Heading>
          <Text>Document services provided to participants</Text>
        </Stack>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Form */}
          <Stack space="500">
            <Card>
              <Stack space="500">
                <Heading level={2}>Service Information</Heading>

                <Stack space="400">
                  {/* Participant Selection */}
                  <Select
                    label="Select Participant *"
                    placeholder="Choose a participant..."
                    selectedKey={selectedParticipant}
                    onSelectionChange={(key) => {
                      setSelectedParticipant(key as string);
                      setSelectedEnrollment('');
                      setFormData({ ...formData, serviceTypeId: '' });
                    }}
                  >
                    {participants.map((p) => (
                      <SelectItem key={p.id} id={p.id}>
                        {p.firstName} {p.lastName} ({HMIS_GENDER_CODES[p.gender]}, DOB: {p.dateOfBirth.toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Enrollment Selection */}
                  {selectedParticipant && (
                    <>
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
                            {e.id} - {e.status === 'active' ? '✓ Active' : `Ended ${e.endDate?.toLocaleDateString()}`}
                          </SelectItem>
                        ))}
                      </Select>
                      {activeEnrollments.length === 0 && (
                        <Text variant="sm" style={{ color: '#f59e0b' }}>
                          Warning: No active enrollments for this participant
                        </Text>
                      )}
                    </>
                  )}

                  {/* Service Type Selection */}
                  {selectedEnrollment && (
                    <>
                      <Select
                        label="Service Type *"
                        placeholder="Choose a service..."
                        selectedKey={formData.serviceTypeId}
                        onSelectionChange={(key) => {
                          const st = serviceTypes.find(s => s.id === key);
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
                          {selectedServiceType.costPerUnit && selectedServiceType.costPerUnit > 0 && (
                            <span style={{ color: '#3b82f6', marginLeft: '8px' }}>
                              (${selectedServiceType.costPerUnit}/{SERVICE_UNITS[selectedServiceType.unit].toLowerCase()})
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
                          onChange={(value) => setFormData({ ...formData, serviceDate: value })}
                        />
                        <TextField
                          label={`Quantity * ${selectedServiceType ? `(${SERVICE_UNITS[selectedServiceType.unit]})` : ''}`}
                          type="number"
                          value={formData.quantity}
                          onChange={(value) => setFormData({ ...formData, quantity: value })}
                        />
                      </InlineStack>

                      {selectedServiceType?.costPerUnit && parseFloat(formData.quantity) > 0 && (
                        <Stack space="200">
                          <Text variant="sm" color="subdued">
                            Total Cost: ${(selectedServiceType.costPerUnit * parseFloat(formData.quantity)).toFixed(2)}
                          </Text>
                          {program && programBudget > 0 && (
                            <div style={{
                              padding: '12px',
                              backgroundColor: !hasSufficientFunds ? '#fef2f2' : budgetUtilization > 75 ? '#fffbeb' : '#f0fdf4',
                              border: !hasSufficientFunds ? '1px solid #fecaca' : budgetUtilization > 75 ? '1px solid #fcd34d' : '1px solid #86efac',
                              borderRadius: '6px',
                            }}>
                              <Stack space="200">
                                <Text variant="sm" weight="600" style={{
                                  color: !hasSufficientFunds ? '#dc2626' : budgetUtilization > 75 ? '#92400e' : '#166534'
                                }}>
                                  {!hasSufficientFunds ? '❌ Insufficient Funds' : budgetUtilization > 90 ? '⚠️ Low Funds' : '✓ Funds Available'}
                                </Text>
                                <Text variant="sm" style={{
                                  color: !hasSufficientFunds ? '#991b1b' : budgetUtilization > 75 ? '#92400e' : '#166534'
                                }}>
                                  Program: {program.name}<br />
                                  Remaining: ${remainingFunds.toFixed(2)} of ${programBudget.toFixed(2)}<br />
                                  {!hasSufficientFunds && `Need: $${serviceCost.toFixed(2)} (Shortfall: $${(serviceCost - remainingFunds).toFixed(2)})`}
                                </Text>
                              </Stack>
                            </div>
                          )}
                        </Stack>
                      )}

                      <InlineStack gap="400">
                        <Select
                          label="Provided By"
                          selectedKey={formData.providedBy}
                          onSelectionChange={(key) => setFormData({ ...formData, providedBy: key as string })}
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
                          onSelectionChange={(key) => setFormData({ ...formData, outcome: key as ServiceOutcome })}
                        >
                          {Object.entries(SERVICE_OUTCOMES).map(([key, label]) => (
                            <SelectItem key={key} id={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </Select>
                      </InlineStack>

                      <TextField
                        label="Notes"
                        value={formData.notes}
                        onChange={(value) => setFormData({ ...formData, notes: value })}
                        placeholder="Additional details about this service..."
                      />

                      <Button
                        variant="primary"
                        onPress={handleSubmit}
                      >
                        Record Service
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Card>
          </Stack>

          {/* Sidebar - Stats and History */}
          <Stack space="500">
            {selectedParticipant && stats && (
              <Card>
                <Stack space="400">
                  <Heading level={3}>Service Summary</Heading>
                  <Stack space="300">
                    <div>
                      <Text variant="sm" color="subdued">Total Services</Text>
                      <Heading level={2}>{stats.serviceCount}</Heading>
                    </div>
                    <div>
                      <Text variant="sm" color="subdued">Total Cost</Text>
                      <Heading level={2}>${stats.totalCost.toFixed(2)}</Heading>
                    </div>
                    <div>
                      <Text variant="sm" color="subdued">By Category</Text>
                      <Stack space="200">
                        {Object.entries(stats.byCategory).map(([category, data]) => (
                          <InlineStack key={category} gap="200">
                            <Text variant="sm" style={{ textTransform: 'capitalize' }}>{category}:</Text>
                            <Text variant="sm" weight="600">{data.count} (${data.cost.toFixed(2)})</Text>
                          </InlineStack>
                        ))}
                      </Stack>
                    </div>
                  </Stack>
                </Stack>
              </Card>
            )}

            {selectedParticipant && (
              <Card>
                <Stack space="400">
                  <InlineStack gap="300" verticalAlign="center">
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
                    <Stack space="300" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {serviceHistory.length === 0 ? (
                        <Text variant="sm" color="subdued">No services recorded yet</Text>
                      ) : (
                        serviceHistory
                          .sort((a, b) => b.serviceDate.getTime() - a.serviceDate.getTime())
                          .map((transaction) => {
                            const serviceType = serviceTypes.find(st => st.id === transaction.serviceTypeId);
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
                                <Text variant="sm" weight="600">{serviceType?.name}</Text>
                                <Text variant="sm" color="subdued">
                                  {transaction.serviceDate.toLocaleDateString()} • {transaction.quantity} {SERVICE_UNITS[transaction.unit].toLowerCase()}
                                  {transaction.totalCost && ` • $${transaction.totalCost.toFixed(2)}`}
                                </Text>
                                {transaction.notes && (
                                  <Text variant="sm" color="subdued">{transaction.notes}</Text>
                                )}
                              </div>
                            );
                          })
                      )}
                    </Stack>
                  )}
                </Stack>
              </Card>
            )}
          </Stack>
        </div>
      </Stack>
    </PageLayout>
  );
}
