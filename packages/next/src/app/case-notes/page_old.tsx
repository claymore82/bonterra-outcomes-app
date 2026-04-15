'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Stack,
  Heading,
  Text,
  Button,
  Select,
  SelectItem,
  TextField,
  Checkbox,
} from '@bonterratech/stitch-extension';
import { Touchpoint, TouchpointType, TouchpointExtraction } from '@/types/poc';
import { useProgramStore } from '@/lib/stores/programStore';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';
import { useTouchpointFieldStore } from '@/lib/stores/touchpointFieldStore';
import { useTouchpointStore } from '@/lib/stores/touchpointStore';
import { useUserStore } from '@/lib/stores/userStore';
import PageLayout from '../components/PageLayout';

const TOUCHPOINT_TYPES: { value: TouchpointType; label: string }[] = [
  { value: 'in-person', label: 'In-Person Meeting' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'home-visit', label: 'Home Visit' },
  { value: 'video', label: 'Video Call' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text Message' },
  { value: 'group-session', label: 'Group Session' },
  { value: 'other', label: 'Other' },
];

export default function TouchpointsPage() {
  const { programs, getProgram } = useProgramStore();
  const { participants } = useParticipantStore();
  const { enrollments, getEnrollmentById } = useEnrollmentStore();
  const { getCaseWorker, getActiveCaseWorkers } = useCaseWorkerStore();
  const { getActiveFields } = useTouchpointFieldStore();
  const { createTouchpoint, getTouchpointsByEnrollment } = useTouchpointStore();
  const { currentProgramId, currentSiteId } = useUserStore();
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [touchpointType, setTouchpointType] = useState<TouchpointType>('in-person');
  const [duration, setDuration] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [noteText, setNoteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extraction, setExtraction] = useState<TouchpointExtraction | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());
  const [selectedOutcomes, setSelectedOutcomes] = useState<Set<number>>(new Set());
  const [fieldSuggestions, setFieldSuggestions] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [caseWorkerFilter, setCaseWorkerFilter] = useState<string>('all');

  // Get active enrollments with filters
  let filteredEnrollments = enrollments.filter((e) => e.status === 'active');

  // Filter by master program selector
  if (currentProgramId) {
    filteredEnrollments = filteredEnrollments.filter((e) => e.programId === currentProgramId);
  }

  // Filter by master site selector
  if (currentSiteId) {
    filteredEnrollments = filteredEnrollments.filter((e) => e.siteId === currentSiteId);
  }

  if (caseWorkerFilter !== 'all') {
    filteredEnrollments = filteredEnrollments.filter((e) => e.caseWorkerId === caseWorkerFilter);
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredEnrollments = filteredEnrollments.filter((enrollment) => {
      const participant = participants.find((p) => p.id === enrollment.participantId);
      if (!participant) return false;
      const fullName = `${participant.firstName} ${participant.lastName}`.toLowerCase();
      return fullName.includes(query);
    });
  }

  // Group enrollments by participant
  const enrollmentGroups = filteredEnrollments.reduce((acc, enrollment) => {
    // Only group participant enrollments (case notes is participant-focused)
    if (enrollment.participantId) {
      if (!acc[enrollment.participantId]) {
        acc[enrollment.participantId] = [];
      }
      acc[enrollment.participantId].push(enrollment);
    }
    return acc;
  }, {} as Record<string, typeof enrollments>);

  const selectedEnrollment = selectedEnrollmentId
    ? getEnrollmentById(selectedEnrollmentId)
    : null;

  const enrollmentTouchpoints = selectedEnrollmentId
    ? getTouchpointsByEnrollment(selectedEnrollmentId)
    : [];

  const getProgramName = (programId: string) => {
    const program = getProgram(programId);
    return program?.name || programId;
  };

  const getParticipantName = (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId);
    return participant ? `${participant.firstName} ${participant.lastName}` : participantId;
  };

  const getCaseWorkerName = (caseWorkerId?: string) => {
    if (!caseWorkerId) return 'None assigned';
    const caseWorker = getCaseWorker(caseWorkerId);
    return caseWorker ? `${caseWorker.firstName} ${caseWorker.lastName}` : caseWorkerId;
  };

  const handleEnrollmentSelect = (enrollmentId: string) => {
    setSelectedEnrollmentId(enrollmentId);
    setNoteText('');
    setExtraction(null);
    setSelectedServices(new Set());
    setSelectedOutcomes(new Set());
    setFieldSuggestions([]);
    setCustomFieldValues({});
  };

  const handleNoteChange = async (text: string) => {
    setNoteText(text);

    if (text.length < 20) {
      setExtraction(null);
      return;
    }

    setIsProcessing(true);

    try {
      const activeFields = getActiveFields();

      const response = await fetch('/api/case-notes/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollmentId: selectedEnrollmentId,
          noteText: text,
          touchpointFields: activeFields,
          enrollmentContext: selectedEnrollment
            ? {
                program: selectedEnrollment.programId,
                goals: selectedEnrollment.outcomeGoals,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract data');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'extraction') {
                  setExtraction(data.data);
                  if (data.data.servicesProvided) {
                    setSelectedServices(
                      new Set(
                        data.data.servicesProvided.map((_: any, idx: number) => idx)
                      )
                    );
                  }
                  if (data.data.outcomeAchievements) {
                    setSelectedOutcomes(
                      new Set(
                        data.data.outcomeAchievements.map((_: any, idx: number) => idx)
                      )
                    );
                  }
                } else if (data.type === 'customFields') {
                  setFieldSuggestions(data.data.fieldValues || []);
                  const initialValues: Record<string, any> = {};
                  (data.data.fieldValues || []).forEach((suggestion: any) => {
                    initialValues[suggestion.fieldId] = suggestion.value;
                  });
                  setCustomFieldValues(initialValues);
                } else if (data.type === 'done') {
                  setIsProcessing(false);
                } else if (data.type === 'error') {
                  console.error('Extraction error:', data.error);
                  setIsProcessing(false);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('Error extracting data:', error);
      setIsProcessing(false);
    }
  };

  const handleSaveTouchpoint = () => {
    if (!selectedEnrollmentId || !noteText.trim() || !extraction) {
      return;
    }

    const enrollment = getEnrollmentById(selectedEnrollmentId);
    if (!enrollment) return;

    const serviceIds: string[] = [];
    if (extraction.servicesProvided) {
      extraction.servicesProvided.forEach((service, idx) => {
        if (selectedServices.has(idx) && service.createTransaction) {
          const serviceId = `SVC-${Date.now()}-${idx}`;
          serviceIds.push(serviceId);
          console.log('Creating service transaction:', {
            id: serviceId,
            serviceType: service.serviceType,
            quantity: service.quantity,
            amount: service.amount,
            enrollmentId: selectedEnrollmentId,
          });
        }
      });
    }

    if (extraction.outcomeAchievements) {
      extraction.outcomeAchievements.forEach((outcome, idx) => {
        if (selectedOutcomes.has(idx) && outcome.achieved) {
          console.log('Marking goal as achieved:', outcome.goal);
        }
      });
    }

    createTouchpoint({
      enrollmentId: selectedEnrollmentId,
      participantId: enrollment.participantId || '',
      caseWorkerId: enrollment.caseWorkerId,
      touchpointType,
      content: noteText,
      duration: duration ? parseInt(duration) : undefined,
      location: location || undefined,
      extractedData: extraction,
      servicesRecorded: serviceIds,
    });

    setNoteText('');
    setExtraction(null);
    setDuration('');
    setLocation('');
    setSelectedServices(new Set());
    setSelectedOutcomes(new Set());
    setFieldSuggestions([]);
    setCustomFieldValues({});
    alert('Touchpoint saved successfully!');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <PageLayout pageTitle="Case Notes / Touchpoints">
      <Stack space="400">
        {/* Header */}
        <Stack space="300">
          <Link href="/">
            <Text color="link">← Back to Home</Text>
          </Link>
          <Heading level={1}>Touchpoints</Heading>
          <Text>Document interactions with participants - AI extracts services, outcomes, and creates records automatically</Text>
        </Stack>

        {/* Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          {/* Enrollment Selector Sidebar */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            height: 'calc(100vh - 300px)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <Heading level={2} style={{ marginBottom: '12px' }}>Active Enrollments</Heading>

              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search participants..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <select
                value={caseWorkerFilter}
                onChange={(e) => setCaseWorkerFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="all">All Case Workers</option>
                {getActiveCaseWorkers().map((caseWorker) => (
                  <option key={caseWorker.id} value={caseWorker.id}>
                    {caseWorker.firstName} {caseWorker.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {Object.keys(enrollmentGroups).length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <Text variant="sm" color="subdued">
                    {searchQuery || caseWorkerFilter !== 'all' ? 'No enrollments found' : 'No active enrollments'}
                  </Text>
                </div>
              ) : (
                Object.entries(enrollmentGroups).map(([participantId, enrollments]) => (
                  <div key={participantId} style={{ padding: '8px' }}>
                    <Text weight="500" style={{ padding: '8px', fontSize: '14px' }}>
                      {getParticipantName(participantId)}
                    </Text>
                    {enrollments.map((enrollment) => (
                      <button
                        key={enrollment.id}
                        onClick={() => handleEnrollmentSelect(enrollment.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: selectedEnrollmentId === enrollment.id ? '#f3f4f6' : 'white',
                          borderLeft: selectedEnrollmentId === enrollment.id ? '4px solid #7c3aed' : '4px solid transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <Text variant="sm" style={{ display: 'block', marginBottom: '4px' }}>
                          {getProgramName(enrollment.programId)}
                        </Text>
                        <Text variant="sm" color="subdued" style={{ fontSize: '12px' }}>
                          Started {formatDate(enrollment.startDate)}
                        </Text>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Content Area */}
          {!selectedEnrollmentId ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '48px',
              textAlign: 'center',
            }}>
              <Text color="subdued" style={{ fontSize: '18px' }}>
                Select an enrollment to add touchpoint
              </Text>
            </div>
          ) : (
            <Stack space="400">
              {/* Enrollment Context */}
              {selectedEnrollment && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  padding: '24px',
                }}>
                  <Heading level={2}>{getProgramName(selectedEnrollment.programId)}</Heading>
                  <div style={{
                    marginTop: '16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}>
                    <Text variant="sm">
                      <strong>Participant:</strong> {getParticipantName(selectedEnrollment.participantId)}
                    </Text>
                    <Text variant="sm">
                      <strong>Case Worker:</strong> {getCaseWorkerName(selectedEnrollment.caseWorkerId)}
                    </Text>
                    <Text variant="sm">
                      <strong>Enrollment Date:</strong> {formatDate(selectedEnrollment.enrollmentDate)}
                    </Text>
                    <Text variant="sm">
                      <strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedEnrollment.status}</span>
                    </Text>
                  </div>
                  {selectedEnrollment.outcomeGoals.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <Text weight="500" variant="sm" style={{ marginBottom: '8px' }}>Goals:</Text>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedEnrollment.outcomeGoals.map((goal, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#eff6ff',
                              color: '#1e40af',
                              borderRadius: '16px',
                              fontSize: '12px',
                            }}
                          >
                            {goal}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Touchpoint Entry Form */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}>
                <div style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                }}>
                  <Heading level={3}>Add Touchpoint</Heading>
                </div>
                <div style={{ padding: '24px' }}>
                  <Stack space="400">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <Select
                        label="Touchpoint Type"
                        selectedKey={touchpointType}
                        onSelectionChange={(key) => setTouchpointType(key as TouchpointType)}
                      >
                        {TOUCHPOINT_TYPES.map((type) => (
                          <SelectItem key={type.value} id={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </Select>

                      <TextField
                        label="Duration (minutes)"
                        type="number"
                        value={duration}
                        onChange={setDuration}
                        placeholder="30"
                      />

                      <TextField
                        label="Location (optional)"
                        value={location}
                        onChange={setLocation}
                        placeholder="Office, home, etc."
                      />
                    </div>

                    <div>
                      <Text weight="600" style={{ marginBottom: '8px' }}>Case Notes</Text>
                      <textarea
                        value={noteText}
                        onChange={(e) => handleNoteChange(e.target.value)}
                        placeholder="Type your case notes naturally... For example: 'Met with participant today. Provided rental assistance of $1200 for this month. They mentioned their job is going well - working 30 hours per week now earning $15/hour. Discussed budget and savings goals.'"
                        style={{
                          width: '100%',
                          height: '160px',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text variant="sm" color="subdued">
                        {isProcessing ? (
                          '⏳ Extracting structured data...'
                        ) : noteText.length < 20 ? (
                          'Type at least 20 characters to see AI extraction'
                        ) : (
                          '✅ AI extraction ready'
                        )}
                      </Text>
                      <Button
                        variant="primary"
                        onPress={handleSaveTouchpoint}
                        isDisabled={!noteText.trim() || !extraction || isProcessing}
                      >
                        Save Touchpoint
                      </Button>
                    </div>
                  </Stack>
                </div>
              </div>

              {/* Extraction Results Panel */}
              {extraction && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '#f5f3ff',
                  }}>
                    <Heading level={3}>Extracted Data - Review and Confirm</Heading>
                    <Text variant="sm" color="subdued">
                      AI automatically extracted this information. Select which items to process.
                    </Text>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <Stack space="500">
                      {/* Services */}
                      {extraction.servicesProvided && extraction.servicesProvided.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <Text weight="600">Create Service Transactions?</Text>
                            <Text variant="sm" color="subdued">
                              {extraction.servicesProvided.filter((s) => s.createTransaction).length} service(s) detected
                            </Text>
                          </div>
                          <Stack space="200">
                            {extraction.servicesProvided.map((service, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'start',
                                  padding: '12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  backgroundColor: selectedServices.has(idx) ? '#f9fafb' : 'white',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedServices.has(idx)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedServices);
                                    if (e.target.checked) {
                                      newSet.add(idx);
                                    } else {
                                      newSet.delete(idx);
                                    }
                                    setSelectedServices(newSet);
                                  }}
                                  style={{ marginRight: '12px', marginTop: '4px' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <Text weight="500">{service.serviceType}</Text>
                                  <Text variant="sm" color="subdued" style={{ marginTop: '4px' }}>
                                    {service.quantity} {service.unit}
                                    {service.amount && ` - $${service.amount.toFixed(2)}`}
                                    {' '}(confidence: {Math.round(service.confidence * 100)}%)
                                  </Text>
                                </div>
                              </div>
                            ))}
                          </Stack>
                        </div>
                      )}

                      {/* Outcomes */}
                      {extraction.outcomeAchievements && extraction.outcomeAchievements.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <Text weight="600">Mark Goals as Achieved?</Text>
                            <Text variant="sm" color="subdued">
                              {extraction.outcomeAchievements.length} achievement(s) detected
                            </Text>
                          </div>
                          <Stack space="200">
                            {extraction.outcomeAchievements.map((outcome, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'start',
                                  padding: '12px',
                                  border: '2px solid #d1fae5',
                                  borderRadius: '6px',
                                  backgroundColor: '#ecfdf5',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedOutcomes.has(idx)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedOutcomes);
                                    if (e.target.checked) {
                                      newSet.add(idx);
                                    } else {
                                      newSet.delete(idx);
                                    }
                                    setSelectedOutcomes(newSet);
                                  }}
                                  style={{ marginRight: '12px', marginTop: '4px' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <Text weight="500">{outcome.goal}</Text>
                                  <Text variant="sm" style={{ marginTop: '4px' }}>{outcome.evidence}</Text>
                                  <Text variant="sm" color="subdued" style={{ marginTop: '4px' }}>
                                    {formatDate(outcome.date)} (confidence: {Math.round(outcome.confidence * 100)}%)
                                  </Text>
                                </div>
                              </div>
                            ))}
                          </Stack>
                        </div>
                      )}

                      {/* Risk Flags */}
                      {extraction.riskFlags && extraction.riskFlags.length > 0 && (
                        <div>
                          <Text weight="600" style={{ marginBottom: '12px' }}>Risk Flags</Text>
                          <Stack space="200">
                            {extraction.riskFlags.map((risk, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '12px',
                                  borderRadius: '6px',
                                  border: `2px solid ${
                                    risk.severity === 'high' ? '#fca5a5' :
                                    risk.severity === 'medium' ? '#fcd34d' : '#93c5fd'
                                  }`,
                                  backgroundColor: risk.severity === 'high' ? '#fef2f2' :
                                    risk.severity === 'medium' ? '#fef3c7' : '#eff6ff',
                                }}
                              >
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    textTransform: 'uppercase',
                                    backgroundColor: risk.severity === 'high' ? '#fca5a5' :
                                      risk.severity === 'medium' ? '#fcd34d' : '#93c5fd',
                                    color: risk.severity === 'high' ? '#7f1d1d' :
                                      risk.severity === 'medium' ? '#78350f' : '#1e3a8a',
                                  }}>
                                    {risk.severity}
                                  </span>
                                  <Text weight="500" variant="sm" style={{ textTransform: 'capitalize' }}>
                                    {risk.type}
                                  </Text>
                                </div>
                                <Text variant="sm">{risk.description}</Text>
                              </div>
                            ))}
                          </Stack>
                        </div>
                      )}

                      {/* Action Items */}
                      {extraction.actionItems && extraction.actionItems.length > 0 && (
                        <div>
                          <Text weight="600" style={{ marginBottom: '12px' }}>Action Items</Text>
                          <Stack space="100">
                            {extraction.actionItems.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex' }}>
                                <Text variant="sm" color="link" style={{ marginRight: '8px' }}>•</Text>
                                <Text variant="sm">
                                  {item.description}
                                  {item.dueDate && (
                                    <Text variant="sm" color="subdued" style={{ marginLeft: '8px' }}>
                                      Due: {formatDate(item.dueDate)}
                                    </Text>
                                  )}
                                </Text>
                              </div>
                            ))}
                          </Stack>
                        </div>
                      )}
                    </Stack>
                  </div>
                </div>
              )}

              {/* History */}
              {enrollmentTouchpoints.length > 0 && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    <Heading level={3}>Recent Touchpoints ({enrollmentTouchpoints.length})</Heading>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <Stack space="300">
                      {enrollmentTouchpoints.slice(0, 5).map((tp) => (
                        <div key={tp.id} style={{
                          padding: '16px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <Text weight="600" variant="sm">{tp.touchpointType}</Text>
                            <Text variant="sm" color="subdued">{formatDate(tp.createdAt)}</Text>
                          </div>
                          <Text variant="sm" style={{ color: '#4b5563' }}>{tp.content.substring(0, 150)}...</Text>
                        </div>
                      ))}
                    </Stack>
                  </div>
                </div>
              )}
            </Stack>
          )}
        </div>
      </Stack>
    </PageLayout>
  );
}
