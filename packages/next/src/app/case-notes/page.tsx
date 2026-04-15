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
  Card,
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

export default function CaseNotesPage() {
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
  const [extractionTimeout, setExtractionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Apply master context filtering
  let filteredEnrollments = enrollments.filter((e) => {
    if (e.status !== 'active') return false;
    if (currentProgramId && e.programId !== currentProgramId) return false;
    if (currentSiteId && e.siteId !== currentSiteId) return false;
    return true;
  });

  // Filter by case worker
  if (caseWorkerFilter !== 'all') {
    filteredEnrollments = filteredEnrollments.filter((e) => e.caseWorkerId === caseWorkerFilter);
  }

  // Filter by participant name search
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
    // Cancel any pending extraction
    if (extractionTimeout) {
      clearTimeout(extractionTimeout);
      setExtractionTimeout(null);
    }
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    setSelectedEnrollmentId(enrollmentId);
    setNoteText('');
    setExtraction(null);
    setSelectedServices(new Set());
    setSelectedOutcomes(new Set());
    setFieldSuggestions([]);
    setCustomFieldValues({});
    setIsProcessing(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (extractionTimeout) {
        clearTimeout(extractionTimeout);
      }
      if (abortController) {
        abortController.abort();
      }
    };
  }, [extractionTimeout, abortController]);

  const handleNoteChange = async (text: string) => {
    setNoteText(text);

    // Cancel any existing timeout
    if (extractionTimeout) {
      clearTimeout(extractionTimeout);
    }

    // Cancel any in-progress request
    if (abortController) {
      abortController.abort();
    }

    if (text.length < 20) {
      setExtraction(null);
      setIsProcessing(false);
      return;
    }

    // Show processing indicator immediately
    setIsProcessing(true);

    // Debounce: wait 1 second after user stops typing
    const timeout = setTimeout(async () => {
      try {
        const activeFields = getActiveFields();
        const controller = new AbortController();
        setAbortController(controller);

        const response = await fetch('/api/case-notes/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
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
        setAbortController(null);
      } catch (error: any) {
        // Ignore abort errors (they happen when user types again)
        if (error.name !== 'AbortError') {
          console.error('Error extracting data:', error);
        }
        setIsProcessing(false);
        setAbortController(null);
      }
    }, 1000); // Wait 1 second after user stops typing

    setExtractionTimeout(timeout);
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
    <PageLayout pageTitle="Case Notes">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        {/* Left Sidebar - Enrollments */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          height: 'calc(100vh - 180px)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <Heading level={3} style={{ marginBottom: '12px', fontSize: '16px' }}>Active Enrollments</Heading>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search participants..."
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />

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
              {getActiveCaseWorkers().map((cw) => (
                <option key={cw.id} value={cw.id}>
                  {cw.firstName} {cw.lastName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {Object.entries(enrollmentGroups).map(([participantId, enrollments]) => (
              <div key={participantId} style={{ marginBottom: '12px' }}>
                <div style={{ padding: '8px', fontSize: '13px', fontWeight: 600 }}>
                  {getParticipantName(participantId)}
                </div>
                {enrollments.map((enrollment) => {
                  const touchpointCount = getTouchpointsByEnrollment(enrollment.id).length;
                  const isSelected = selectedEnrollmentId === enrollment.id;
                  return (
                    <button
                      key={enrollment.id}
                      onClick={() => handleEnrollmentSelect(enrollment.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        marginBottom: '2px',
                        border: 'none',
                        borderLeft: isSelected ? '4px solid #7c3aed' : '4px solid transparent',
                        background: isSelected ? '#f3f4f6' : 'white',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        fontSize: '13px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'white';
                      }}
                    >
                      <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                        {getProgramName(enrollment.programId)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Started {formatDate(enrollment.enrollmentDate)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {touchpointCount} touchpoint{touchpointCount !== 1 ? 's' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
            {Object.keys(enrollmentGroups).length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                No active enrollments found
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!selectedEnrollment ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '48px',
              textAlign: 'center',
            }}>
              <Text color="subdued" style={{ fontSize: '16px' }}>
                Select an enrollment to add touchpoint
              </Text>
            </div>
          ) : (
            <>
              {/* Enrollment Info Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '20px 24px',
              }}>
                <Heading level={2} style={{ marginBottom: '12px', fontSize: '20px' }}>
                  {getProgramName(selectedEnrollment.programId)}
                </Heading>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '14px' }}>
                  <div>
                    <strong>Participant:</strong> {getParticipantName(selectedEnrollment.participantId)}
                  </div>
                  <div>
                    <strong>Case Worker:</strong> {getCaseWorkerName(selectedEnrollment.caseWorkerId)}
                  </div>
                  <div>
                    <strong>Enrollment Date:</strong> {formatDate(selectedEnrollment.enrollmentDate)}
                  </div>
                  <div>
                    <strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedEnrollment.status}</span>
                  </div>
                </div>
                {selectedEnrollment.outcomeGoals && selectedEnrollment.outcomeGoals.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Goals:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedEnrollment.outcomeGoals.map((goal, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '12px',
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

              {/* Add Touchpoint Form */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '24px',
              }}>
                <Heading level={3} style={{ marginBottom: '16px', fontSize: '18px' }}>
                  Add Touchpoint
                </Heading>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                      Touchpoint Type
                    </label>
                    <select
                      value={touchpointType}
                      onChange={(e) => setTouchpointType(e.target.value as TouchpointType)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    >
                      {TOUCHPOINT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="30"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                      Location (optional)
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Office, home, etc."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                    Case Notes
                  </label>
                  <textarea
                    value={noteText}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    placeholder="Type your case notes naturally... For example: 'Met with participant today. Provided rental assistance of $1200 for this month. They mentioned their job is going well - working 30 hours per week now earning $15/hour. Discussed budget and savings goals.'"
                    rows={5}
                    style={{
                      width: '100%',
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
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {isProcessing ? '⏳ Extracting structured data...' :
                     noteText.length < 20 ? 'Type at least 20 characters to see AI extraction' :
                     '✅ AI extraction ready'}
                  </div>
                  <Button
                    variant="primary"
                    onPress={handleSaveTouchpoint}
                    isDisabled={!noteText.trim() || !extraction || isProcessing}
                  >
                    Save Touchpoint
                  </Button>
                </div>
              </div>

              {/* Extracted Data */}
              {extraction && (
                <Card>
                  <Stack space="400">
                    <Stack space="200">
                      <Heading level={3}>Extracted Data - Review and Confirm</Heading>
                      <Text variant="sm" color="subdued">
                        AI automatically extracted this information. Select which items to process.
                      </Text>
                    </Stack>

                    {/* Goal Progress */}
                    {extraction.progressOnGoals && extraction.progressOnGoals.length > 0 && (
                      <Stack space="300">
                        <Text weight="500">Goal Progress</Text>
                        <Stack space="200">
                          {extraction.progressOnGoals.map((progress, idx) => (
                            <Card key={idx} style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                              <Stack space="200">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    padding: '2px 10px',
                                    backgroundColor: '#22c55e',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                  }}>
                                    positive
                                  </span>
                                  <Text weight="500">{progress.goal}</Text>
                                </div>
                                <Text variant="sm" style={{ color: '#166534' }}>
                                  {progress.progress}
                                </Text>
                              </Stack>
                            </Card>
                          ))}
                        </Stack>
                      </Stack>
                    )}

                    {/* Emotional State */}
                    {extraction.emotionalState && (
                      <Stack space="300">
                        <Text weight="500">Emotional State</Text>
                        <Card style={{ backgroundColor: '#f5f3ff', border: '1px solid #d8b4fe' }}>
                          <Stack space="200">
                            <span style={{
                              padding: '2px 10px',
                              backgroundColor: '#a855f7',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              display: 'inline-block',
                              width: 'fit-content',
                            }}>
                              {typeof extraction.emotionalState === 'string'
                                ? extraction.emotionalState
                                : extraction.emotionalState.primary}
                            </span>
                            <Text variant="sm" style={{ color: '#6b21a8' }}>
                              {typeof extraction.emotionalState === 'string'
                                ? 'Doing well overall, meeting expectations'
                                : extraction.emotionalState.description}
                            </Text>
                          </Stack>
                        </Card>
                      </Stack>
                    )}

                    {/* Services */}
                    {extraction.servicesProvided && extraction.servicesProvided.length > 0 && (
                      <Stack space="300">
                        <Text weight="500">Create Service Transactions?</Text>
                        <Stack space="200">
                          {extraction.servicesProvided.map((service, idx) => (
                            <Card
                              key={idx}
                              style={{
                                cursor: 'pointer',
                                backgroundColor: selectedServices.has(idx) ? '#f9fafb' : 'white',
                              }}
                            >
                              <label style={{ display: 'flex', alignItems: 'start', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedServices.has(idx)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedServices);
                                    if (e.target.checked) newSet.add(idx);
                                    else newSet.delete(idx);
                                    setSelectedServices(newSet);
                                  }}
                                  style={{ marginRight: '12px', marginTop: '4px' }}
                                />
                                <Stack space="100">
                                  <Text weight="500">{service.serviceType}</Text>
                                  <Text variant="sm" color="subdued">
                                    {service.quantity} {service.unit}
                                    {service.amount && ` - $${service.amount.toFixed(2)}`}
                                  </Text>
                                </Stack>
                              </label>
                            </Card>
                          ))}
                        </Stack>
                      </Stack>
                    )}

                    {/* Risk Flags */}
                    {extraction.riskFlags && extraction.riskFlags.length > 0 && (
                      <Stack space="300">
                        <Text weight="500">Risk Flags</Text>
                        <Stack space="200">
                          {extraction.riskFlags.map((risk, idx) => (
                            <Card
                              key={idx}
                              style={{
                                backgroundColor: risk.severity === 'high' ? '#fef2f2' : '#fef3c7',
                                border: risk.severity === 'high' ? '1px solid #fca5a5' : '1px solid #fcd34d',
                              }}
                            >
                              <Stack space="200">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    padding: '2px 10px',
                                    backgroundColor: risk.severity === 'high' ? '#ef4444' : '#f59e0b',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                  }}>
                                    {risk.severity}
                                  </span>
                                  <Text weight="500" style={{ textTransform: 'capitalize' }}>
                                    {risk.type}
                                  </Text>
                                </div>
                                <Text variant="sm" style={{ color: risk.severity === 'high' ? '#7f1d1d' : '#78350f' }}>
                                  {risk.description}
                                </Text>
                              </Stack>
                            </Card>
                          ))}
                        </Stack>
                      </Stack>
                    )}
                  </Stack>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
