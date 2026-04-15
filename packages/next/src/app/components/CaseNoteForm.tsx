'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  Heading,
  Text,
  Button,
  Card,
} from '@bonterratech/stitch-extension';
import { TouchpointType, TouchpointExtraction } from '@/types/poc';
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

interface CaseNoteFormProps {
  participantId: string;
  enrollmentId?: string; // If provided, pre-select this enrollment
  onSave?: () => void; // Callback after successful save
  onCancel?: () => void; // Callback for cancel action
}

export default function CaseNoteForm({
  participantId,
  enrollmentId: preselectedEnrollmentId,
  onSave,
  onCancel,
}: CaseNoteFormProps) {
  const { getEnrollmentById, enrollments } = useEnrollmentStore();
  const { getActiveFields } = useTouchpointFieldStore();
  const { createTouchpoint } = useTouchpointStore();
  const { getProgram } = useProgramStore();

  // Get participant's active enrollments
  const participantEnrollments = enrollments.filter(
    (e) => e.participantId === participantId && e.status === 'active',
  );

  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<
    string | null
  >(
    preselectedEnrollmentId ||
      (participantEnrollments.length === 1
        ? participantEnrollments[0].id
        : null),
  );
  const [touchpointType, setTouchpointType] =
    useState<TouchpointType>('in-person');
  const [duration, setDuration] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [noteText, setNoteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extraction, setExtraction] = useState<TouchpointExtraction | null>(
    null,
  );
  const [selectedServices, setSelectedServices] = useState<Set<number>>(
    new Set(),
  );
  const [extractionTimeout, setExtractionTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const selectedEnrollment = selectedEnrollmentId
    ? getEnrollmentById(selectedEnrollmentId)
    : null;

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
                          data.data.servicesProvided.map(
                            (_: any, idx: number) => idx,
                          ),
                        ),
                      );
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
        // Ignore abort errors (they happen when user types again)
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
      participantId: participantId,
      caseWorkerId: enrollment.caseWorkerId,
      touchpointType,
      content: noteText,
      duration: duration ? parseInt(duration) : undefined,
      location: location || undefined,
      extractedData: extraction,
      servicesRecorded: serviceIds,
    });

    // Reset form
    setNoteText('');
    setExtraction(null);
    setDuration('');
    setLocation('');
    setSelectedServices(new Set());

    // Call success callback
    if (onSave) {
      onSave();
    }
  };

  const getProgramName = (programId: string) => {
    const program = getProgram(programId);
    return program?.name || programId;
  };

  return (
    <Stack space="400">
      {/* Enrollment Selector */}
      {participantEnrollments.length > 1 && (
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '6px',
            }}
          >
            Select Enrollment
          </label>
          <select
            value={selectedEnrollmentId || ''}
            onChange={(e) => setSelectedEnrollmentId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
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
        </div>
      )}

      {participantEnrollments.length === 0 && (
        <Card>
          <Text color="subdued">
            This individual has no active enrollments.
          </Text>
        </Card>
      )}

      {selectedEnrollmentId && (
        <>
          {/* Touchpoint Details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 2fr',
              gap: '16px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '6px',
                }}
              >
                Touchpoint Type
              </label>
              <select
                value={touchpointType}
                onChange={(e) =>
                  setTouchpointType(e.target.value as TouchpointType)
                }
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
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '6px',
                }}
              >
                Duration (min)
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
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '6px',
                }}
              >
                Location
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

          {/* Case Notes Textarea */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '6px',
              }}
            >
              Case Notes
            </label>
            <textarea
              value={noteText}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Type your case notes naturally... AI will extract structured data automatically."
              rows={6}
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
            <div
              style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}
            >
              {isProcessing
                ? '⏳ Extracting structured data...'
                : noteText.length < 20
                  ? 'Type at least 20 characters to see AI extraction'
                  : '✅ AI extraction ready'}
            </div>
          </div>

          {/* Extracted Data Preview */}
          {extraction && (
            <Card>
              <Stack space="300">
                <Heading level={4}>AI Extracted Data</Heading>

                {extraction.progressOnGoals &&
                  extraction.progressOnGoals.length > 0 && (
                    <div>
                      <Text weight="500" variant="sm">
                        Goal Progress
                      </Text>
                      {extraction.progressOnGoals.map((progress, idx) => (
                        <Text key={idx} variant="sm" color="subdued">
                          • {progress.goal}
                        </Text>
                      ))}
                    </div>
                  )}

                {extraction.servicesProvided &&
                  extraction.servicesProvided.length > 0 && (
                    <div>
                      <Text weight="500" variant="sm">
                        Services Detected
                      </Text>
                      {extraction.servicesProvided.map((service, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: 'flex',
                            gap: '8px',
                            fontSize: '13px',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.has(idx)}
                            onChange={(e) => {
                              const newSet = new Set(selectedServices);
                              if (e.target.checked) newSet.add(idx);
                              else newSet.delete(idx);
                              setSelectedServices(newSet);
                            }}
                          />
                          <Text variant="sm">
                            {service.serviceType} - {service.quantity}{' '}
                            {service.unit}
                          </Text>
                        </label>
                      ))}
                    </div>
                  )}
              </Stack>
            </Card>
          )}

          {/* Action Buttons */}
          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
          >
            {onCancel && (
              <Button variant="secondary" onPress={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              onPress={handleSave}
              isDisabled={!noteText.trim() || !extraction || isProcessing}
            >
              Save Case Note
            </Button>
          </div>
        </>
      )}
    </Stack>
  );
}
