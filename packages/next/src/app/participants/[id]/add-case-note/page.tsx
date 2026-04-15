'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Stack,
  Heading,
  Text,
  Button,
  Card,
} from '@bonterratech/stitch-extension';
import PageLayout from '../../../components/PageLayout';
import { TouchpointType, TouchpointExtraction } from '@/types/poc';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useTouchpointFieldStore } from '@/lib/stores/touchpointFieldStore';
import { useTouchpointStore } from '@/lib/stores/touchpointStore';
import { useProgramStore } from '@/lib/stores/programStore';

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

interface AddCaseNotePageProps {
  params: Promise<{ id: string }>;
}

export default function AddCaseNotePage({ params }: AddCaseNotePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { participants } = useParticipantStore();
  const { getEnrollmentById, enrollments, updateEnrollment } = useEnrollmentStore();
  const { getActiveFields } = useTouchpointFieldStore();
  const { createTouchpoint } = useTouchpointStore();
  const { getProgram } = useProgramStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const participant = participants.find(p => p.id === id);

  // Get participant's active enrollments
  const participantEnrollments = enrollments.filter(
    e => e.participantId === id && e.status === 'active'
  );

  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(
    participantEnrollments.length === 1 ? participantEnrollments[0].id : null
  );
  const [touchpointType, setTouchpointType] = useState<TouchpointType>('in-person');
  const [duration, setDuration] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [nextCheckInDate, setNextCheckInDate] = useState<string>('');
  const [nextCheckInZoomLink, setNextCheckInZoomLink] = useState<string>('');
  const [noteText, setNoteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extraction, setExtraction] = useState<TouchpointExtraction | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());
  const [extractionTimeout, setExtractionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const selectedEnrollment = selectedEnrollmentId ? getEnrollmentById(selectedEnrollmentId) : null;

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

    if (extractionTimeout) {
      clearTimeout(extractionTimeout);
    }

    if (abortController) {
      abortController.abort();
    }

    if (text.length < 20) {
      setExtraction(null);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

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
            participantId: id,
            noteText: text,
            touchpointFields: activeFields,
            participantContext: participant && selectedEnrollment
              ? {
                  name: `${participant.firstName} ${participant.lastName}`,
                  program: getProgramName(selectedEnrollment.programId),
                  outcomeGoal: selectedEnrollment.outcomeGoals?.[0] || undefined,
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
                  } else if (data.type === 'customFields') {
                    // Handle custom field extraction
                    if (data.data.fieldValues && data.data.fieldValues.length > 0) {
                      setExtraction(prev => prev ? {
                        ...prev,
                        customFields: data.data.fieldValues
                      } : null);
                    }
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
        if (error.name !== 'AbortError') {
          console.error('Error extracting data:', error);
        }
        setIsProcessing(false);
        setAbortController(null);
      }
    }, 1000);

    setExtractionTimeout(timeout);
  };

  const handleSave = () => {
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
        }
      });
    }

    createTouchpoint({
      enrollmentId: selectedEnrollmentId,
      participantId: id,
      caseWorkerId: enrollment.caseWorkerId,
      touchpointType,
      content: noteText,
      duration: duration ? parseInt(duration) : undefined,
      location: location || undefined,
      extractedData: extraction,
      servicesRecorded: serviceIds,
    });

    // Update enrollment's next check-in date and Zoom link if provided
    if (nextCheckInDate) {
      updateEnrollment(selectedEnrollmentId, {
        nextCheckIn: new Date(nextCheckInDate),
        nextCheckInZoomLink: nextCheckInZoomLink || undefined,
      });
    }

    router.push(`/participants/${id}?tab=case-notes`);
  };

  const getProgramName = (programId: string) => {
    const program = getProgram(programId);
    return program?.name || programId;
  };

  if (!participant) {
    return (
      <PageLayout pageTitle="Add Case Note">
        <Card>
          <Text>Individual not found</Text>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout pageTitle="Add Case Note">
      <Stack space="400">
        <Stack space="200">
          <Link href={`/participants/${id}`}>
            <Text color="link">← Back to {participant.firstName} {participant.lastName}</Text>
          </Link>
          <Heading level={1}>Add Case Note</Heading>
          <Text color="subdued">
            Record a touchpoint for {participant.firstName} {participant.lastName}
          </Text>
        </Stack>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
          {/* Main Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Enrollment Selector */}
            {participantEnrollments.length > 1 && (
              <Card>
                <Stack space="300">
                  <Heading level={3}>Select Enrollment</Heading>
                  <select
                    value={selectedEnrollmentId || ''}
                    onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Choose enrollment...</option>
                    {participantEnrollments.map((enrollment) => (
                      <option key={enrollment.id} value={enrollment.id}>
                        {getProgramName(enrollment.programId)}
                      </option>
                    ))}
                  </select>
                </Stack>
              </Card>
            )}

            {participantEnrollments.length === 0 && (
              <Card>
                <Text color="subdued">This individual has no active enrollments.</Text>
              </Card>
            )}

            {selectedEnrollmentId && (
              <>
                {/* Touchpoint Details */}
                <Card>
                  <Stack space="400">
                    <Heading level={3}>Touchpoint Details</Heading>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                          Touchpoint Type
                        </label>
                        <select
                          value={touchpointType}
                          onChange={(e) => setTouchpointType(e.target.value as TouchpointType)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
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
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                          Duration (min)
                        </label>
                        <input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="30"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                          Location
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Office, home, etc."
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                          Next Check-In
                        </label>
                        <input
                          type="datetime-local"
                          value={nextCheckInDate}
                          onChange={(e) => setNextCheckInDate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                        />
                      </div>
                    </div>

                    {nextCheckInDate && (
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                          Meeting Link (optional)
                        </label>
                        <input
                          type="url"
                          value={nextCheckInZoomLink}
                          onChange={(e) => setNextCheckInZoomLink(e.target.value)}
                          placeholder="https://zoom.us/j/..."
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                        />
                        <Text variant="xs" color="subdued" style={{ marginTop: '4px' }}>
                          Add a Zoom, Teams, or Google Meet link for virtual check-ins
                        </Text>
                      </div>
                    )}
                  </Stack>
                </Card>

                {/* Case Notes Textarea */}
                <Card>
                  <Stack space="300">
                    <Heading level={3}>Case Notes</Heading>
                    <textarea
                      value={noteText}
                      onChange={(e) => handleNoteChange(e.target.value)}
                      placeholder="Type your case notes naturally... AI will extract structured data automatically."
                      rows={12}
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {isProcessing ? '⏳ Extracting structured data...' :
                       noteText.length < 20 ? 'Type at least 20 characters to see AI extraction' :
                       '✅ AI extraction ready'}
                    </div>
                  </Stack>
                </Card>
              </>
            )}
          </div>

          {/* Right Sidebar - Extracted Data */}
          <div
            style={{
              position: 'sticky',
              top: '20px',
              height: 'fit-content',
            }}
          >
            <Card>
              <Stack space="400">
                <Heading level={3}>Extracted Data</Heading>

                {!extraction && (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <Text variant="sm" color="subdued">
                      Start typing to see AI-extracted insights
                    </Text>
                  </div>
                )}

                {extraction && (
                  <Stack space="400">
                    {/* Goal Progress */}
                    {extraction.progressOnGoals && extraction.progressOnGoals.length > 0 && (
                      <Stack space="200">
                        <Text weight="500" variant="sm">Goal Progress</Text>
                        <Stack space="100">
                          {extraction.progressOnGoals.map((progress, idx) => (
                            <Card key={idx} style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px' }}>
                              <Stack space="100">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    backgroundColor: '#22c55e',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                  }}>
                                    positive
                                  </span>
                                  <Text variant="sm" weight="500">{progress.goal}</Text>
                                </div>
                                <Text variant="xs" style={{ color: '#166534' }}>
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
                      <Stack space="200">
                        <Text weight="500" variant="sm">Emotional State</Text>
                        <Card style={{ backgroundColor: '#f5f3ff', border: '1px solid #d8b4fe', padding: '12px' }}>
                          <Stack space="100">
                            <span style={{
                              padding: '2px 8px',
                              backgroundColor: '#a855f7',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              display: 'inline-block',
                              width: 'fit-content',
                            }}>
                              {typeof extraction.emotionalState === 'string'
                                ? extraction.emotionalState
                                : extraction.emotionalState.primary}
                            </span>
                            <Text variant="xs" style={{ color: '#6b21a8' }}>
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
                      <Stack space="200">
                        <Text weight="500" variant="sm">Services Detected</Text>
                        <Stack space="100">
                          {extraction.servicesProvided.map((service, idx) => (
                            <Card
                              key={idx}
                              style={{
                                padding: '10px',
                                cursor: 'pointer',
                                backgroundColor: selectedServices.has(idx) ? '#eff6ff' : 'white',
                                border: selectedServices.has(idx) ? '1px solid #3b82f6' : '1px solid #e5e7eb',
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
                                  style={{ marginRight: '10px', marginTop: '2px' }}
                                />
                                <Stack space="50">
                                  <Text variant="sm" weight="500">{service.serviceType}</Text>
                                  <Text variant="xs" color="subdued">
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
                      <Stack space="200">
                        <Text weight="500" variant="sm">Risk Flags</Text>
                        <Stack space="100">
                          {extraction.riskFlags.map((risk, idx) => (
                            <Card
                              key={idx}
                              style={{
                                padding: '12px',
                                backgroundColor: risk.severity === 'high' ? '#fef2f2' : '#fef3c7',
                                border: risk.severity === 'high' ? '1px solid #fca5a5' : '1px solid #fcd34d',
                              }}
                            >
                              <Stack space="100">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    backgroundColor: risk.severity === 'high' ? '#ef4444' : '#f59e0b',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                  }}>
                                    {risk.severity}
                                  </span>
                                  <Text variant="sm" weight="500" style={{ textTransform: 'capitalize' }}>
                                    {risk.type}
                                  </Text>
                                </div>
                                <Text variant="xs" style={{ color: risk.severity === 'high' ? '#7f1d1d' : '#78350f' }}>
                                  {risk.description}
                                </Text>
                              </Stack>
                            </Card>
                          ))}
                        </Stack>
                      </Stack>
                    )}
                  </Stack>
                )}

                {/* Save Button */}
                {selectedEnrollmentId && (
                  <Button
                    variant="primary"
                    onPress={handleSave}
                    isDisabled={!noteText.trim() || !extraction || isProcessing}
                    style={{ width: '100%' }}
                  >
                    Save Case Note
                  </Button>
                )}
              </Stack>
            </Card>
          </div>
        </div>
      </Stack>
    </PageLayout>
  );
}
