'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stack,
  InlineStack,
  Heading,
  Text,
  Button,
  TextField,
  Select,
  SelectItem,
  Card,
} from '@bonterratech/stitch-extension';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';
import { useCustomFieldStore } from '@/lib/stores/customFieldStore';
import { useUserStore } from '@/lib/stores/userStore';
import { useHouseholdStore } from '@/lib/stores/householdStore';
import { useEntityStore } from '@/lib/stores/entityStore';
import { HMIS_GENDER_CODES, EnrolleeType } from '@/types/poc';
import PageLayout from '../components/PageLayout';
import DocumentUpload from '../components/DocumentUpload';
import CSVUpload from '../components/CSVUpload';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface HouseholdMember {
  tempId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  approximateAge?: number;
  gender?: 0 | 1 | 2 | 3 | 4 | 5 | 99;
  phoneNumber?: string;
  email?: string;
  relationshipToHoH?: string;
  confidence?: Record<string, number>;
}

interface ExtractedIntakeData {
  // Enrollee type
  enrolleeType?: EnrolleeType;

  // For participant
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  approximateAge?: number;
  gender?: 0 | 1 | 2 | 3 | 4 | 5 | 99;
  email?: string;
  phoneNumber?: string;
  address?: string;
  customFields?: Record<string, any>;

  // For family
  familyMembers?: HouseholdMember[];
  headOfHouseholdId?: string;
  familyName?: string;

  // For entity
  entityName?: string;
  entityType?: string;
  entityDescription?: string;
  entityAddress?: string;
  entityCity?: string;
  entityState?: string;
  entityZipCode?: string;
  entityPhone?: string;
  entityEmail?: string;
  entityWebsite?: string;
  contactPerson?: string;
  contactTitle?: string;

  // Enrollment details
  program?: string;
  programId?: string;
  caseWorker?: string;
  caseWorkerId?: string;
  enrollmentDate?: string;

  confidence?: Record<string, number>;
}

export default function IntakeAgentPage() {
  const router = useRouter();
  const { createParticipant } = useParticipantStore();
  const { createEnrollment } = useEnrollmentStore();
  const { createHousehold } = useHouseholdStore();
  const { createEntity } = useEntityStore();
  const { programs } = useProgramStore();
  const { caseWorkers } = useCaseWorkerStore();
  const { customFields } = useCustomFieldStore();
  const { currentProgramId, currentSiteId, currentTenantId } = useUserStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enrollee type selection
  const [enrolleeType, setEnrolleeType] = useState<EnrolleeType | null>(null);

  // AI Agent state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedIntakeData>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showUpload, setShowUpload] = useState(true);
  const [uploadType, setUploadType] = useState<'document' | 'csv'>('document');
  const [createdParticipantId, setCreatedParticipantId] = useState<
    string | null
  >(null);
  const [showEnrollmentOption, setShowEnrollmentOption] = useState(false);
  const [csvParticipants, setCsvParticipants] = useState<any[]>([]);
  const [csvRawData, setCsvRawData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {},
  );
  const [valueMapping, setValueMapping] = useState<
    Record<string, Record<string, any>>
  >({});
  const [isFamilyCSV, setIsFamilyCSV] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [showValueMapping, setShowValueMapping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize messages when enrollee type is selected
  useEffect(() => {
    if (enrolleeType && messages.length === 0) {
      const greeting =
        enrolleeType === 'participant'
          ? "Hello! I'm here to help you enroll a new participant in a program. Let's start by collecting some information. Which program is this participant enrolling in?"
          : enrolleeType === 'family'
            ? "Hello! I'm here to help you enroll a new family in a program. Let's start by collecting information about the family members. Which program is this family enrolling in?"
            : "Hello! I'm here to help you enroll a new organization/entity in a program. Let's start by collecting information about the organization. Which program is this entity enrolling in?";

      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
      setExtractedData({ enrolleeType });
    }
  }, [enrolleeType]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Filter programs based on master context
  const availablePrograms = programs.filter((p) => {
    if (p.status !== 'active') return false;
    if (currentProgramId && currentProgramId !== '') {
      return p.id === currentProgramId;
    }
    if (currentSiteId && currentSiteId !== '') {
      return p.siteIds.length === 0 || p.siteIds.includes(currentSiteId);
    }
    return true;
  });

  // Get custom fields for selected program
  const programCustomFields = extractedData.programId
    ? customFields.filter(
        (field) =>
          field.visibleInIntake &&
          (field.appliesTo === 'individual' || field.appliesTo === 'all') &&
          // Include fields that apply to all programs
          (!field.programSpecific ||
            // Or program-specific fields for the selected program
            field.programIds?.includes(extractedData.programId!)),
      )
    : [];

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);
      setInput('');

      try {
        const response = await fetch('/api/intake/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enrolleeType,
            messages: [...messages, userMessage].map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            availablePrograms: availablePrograms.map((p) => ({
              id: p.id,
              name: p.name,
            })),
            availableCaseWorkers: caseWorkers
              .filter((cw) => cw.status === 'active')
              .map((cw) => ({
                id: cw.id,
                name: `${cw.firstName} ${cw.lastName}`,
              })),
            customFields: programCustomFields.map((f) => ({
              name: f.name,
              label: f.label,
              fieldType: f.fieldType,
              options: f.options,
              required: f.required,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'token') {
                    assistantMessage.content += data.content;

                    // Strip JSON code blocks from displayed content
                    const displayContent = assistantMessage.content
                      .replace(/```json\n[\s\S]*?\n```/g, '')
                      .trim();

                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      const displayMessage = {
                        ...assistantMessage,
                        content: displayContent,
                      };

                      if (
                        lastMessage?.role === 'assistant' &&
                        lastMessage.id === assistantMessage.id
                      ) {
                        newMessages[newMessages.length - 1] = displayMessage;
                      } else {
                        newMessages.push(displayMessage);
                      }
                      return newMessages;
                    });
                  } else if (data.type === 'extraction') {
                    setExtractedData((prev) => ({
                      ...prev,
                      ...data.data,
                      confidence: {
                        ...prev.confidence,
                        ...data.data.confidence,
                      },
                    }));
                  } else if (data.type === 'done') {
                    setIsTyping(false);
                  } else if (data.type === 'error') {
                    console.error('Extraction error:', data.error);
                    setIsTyping(false);
                  }
                } catch (e) {
                  console.error('Failed to parse SSE data:', e);
                }
              }
            }
          }
        }

        setIsTyping(false);
      } catch (error) {
        console.error('Error sending message:', error);
        setIsTyping(false);

        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'system',
          content:
            'Sorry, there was an error communicating with the agent. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    [messages, availablePrograms, caseWorkers, programCustomFields],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      handleSendMessage(input);
    }
  };

  const updateField = (field: string, value: any) => {
    setExtractedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateCustomField = (fieldName: string, value: any) => {
    setExtractedData((prev) => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldName]: value,
      },
    }));
  };

  const handleDocumentExtract = useCallback((data: any) => {
    console.log('handleDocumentExtract received:', data);

    setExtractedData((prev) => {
      const updated = {
        ...prev,
        ...data,
        confidence: {
          ...prev.confidence,
          ...data.confidence,
        },
      };
      console.log('Updated extractedData:', updated);
      return updated;
    });

    // Add a system message to confirm extraction
    const confirmationMessage: Message = {
      id: Date.now().toString(),
      role: 'system',
      content:
        'Document data extracted successfully! Please review the information on the right.',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmationMessage]);
  }, []);

  const handleCSVExtract = useCallback(
    (data: {
      headers: string[];
      rows: any[];
      autoMapping: Record<string, string>;
      isFamilyCSV?: boolean;
    }) => {
      console.log('CSV extracted data:', data);
      setCsvRawData(data.rows);
      setCsvHeaders(data.headers);
      setColumnMapping(data.autoMapping);
      setIsFamilyCSV(data.isFamilyCSV || false);
      setShowColumnMapping(true);

      const type = data.isFamilyCSV ? 'families' : 'participants';
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `CSV processed successfully! Found ${data.rows.length} row(s) for ${type}. Please map columns below.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmationMessage]);
    },
    [],
  );

  const handleBulkImport = useCallback(async () => {
    if (!currentProgramId) {
      alert('Please select a program from the header dropdown');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      for (const participant of csvParticipants) {
        try {
          // Parse date of birth
          let dob: Date;
          if (participant.dateOfBirth) {
            dob = new Date(participant.dateOfBirth);
          } else {
            dob = new Date(1970, 0, 1); // Default date
          }

          // Create participant
          const created = createParticipant({
            firstName: participant.firstName,
            lastName: participant.lastName,
            dateOfBirth: dob,
            gender: participant.gender || 99,
            dobDataQuality: participant.dateOfBirth ? 1 : 2,
            email: participant.email,
            phoneNumber: participant.phoneNumber,
            address: participant.address,
            customData: {},
          });

          // Create enrollment
          createEnrollment({
            tenantId: currentTenantId || 'TENANT-001',
            enrolleeType: 'participant',
            enrolleeId: created.id,
            participantId: created.id,
            programId: currentProgramId,
            siteId: currentSiteId,
            status: 'active',
            startDate: new Date(),
            outcomes: [],
            servicesReceived: [],
            outcomeGoals: [],
          });

          successCount++;
        } catch (error) {
          console.error('Error importing participant:', error);
          failedCount++;
        }
      }

      alert(
        `Import complete!\n\nSuccess: ${successCount}\nFailed: ${failedCount}`,
      );

      // Reset state
      setShowBulkImport(false);
      setCsvParticipants([]);

      // Redirect to participants list
      router.push('/participants');
    } catch (error) {
      console.error('Bulk import error:', error);
      alert('An error occurred during import');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    csvParticipants,
    currentProgramId,
    currentSiteId,
    currentTenantId,
    createParticipant,
    createEnrollment,
    router,
  ]);

  const handleCompleteIntake = () => {
    // Common validation
    if (!extractedData.programId) {
      alert('Please select a program');
      return;
    }

    if (!extractedData.caseWorkerId) {
      alert('Please assign a case worker');
      return;
    }

    try {
      if (enrolleeType === 'participant') {
        // Validate participant fields
        if (!extractedData.firstName || !extractedData.lastName) {
          alert('Please provide first and last name');
          return;
        }

        if (!extractedData.dateOfBirth && !extractedData.approximateAge) {
          alert('Please provide date of birth or approximate age');
          return;
        }

        // Calculate DOB from age if needed
        let dob: Date;
        if (extractedData.dateOfBirth) {
          dob = new Date(extractedData.dateOfBirth);
        } else if (extractedData.approximateAge) {
          const currentYear = new Date().getFullYear();
          dob = new Date(currentYear - extractedData.approximateAge, 0, 1);
        } else {
          alert('Please provide date of birth or approximate age');
          return;
        }

        // Create participant
        const participant = createParticipant({
          firstName: extractedData.firstName,
          lastName: extractedData.lastName,
          dateOfBirth: dob,
          approximateAge: extractedData.approximateAge,
          dobDataQuality: extractedData.dateOfBirth ? 1 : 2,
          gender: extractedData.gender || 99,
          phoneNumber: extractedData.phoneNumber,
          email: extractedData.email,
          address: extractedData.address,
          customData: extractedData.customFields || {},
        });

        // Store created participant and show enrollment option
        setCreatedParticipantId(participant.id);
        setShowEnrollmentOption(true);
      } else if (enrolleeType === 'family') {
        // Validate family fields
        if (
          !extractedData.familyMembers ||
          extractedData.familyMembers.length === 0
        ) {
          alert('Please provide at least one family member');
          return;
        }

        // Create participants for each family member
        const createdParticipantIds: string[] = [];
        for (const member of extractedData.familyMembers) {
          if (!member.firstName || !member.lastName) continue;

          let dob: Date;
          if (member.dateOfBirth) {
            dob = new Date(member.dateOfBirth);
          } else if (member.approximateAge) {
            const currentYear = new Date().getFullYear();
            dob = new Date(currentYear - member.approximateAge, 0, 1);
          } else {
            continue;
          }

          const participant = createParticipant({
            firstName: member.firstName,
            lastName: member.lastName,
            dateOfBirth: dob,
            approximateAge: member.approximateAge,
            dobDataQuality: member.dateOfBirth ? 1 : 2,
            gender: member.gender || 99,
            phoneNumber: member.phoneNumber,
            email: member.email,
            customData: {},
          });

          createdParticipantIds.push(participant.id);
        }

        // Create household
        const household = createHousehold({
          name: extractedData.familyName || 'Unnamed Family',
          members: createdParticipantIds.map((id, idx) => {
            const member = extractedData.familyMembers![idx];
            return {
              id,
              relationshipToHoH:
                member.relationshipToHoH || (idx === 0 ? 'self' : 'other'),
            };
          }),
          headOfHouseholdId:
            extractedData.headOfHouseholdId || createdParticipantIds[0],
          primaryAddress: extractedData.address,
        });

        // Create enrollment for family
        createEnrollment({
          householdId: household.id,
          programId: extractedData.programId,
          caseWorkerId: extractedData.caseWorkerId,
          enrollmentDate: extractedData.enrollmentDate
            ? new Date(extractedData.enrollmentDate)
            : new Date(),
          status: 'active',
        });

        alert(
          `Successfully enrolled family with ${createdParticipantIds.length} members in ${extractedData.program}`,
        );
        router.push(`/families/${household.id}`);
      } else if (enrolleeType === 'entity') {
        // Validate entity fields
        if (!extractedData.entityName) {
          alert('Please provide entity name');
          return;
        }

        if (!extractedData.entityType) {
          alert('Please provide entity type');
          return;
        }

        // Create entity
        const entity = createEntity({
          name: extractedData.entityName,
          entityType: extractedData.entityType as any,
          description: extractedData.entityDescription,
          address: extractedData.entityAddress,
          city: extractedData.entityCity,
          state: extractedData.entityState,
          zipCode: extractedData.entityZipCode,
          phone: extractedData.entityPhone,
          email: extractedData.entityEmail,
          website: extractedData.entityWebsite,
          contactPerson: extractedData.contactPerson,
          contactTitle: extractedData.contactTitle,
          partnershipStatus: 'active',
          customData: {},
        });

        // Create enrollment for entity
        createEnrollment({
          entityId: entity.id,
          programId: extractedData.programId,
          caseWorkerId: extractedData.caseWorkerId,
          enrollmentDate: extractedData.enrollmentDate
            ? new Date(extractedData.enrollmentDate)
            : new Date(),
          status: 'active',
        });

        alert(
          `Successfully enrolled ${entity.name} in ${extractedData.program}`,
        );
        router.push(`/entities/${entity.id}`);
      }
    } catch (error) {
      console.error('Error completing intake:', error);
      alert('Error completing intake. Please try again.');
    }
  };

  const handleEnrollNow = () => {
    if (
      !createdParticipantId ||
      !extractedData.programId ||
      !extractedData.caseWorkerId
    )
      return;

    createEnrollment({
      participantId: createdParticipantId,
      programId: extractedData.programId,
      caseWorkerId: extractedData.caseWorkerId,
      enrollmentDate: extractedData.enrollmentDate
        ? new Date(extractedData.enrollmentDate)
        : new Date(),
      status: 'active',
    });

    router.push(`/participants/${createdParticipantId}`);
  };

  const handleViewProfile = () => {
    if (!createdParticipantId) return;
    router.push(`/participants/${createdParticipantId}`);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Calculate required fields progress
  const requiredFields = [
    'firstName',
    'lastName',
    'dateOfBirth_or_age',
    'program',
    'caseWorker',
  ];
  const requiredCustomFields = programCustomFields.filter((f) => f.required);
  const totalRequired = requiredFields.length + requiredCustomFields.length;

  let completedRequired = 0;
  if (extractedData.firstName) completedRequired++;
  if (extractedData.lastName) completedRequired++;
  if (extractedData.dateOfBirth || extractedData.approximateAge)
    completedRequired++;
  if (extractedData.programId) completedRequired++;
  if (extractedData.caseWorkerId) completedRequired++;

  requiredCustomFields.forEach((field) => {
    if (extractedData.customFields?.[field.name]) completedRequired++;
  });

  const canComplete = (() => {
    const hasProgram = extractedData.programId && extractedData.caseWorkerId;

    if (enrolleeType === 'participant') {
      return (
        hasProgram &&
        extractedData.firstName &&
        extractedData.lastName &&
        (extractedData.dateOfBirth || extractedData.approximateAge)
      );
    } else if (enrolleeType === 'family') {
      return (
        hasProgram &&
        extractedData.familyMembers &&
        extractedData.familyMembers.length > 0
      );
    } else if (enrolleeType === 'entity') {
      return hasProgram && extractedData.entityName && extractedData.entityType;
    }

    return false;
  })();

  // Helper function to get confidence badge
  const getConfidenceBadge = (
    field: string,
    confidence?: Record<string, number>,
  ) => {
    if (!confidence || confidence[field] === undefined) return null;

    const level = confidence[field];
    const color =
      level >= 0.8 ? '#10b981' : level >= 0.5 ? '#f59e0b' : '#ef4444';
    const text = level >= 0.8 ? 'High' : level >= 0.5 ? 'Medium' : 'Low';

    return (
      <span
        style={{
          backgroundColor: color,
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          marginLeft: '8px',
        }}
      >
        {text}
      </span>
    );
  };

  return (
    <PageLayout pageTitle="Intake Agent">
      <Stack space="400">
        {/* Header */}
        <Stack space="300">
          <InlineStack gap="400" verticalAlign="center">
            <Stack space="200">
              <Heading level={1}>Intake Agent</Heading>
              <Text>Conversational AI for enrollment</Text>
            </Stack>
            {enrolleeType && (
              <Button
                variant="secondary"
                size="small"
                onPress={() => {
                  setEnrolleeType(null);
                  setMessages([]);
                  setExtractedData({});
                  setShowBulkImport(false);
                  setShowColumnMapping(false);
                  setShowValueMapping(false);
                  setCsvParticipants([]);
                  setCsvRawData([]);
                  setCsvHeaders([]);
                  setColumnMapping({});
                  setValueMapping({});
                  setShowEnrollmentOption(false);
                  setCreatedParticipantId(null);
                }}
              >
                ← Change Type
              </Button>
            )}
          </InlineStack>
        </Stack>

        {/* Enrollee Type Selection */}
        {!enrolleeType && (
          <div>
            <Heading level={2} style={{ marginBottom: '16px' }}>
              Who are you enrolling?
            </Heading>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
              }}
            >
              <button
                onClick={() => setEnrolleeType('participant')}
                style={{
                  padding: '32px 24px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7C3AED';
                  e.currentTarget.style.backgroundColor = '#F5F3FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <Stack space="200" align="center">
                  <div style={{ fontSize: '48px' }}>👤</div>
                  <Heading level={3}>Individual</Heading>
                  <Text variant="sm" color="subdued">
                    Enroll a single participant
                  </Text>
                </Stack>
              </button>

              <button
                onClick={() => setEnrolleeType('family')}
                style={{
                  padding: '32px 24px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7C3AED';
                  e.currentTarget.style.backgroundColor = '#F5F3FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <Stack space="200" align="center">
                  <div style={{ fontSize: '48px' }}>👨‍👩‍👧‍👦</div>
                  <Heading level={3}>Family</Heading>
                  <Text variant="sm" color="subdued">
                    Enroll a family/household
                  </Text>
                </Stack>
              </button>

              <button
                onClick={() => setEnrolleeType('entity')}
                style={{
                  padding: '32px 24px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7C3AED';
                  e.currentTarget.style.backgroundColor = '#F5F3FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <Stack space="200" align="center">
                  <div style={{ fontSize: '48px' }}>🏢</div>
                  <Heading level={3}>Organization</Heading>
                  <Text variant="sm" color="subdued">
                    Enroll an entity/organization
                  </Text>
                </Stack>
              </button>
            </div>
          </div>
        )}

        {/* Success - Enrollment Option */}
        {showEnrollmentOption && createdParticipantId && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #10b981',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <Stack space="400" align="center">
              <div style={{ fontSize: '64px' }}>✅</div>
              <Heading level={2}>Individual Created Successfully!</Heading>
              <Text color="subdued">
                {extractedData.firstName} {extractedData.lastName} has been
                added to the system.
              </Text>
              <div
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                }}
              >
                <Text weight="500" style={{ marginBottom: '8px' }}>
                  What would you like to do next?
                </Text>
              </div>
              <InlineStack gap="300">
                <Button variant="secondary" onPress={handleViewProfile}>
                  View Profile
                </Button>
                <Button variant="primary" onPress={handleEnrollNow}>
                  Enroll in {extractedData.program}
                </Button>
              </InlineStack>
            </Stack>
          </div>
        )}

        {/* Column Mapping UI */}
        {showColumnMapping && csvHeaders.length > 0 && (
          <Card>
            <Stack space="400">
              <Heading level={2}>Map CSV Columns</Heading>
              <Text>Match your CSV columns to participant fields</Text>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                <Text weight="600">CSV Column</Text>
                <Text weight="600">Maps To</Text>

                {csvHeaders.map((column) => (
                  <React.Fragment key={column}>
                    <Text>{column}</Text>
                    <select
                      value={columnMapping[column] || ''}
                      onChange={(e) =>
                        setColumnMapping({
                          ...columnMapping,
                          [column]: e.target.value,
                        })
                      }
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: 'white',
                      }}
                    >
                      <option value="">Skip this column</option>
                      {isFamilyCSV && (
                        <>
                          <option value="familyName">Family Name</option>
                          <option value="relationship">
                            Relationship to Head of Household
                          </option>
                        </>
                      )}
                      <option value="firstName">First Name</option>
                      <option value="lastName">Last Name</option>
                      <option value="dateOfBirth">Date of Birth</option>
                      <option value="email">Email</option>
                      <option value="phoneNumber">Phone Number</option>
                      <option value="address">Address</option>
                      <option value="gender">Gender</option>
                    </select>
                  </React.Fragment>
                ))}
              </div>

              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                }}
              >
                <Text variant="sm">
                  💡 <strong>Tip:</strong> Columns are auto-detected, but you
                  can adjust the mapping as needed. Fields marked "Skip this
                  column" will be ignored.
                </Text>
              </div>

              <InlineStack gap="300">
                <Button
                  variant="secondary"
                  onPress={() => {
                    setShowColumnMapping(false);
                    setCsvRawData([]);
                    setCsvHeaders([]);
                    setColumnMapping({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onPress={() => {
                    // Check if any mapped columns need value mapping
                    const fieldsNeedingValueMapping: string[] = [];
                    const initialValueMapping: Record<
                      string,
                      Record<string, any>
                    > = {};

                    Object.entries(columnMapping).forEach(
                      ([csvCol, sysField]) => {
                        if (!sysField) return;

                        // Gender needs value mapping
                        if (sysField === 'gender') {
                          fieldsNeedingValueMapping.push(csvCol);

                          // Get unique values from CSV
                          const uniqueValues = new Set<string>();
                          csvRawData.forEach((row) => {
                            if (row[csvCol]) uniqueValues.add(row[csvCol]);
                          });

                          // Auto-detect gender mappings
                          const genderMap: Record<string, number> = {};
                          uniqueValues.forEach((val) => {
                            const lower = val.toLowerCase();
                            if (
                              lower.includes('f') ||
                              lower === 'woman' ||
                              lower === 'girl' ||
                              lower === 'female'
                            ) {
                              genderMap[val] = 0;
                            } else if (
                              lower.includes('m') ||
                              lower === 'man' ||
                              lower === 'boy' ||
                              lower === 'male'
                            ) {
                              genderMap[val] = 1;
                            } else if (lower.includes('trans')) {
                              genderMap[val] = 2;
                            } else if (
                              lower.includes('non') ||
                              lower.includes('nb') ||
                              lower.includes('enby')
                            ) {
                              genderMap[val] = 3;
                            } else {
                              genderMap[val] = 99; // Data not collected
                            }
                          });

                          initialValueMapping[csvCol] = genderMap;
                        }
                      },
                    );

                    if (fieldsNeedingValueMapping.length > 0) {
                      setValueMapping(initialValueMapping);
                      setShowColumnMapping(false);
                      setShowValueMapping(true);

                      const confirmationMessage: Message = {
                        id: Date.now().toString(),
                        role: 'system',
                        content: `Column mapping complete! Now map field values.`,
                        timestamp: new Date(),
                      };
                      setMessages((prev) => [...prev, confirmationMessage]);
                    } else {
                      // No value mapping needed, go straight to preview
                      if (isFamilyCSV) {
                        // Group by family for family CSVs
                        const families: Record<string, any[]> = {};
                        csvRawData.forEach((row) => {
                          const member: any = {};
                          Object.entries(columnMapping).forEach(
                            ([csvCol, sysField]) => {
                              if (sysField && row[csvCol]) {
                                member[sysField] = row[csvCol];
                              }
                            },
                          );

                          const familyName =
                            member.familyName || 'Unknown Family';
                          if (!families[familyName]) {
                            families[familyName] = [];
                          }
                          families[familyName].push(member);
                        });

                        const familyList = Object.entries(families).map(
                          ([name, members]) => ({
                            familyName: name,
                            members,
                          }),
                        );

                        setCsvParticipants(familyList);
                        setShowColumnMapping(false);
                        setShowBulkImport(true);

                        const confirmationMessage: Message = {
                          id: Date.now().toString(),
                          role: 'system',
                          content: `Mapping complete! ${familyList.length} familie(s) ready to import.`,
                          timestamp: new Date(),
                        };
                        setMessages((prev) => [...prev, confirmationMessage]);
                      } else {
                        // Individual participants
                        const mapped: any[] = [];
                        csvRawData.forEach((row) => {
                          const participant: any = {};
                          Object.entries(columnMapping).forEach(
                            ([csvCol, sysField]) => {
                              if (sysField && row[csvCol]) {
                                participant[sysField] = row[csvCol];
                              }
                            },
                          );
                          if (participant.firstName && participant.lastName) {
                            mapped.push(participant);
                          }
                        });

                        setCsvParticipants(mapped);
                        setShowColumnMapping(false);
                        setShowBulkImport(true);

                        const confirmationMessage: Message = {
                          id: Date.now().toString(),
                          role: 'system',
                          content: `Mapping complete! ${mapped.length} participant(s) ready to import.`,
                          timestamp: new Date(),
                        };
                        setMessages((prev) => [...prev, confirmationMessage]);
                      }
                    }
                  }}
                >
                  Continue
                </Button>
              </InlineStack>
            </Stack>
          </Card>
        )}

        {/* Value Mapping UI */}
        {showValueMapping && Object.keys(valueMapping).length > 0 && (
          <Card>
            <Stack space="400">
              <Heading level={2}>Map Field Values</Heading>
              <Text>Match CSV values to system values</Text>

              {Object.entries(valueMapping).map(([csvCol, mappings]) => {
                const systemField = columnMapping[csvCol];

                return (
                  <div key={csvCol}>
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <Text weight="600" style={{ marginBottom: '12px' }}>
                        {csvCol} →{' '}
                        {systemField === 'gender' ? 'Gender' : systemField}
                      </Text>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                        }}
                      >
                        <Text variant="sm" weight="600">
                          CSV Value
                        </Text>
                        <Text variant="sm" weight="600">
                          System Value
                        </Text>

                        {Object.entries(mappings).map(
                          ([csvValue, sysValue]) => (
                            <React.Fragment key={csvValue}>
                              <div
                                style={{
                                  padding: '8px',
                                  backgroundColor: 'white',
                                  borderRadius: '6px',
                                  border: '1px solid #e5e7eb',
                                }}
                              >
                                <Text variant="sm">{csvValue}</Text>
                              </div>

                              {systemField === 'gender' ? (
                                <select
                                  value={sysValue}
                                  onChange={(e) => {
                                    setValueMapping({
                                      ...valueMapping,
                                      [csvCol]: {
                                        ...valueMapping[csvCol],
                                        [csvValue]: parseInt(e.target.value),
                                      },
                                    });
                                  }}
                                  style={{
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    backgroundColor: 'white',
                                  }}
                                >
                                  <option value="0">Female</option>
                                  <option value="1">Male</option>
                                  <option value="2">Transgender</option>
                                  <option value="3">Non-Binary</option>
                                  <option value="4">
                                    Culturally Specific Identity
                                  </option>
                                  <option value="5">Different Identity</option>
                                  <option value="99">Data Not Collected</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={sysValue}
                                  onChange={(e) => {
                                    setValueMapping({
                                      ...valueMapping,
                                      [csvCol]: {
                                        ...valueMapping[csvCol],
                                        [csvValue]: e.target.value,
                                      },
                                    });
                                  }}
                                  style={{
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    backgroundColor: 'white',
                                  }}
                                />
                              )}
                            </React.Fragment>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                }}
              >
                <Text variant="sm">
                  💡 <strong>Tip:</strong> Auto-detected mappings are shown, but
                  you can adjust them. For example, map "M" to "Male" or "Trans"
                  to "Transgender".
                </Text>
              </div>

              <InlineStack gap="300">
                <Button
                  variant="secondary"
                  onPress={() => {
                    setShowValueMapping(false);
                    setShowColumnMapping(true);
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onPress={() => {
                    // Apply both column and value mapping
                    const mapped: any[] = [];
                    csvRawData.forEach((row) => {
                      const participant: any = {};
                      Object.entries(columnMapping).forEach(
                        ([csvCol, sysField]) => {
                          if (!sysField || !row[csvCol]) return;

                          // Check if this field has value mapping
                          if (
                            valueMapping[csvCol] &&
                            valueMapping[csvCol][row[csvCol]] !== undefined
                          ) {
                            participant[sysField] =
                              valueMapping[csvCol][row[csvCol]];
                          } else {
                            participant[sysField] = row[csvCol];
                          }
                        },
                      );
                      if (participant.firstName && participant.lastName) {
                        mapped.push(participant);
                      }
                    });

                    setCsvParticipants(mapped);
                    setShowValueMapping(false);
                    setShowBulkImport(true);

                    const confirmationMessage: Message = {
                      id: Date.now().toString(),
                      role: 'system',
                      content: `Mapping complete! ${mapped.length} participant(s) ready to import.`,
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, confirmationMessage]);
                  }}
                >
                  Continue to Preview
                </Button>
              </InlineStack>
            </Stack>
          </Card>
        )}

        {/* Bulk CSV Import Preview */}
        {showBulkImport && csvParticipants.length > 0 && (
          <Card>
            <Stack space="400">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <Heading level={2}>CSV Import Preview</Heading>
                  <Text>
                    {isFamilyCSV
                      ? `${csvParticipants.length} familie(s) ready to import`
                      : `${csvParticipants.length} participant(s) ready to import`}
                  </Text>
                </div>
              </div>

              <div
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              >
                {isFamilyCSV ? (
                  // Family View
                  <Stack space="200">
                    {csvParticipants.map((family: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          backgroundColor: '#f9fafb',
                          margin: '8px',
                        }}
                      >
                        <Stack space="300">
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text weight="600" style={{ fontSize: '16px' }}>
                              {idx + 1}. {family.familyName}
                            </Text>
                            <div
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#dbeafe',
                                borderRadius: '12px',
                              }}
                            >
                              <Text
                                variant="sm"
                                weight="600"
                                style={{ color: '#1e40af' }}
                              >
                                {family.members.length} member
                                {family.members.length !== 1 ? 's' : ''}
                              </Text>
                            </div>
                          </div>
                          <div
                            style={{
                              backgroundColor: 'white',
                              padding: '12px',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                            }}
                          >
                            {family.members.map((member: any, mIdx: number) => (
                              <div
                                key={mIdx}
                                style={{
                                  display: 'flex',
                                  gap: '16px',
                                  padding: '8px 0',
                                  borderBottom:
                                    mIdx < family.members.length - 1
                                      ? '1px solid #f3f4f6'
                                      : 'none',
                                }}
                              >
                                <Text
                                  variant="sm"
                                  style={{ minWidth: '150px' }}
                                >
                                  <strong>
                                    {member.firstName} {member.lastName}
                                  </strong>
                                </Text>
                                <Text
                                  variant="sm"
                                  color="subdued"
                                  style={{ minWidth: '120px' }}
                                >
                                  {member.relationship || 'N/A'}
                                </Text>
                                <Text variant="sm" color="subdued">
                                  {member.dateOfBirth || 'N/A'}
                                </Text>
                              </div>
                            ))}
                          </div>
                        </Stack>
                      </div>
                    ))}
                  </Stack>
                ) : (
                  // Individual Participants View
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead
                      style={{
                        backgroundColor: '#f9fafb',
                        position: 'sticky',
                        top: 0,
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            padding: '12px',
                            textAlign: 'left',
                            borderBottom: '1px solid #e5e7eb',
                          }}
                        >
                          <Text variant="sm" weight="600">
                            #
                          </Text>
                        </th>
                        <th
                          style={{
                            padding: '12px',
                            textAlign: 'left',
                            borderBottom: '1px solid #e5e7eb',
                          }}
                        >
                          <Text variant="sm" weight="600">
                            First Name
                          </Text>
                        </th>
                        <th
                          style={{
                            padding: '12px',
                            textAlign: 'left',
                            borderBottom: '1px solid #e5e7eb',
                          }}
                        >
                          <Text variant="sm" weight="600">
                            Last Name
                          </Text>
                        </th>
                        <th
                          style={{
                            padding: '12px',
                            textAlign: 'left',
                            borderBottom: '1px solid #e5e7eb',
                          }}
                        >
                          <Text variant="sm" weight="600">
                            DOB
                          </Text>
                        </th>
                        <th
                          style={{
                            padding: '12px',
                            textAlign: 'left',
                            borderBottom: '1px solid #e5e7eb',
                          }}
                        >
                          <Text variant="sm" weight="600">
                            Email
                          </Text>
                        </th>
                        <th
                          style={{
                            padding: '12px',
                            textAlign: 'left',
                            borderBottom: '1px solid #e5e7eb',
                          }}
                        >
                          <Text variant="sm" weight="600">
                            Gender
                          </Text>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvParticipants.map((p, idx) => {
                        const genderLabels: Record<number, string> = {
                          0: 'Female',
                          1: 'Male',
                          2: 'Transgender',
                          3: 'Non-Binary',
                          4: 'Culturally Specific',
                          5: 'Different Identity',
                          99: 'Not Collected',
                        };

                        return (
                          <tr key={idx}>
                            <td
                              style={{
                                padding: '12px',
                                borderBottom: '1px solid #e5e7eb',
                              }}
                            >
                              <Text variant="sm">{idx + 1}</Text>
                            </td>
                            <td
                              style={{
                                padding: '12px',
                                borderBottom: '1px solid #e5e7eb',
                              }}
                            >
                              <Text variant="sm">{p.firstName || '-'}</Text>
                            </td>
                            <td
                              style={{
                                padding: '12px',
                                borderBottom: '1px solid #e5e7eb',
                              }}
                            >
                              <Text variant="sm">{p.lastName || '-'}</Text>
                            </td>
                            <td
                              style={{
                                padding: '12px',
                                borderBottom: '1px solid #e5e7eb',
                              }}
                            >
                              <Text variant="sm">{p.dateOfBirth || '-'}</Text>
                            </td>
                            <td
                              style={{
                                padding: '12px',
                                borderBottom: '1px solid #e5e7eb',
                              }}
                            >
                              <Text variant="sm">{p.email || '-'}</Text>
                            </td>
                            <td
                              style={{
                                padding: '12px',
                                borderBottom: '1px solid #e5e7eb',
                              }}
                            >
                              <Text variant="sm">
                                {p.gender !== undefined
                                  ? genderLabels[p.gender]
                                  : '-'}
                              </Text>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {!currentProgramId ? (
                <div
                  style={{
                    padding: '20px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                    border: '2px solid #fecaca',
                  }}
                >
                  <Stack space="300">
                    <InlineStack gap="200" verticalAlign="center">
                      <div style={{ fontSize: '24px' }}>⚠️</div>
                      <Text
                        weight="600"
                        style={{ color: '#dc2626', fontSize: '16px' }}
                      >
                        Program Not Selected
                      </Text>
                    </InlineStack>
                    <Text variant="sm" style={{ color: '#991b1b' }}>
                      All participants will be enrolled in a program. Please
                      select a program from the{' '}
                      <strong>top navigation bar</strong> before importing.
                    </Text>
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: '#fffbeb',
                        borderRadius: '6px',
                        border: '1px solid #fcd34d',
                      }}
                    >
                      <Text variant="sm" style={{ color: '#92400e' }}>
                        👆 Look for <strong>"All Programs"</strong> dropdown in
                        the header (top right corner) and select your program.
                      </Text>
                    </div>
                  </Stack>
                </div>
              ) : (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    border: '1px solid #fbbf24',
                  }}
                >
                  <Text variant="sm">
                    ✓ All participants will be enrolled in:{' '}
                    <strong>
                      {programs.find((p) => p.id === currentProgramId)?.name}
                    </strong>
                  </Text>
                </div>
              )}

              <InlineStack gap="300">
                <Button
                  variant="secondary"
                  onPress={() => {
                    setShowBulkImport(false);
                    setCsvParticipants([]);
                  }}
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onPress={handleBulkImport}
                  isDisabled={!currentProgramId || isSubmitting}
                >
                  {isSubmitting
                    ? 'Importing...'
                    : `Import ${csvParticipants.length} Participants`}
                </Button>
              </InlineStack>
            </Stack>
          </Card>
        )}

        {/* AI Chat Interface */}
        {enrolleeType &&
          !showEnrollmentOption &&
          !showBulkImport &&
          !showColumnMapping &&
          !showValueMapping && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
              }}
            >
              {/* Chat */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  height: 'calc(100vh - 300px)',
                  minHeight: '600px',
                }}
              >
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <Heading level={3}>Agent Conversation</Heading>
                      <Text variant="sm" color="subdued">
                        Chat with the intake agent to enroll a{' '}
                        {enrolleeType === 'participant'
                          ? 'participant'
                          : enrolleeType === 'family'
                            ? 'family'
                            : 'organization'}
                      </Text>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() => setShowUpload(!showUpload)}
                    >
                      {showUpload ? 'Hide Upload' : 'Show Upload'}
                    </Button>
                  </div>
                </div>

                {/* Upload Area with Tabs */}
                {showUpload && (
                  <div style={{ margin: '16px 24px' }}>
                    {/* Upload Type Tabs */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '16px',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      <button
                        onClick={() => setUploadType('document')}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          borderBottom:
                            uploadType === 'document'
                              ? '2px solid #7c3aed'
                              : '2px solid transparent',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          fontWeight: uploadType === 'document' ? '600' : '400',
                          color:
                            uploadType === 'document' ? '#7c3aed' : '#6b7280',
                        }}
                      >
                        📄 Document
                      </button>
                      <button
                        onClick={() => setUploadType('csv')}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          borderBottom:
                            uploadType === 'csv'
                              ? '2px solid #7c3aed'
                              : '2px solid transparent',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          fontWeight: uploadType === 'csv' ? '600' : '400',
                          color: uploadType === 'csv' ? '#7c3aed' : '#6b7280',
                        }}
                      >
                        📊 CSV Import
                      </button>
                    </div>

                    {uploadType === 'document' ? (
                      <DocumentUpload
                        onExtract={handleDocumentExtract}
                        disabled={isTyping}
                        isVisible={true}
                        onToggleVisibility={() => setShowUpload(!showUpload)}
                      />
                    ) : (
                      <CSVUpload
                        onExtract={handleCSVExtract}
                        disabled={isTyping}
                        enrolleeType={enrolleeType || 'participant'}
                      />
                    )}
                  </div>
                )}

                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent:
                          message.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '80%',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          backgroundColor:
                            message.role === 'user'
                              ? '#7c3aed'
                              : message.role === 'system'
                                ? '#f3f4f6'
                                : '#f9fafb',
                          color: message.role === 'user' ? 'white' : '#111827',
                        }}
                      >
                        <div
                          style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}
                        >
                          {message.content}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            marginTop: '4px',
                            color:
                              message.role === 'user'
                                ? 'rgba(255,255,255,0.7)'
                                : '#6b7280',
                          }}
                        >
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div
                      style={{ display: 'flex', justifyContent: 'flex-start' }}
                    >
                      <div
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          padding: '12px 16px',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: '#9ca3af',
                              borderRadius: '50%',
                              animation: 'bounce 1s infinite',
                            }}
                          ></div>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: '#9ca3af',
                              borderRadius: '50%',
                              animation: 'bounce 1s infinite 0.1s',
                            }}
                          ></div>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: '#9ca3af',
                              borderRadius: '50%',
                              animation: 'bounce 1s infinite 0.2s',
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div
                  style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', gap: '12px' }}
                  >
                    <div style={{ flex: 1 }}>
                      <TextField
                        value={input}
                        onChange={setInput}
                        placeholder="Type your message..."
                        isDisabled={isTyping}
                        aria-label="Message input"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      isDisabled={!input.trim() || isTyping}
                      onPress={() => {}}
                    >
                      Send
                    </Button>
                  </form>
                </div>
              </div>

              {/* Collected Information Panel */}
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  padding: '24px',
                  height: 'calc(100vh - 300px)',
                  minHeight: '600px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ marginBottom: '24px' }}>
                  <Heading level={2}>Collected Information</Heading>

                  {/* Progress Bar */}
                  {(extractedData.firstName ||
                    extractedData.lastName ||
                    extractedData.program) && (
                    <div style={{ marginTop: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <Text variant="sm" weight="500">
                          Progress
                        </Text>
                        <Text variant="sm" color="subdued">
                          {completedRequired} of {totalRequired} required fields
                        </Text>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${(completedRequired / totalRequired) * 100}%`,
                            height: '100%',
                            backgroundColor: '#2563eb',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <Stack space="300">
                    {/* Edit Mode - Form Fields */}
                    <Heading level={3}>Edit Information</Heading>

                    {/* Enrollment Details */}
                    <div>
                      <Text weight="500" style={{ marginBottom: '12px' }}>
                        Enrollment Details
                      </Text>
                      <Stack space="200">
                        <Select
                          label="Program"
                          selectedKey={extractedData.programId || ''}
                          onSelectionChange={(key) => {
                            const program = availablePrograms.find(
                              (p) => p.id === key,
                            );
                            updateField('programId', key);
                            updateField('program', program?.name);
                          }}
                        >
                          <SelectItem id="">Select program...</SelectItem>
                          {availablePrograms.map((p) => (
                            <SelectItem key={p.id} id={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </Select>

                        <Select
                          label="Case Worker"
                          selectedKey={extractedData.caseWorkerId || ''}
                          onSelectionChange={(key) => {
                            const cw = caseWorkers.find((c) => c.id === key);
                            updateField('caseWorkerId', key);
                            updateField(
                              'caseWorker',
                              cw ? `${cw.firstName} ${cw.lastName}` : '',
                            );
                          }}
                        >
                          <SelectItem id="">Select case worker...</SelectItem>
                          {caseWorkers
                            .filter((cw) => cw.status === 'active')
                            .map((cw) => (
                              <SelectItem key={cw.id} id={cw.id}>
                                {cw.firstName} {cw.lastName}
                              </SelectItem>
                            ))}
                        </Select>
                      </Stack>
                    </div>

                    {/* Demographics */}
                    <div>
                      <Text weight="500" style={{ marginBottom: '12px' }}>
                        Demographics
                      </Text>
                      <Stack space="200">
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                          }}
                        >
                          <TextField
                            label="First Name"
                            value={extractedData.firstName || ''}
                            onChange={(value) =>
                              updateField('firstName', value)
                            }
                          />
                          <TextField
                            label="Last Name"
                            value={extractedData.lastName || ''}
                            onChange={(value) => updateField('lastName', value)}
                          />
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '8px',
                              }}
                            >
                              Date of Birth
                            </label>
                            <input
                              type="date"
                              value={extractedData.dateOfBirth || ''}
                              onChange={(e) =>
                                updateField('dateOfBirth', e.target.value)
                              }
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
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '8px',
                              }}
                            >
                              Approximate Age
                            </label>
                            <input
                              type="number"
                              value={extractedData.approximateAge || ''}
                              onChange={(e) =>
                                updateField(
                                  'approximateAge',
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined,
                                )
                              }
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

                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '500',
                              marginBottom: '8px',
                            }}
                          >
                            Gender
                          </label>
                          <select
                            value={
                              extractedData.gender !== undefined &&
                              extractedData.gender !== null
                                ? extractedData.gender
                                : 99
                            }
                            onChange={(e) =>
                              updateField('gender', parseInt(e.target.value))
                            }
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              backgroundColor: 'white',
                            }}
                          >
                            <option value={0}>Female</option>
                            <option value={1}>Male</option>
                            <option value={2}>Transgender</option>
                            <option value={3}>Non-Binary</option>
                            <option value={4}>
                              Culturally Specific Identity
                            </option>
                            <option value={5}>Different Identity</option>
                            <option value={99}>Data Not Collected</option>
                          </select>
                        </div>
                      </Stack>
                    </div>

                    {/* Program-Specific Demographics */}
                    {programCustomFields.length > 0 && (
                      <div>
                        <Text weight="500" style={{ marginBottom: '12px' }}>
                          Program-Specific Demographics
                        </Text>
                        <Stack space="200">
                          {programCustomFields.map((field) => {
                            const value =
                              extractedData.customFields?.[field.name];

                            if (field.fieldType === 'dropdown') {
                              return (
                                <div key={field.id}>
                                  <label
                                    style={{
                                      display: 'block',
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      marginBottom: '8px',
                                    }}
                                  >
                                    {field.label}{' '}
                                    {field.required && (
                                      <span style={{ color: '#dc2626' }}>
                                        *
                                      </span>
                                    )}
                                  </label>
                                  <select
                                    value={value || ''}
                                    onChange={(e) =>
                                      updateCustomField(
                                        field.name,
                                        e.target.value,
                                      )
                                    }
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      backgroundColor: 'white',
                                    }}
                                  >
                                    <option value="">Select...</option>
                                    {field.options?.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }

                            return (
                              <TextField
                                key={field.id}
                                label={
                                  field.label + (field.required ? ' *' : '')
                                }
                                value={value || ''}
                                onChange={(val) =>
                                  updateCustomField(field.name, val)
                                }
                              />
                            );
                          })}
                        </Stack>
                      </div>
                    )}

                    {/* Contact Information */}
                    <div>
                      <Text weight="500" style={{ marginBottom: '12px' }}>
                        Contact Information
                      </Text>
                      <Stack space="200">
                        <TextField
                          label="Email"
                          value={extractedData.email || ''}
                          onChange={(value) => updateField('email', value)}
                        />

                        <TextField
                          label="Phone Number"
                          value={extractedData.phoneNumber || ''}
                          onChange={(value) =>
                            updateField('phoneNumber', value)
                          }
                        />

                        <TextField
                          label="Address"
                          value={extractedData.address || ''}
                          onChange={(value) => updateField('address', value)}
                        />
                      </Stack>
                    </div>

                    <Button
                      variant="secondary"
                      onPress={() => setIsEditing(false)}
                      style={{ width: '100%' }}
                    >
                      Done Editing
                    </Button>
                  </Stack>
                ) : (
                  <div>
                    {/* View Mode - Display Collected Info */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '16px',
                      }}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        onPress={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                    </div>

                    <Stack space="500">
                      {/* Participant Name */}
                      {enrolleeType === 'participant' && (
                        <div>
                          <div
                            style={{
                              padding: '12px 0',
                              borderBottom: '2px solid #e5e7eb',
                              marginBottom: '16px',
                            }}
                          >
                            <Text weight="600" style={{ fontSize: '15px' }}>
                              Participant Name
                            </Text>
                          </div>
                          <Stack space="300">
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginBottom: '4px',
                                }}
                              >
                                <Text variant="sm" weight="500">
                                  First Name
                                </Text>
                                {getConfidenceBadge(
                                  'firstName',
                                  extractedData.confidence,
                                )}
                              </div>
                              <Text
                                variant="sm"
                                color={
                                  extractedData.firstName
                                    ? 'default'
                                    : 'subdued'
                                }
                              >
                                {extractedData.firstName || (
                                  <em>Not provided</em>
                                )}
                              </Text>
                            </div>

                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginBottom: '4px',
                                }}
                              >
                                <Text variant="sm" weight="500">
                                  Last Name
                                </Text>
                                {getConfidenceBadge(
                                  'lastName',
                                  extractedData.confidence,
                                )}
                              </div>
                              <Text
                                variant="sm"
                                color={
                                  extractedData.lastName ? 'default' : 'subdued'
                                }
                              >
                                {extractedData.lastName || (
                                  <em>Not provided</em>
                                )}
                              </Text>
                            </div>

                            {/* Full Name Display */}
                            {(extractedData.firstName ||
                              extractedData.lastName) && (
                              <div
                                style={{
                                  padding: '16px',
                                  backgroundColor: '#f0fdf4',
                                  borderRadius: '8px',
                                  border: '1px solid #86efac',
                                  marginTop: '8px',
                                }}
                              >
                                <Text
                                  variant="sm"
                                  color="subdued"
                                  style={{ marginBottom: '4px' }}
                                >
                                  Full Name:
                                </Text>
                                <Text weight="600" style={{ fontSize: '18px' }}>
                                  {extractedData.firstName || '[First]'}{' '}
                                  {extractedData.lastName || '[Last]'}
                                </Text>
                              </div>
                            )}
                          </Stack>
                        </div>
                      )}

                      {/* Enrollment Details */}
                      <div>
                        <div
                          style={{
                            padding: '12px 0',
                            borderBottom: '2px solid #e5e7eb',
                            marginBottom: '16px',
                          }}
                        >
                          <Text weight="600" style={{ fontSize: '15px' }}>
                            Enrollment Details
                          </Text>
                        </div>
                        <Stack space="300">
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '4px',
                              }}
                            >
                              <Text variant="sm" weight="500">
                                Program
                              </Text>
                              {getConfidenceBadge(
                                'program',
                                extractedData.confidence,
                              )}
                            </div>
                            <Text
                              variant="sm"
                              color={
                                extractedData.program ? 'default' : 'subdued'
                              }
                            >
                              {extractedData.program || <em>Not provided</em>}
                            </Text>
                          </div>

                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '4px',
                              }}
                            >
                              <Text variant="sm" weight="500">
                                Case Worker
                              </Text>
                              {getConfidenceBadge(
                                'caseWorker',
                                extractedData.confidence,
                              )}
                            </div>
                            <Text
                              variant="sm"
                              color={
                                extractedData.caseWorker ? 'default' : 'subdued'
                              }
                            >
                              {extractedData.caseWorker || (
                                <em>Not provided</em>
                              )}
                            </Text>
                          </div>
                        </Stack>
                      </div>

                      {/* Demographics */}
                      <div>
                        <div
                          style={{
                            padding: '12px 0',
                            borderBottom: '2px solid #e5e7eb',
                            marginBottom: '16px',
                          }}
                        >
                          <Text weight="600" style={{ fontSize: '15px' }}>
                            Demographics
                          </Text>
                        </div>
                        <Stack space="300">
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '4px',
                              }}
                            >
                              <Text variant="sm" weight="500">
                                Date of Birth
                              </Text>
                              {getConfidenceBadge(
                                'dateOfBirth',
                                extractedData.confidence,
                              )}
                            </div>
                            {extractedData.dateOfBirth ? (
                              <Text variant="sm">
                                {new Date(
                                  extractedData.dateOfBirth,
                                ).toLocaleDateString()}
                              </Text>
                            ) : extractedData.approximateAge ? (
                              <div>
                                <Text variant="sm">
                                  ~{extractedData.approximateAge} years old
                                </Text>
                                <Text variant="xs" color="subdued">
                                  Approximate or partial DOB reported
                                </Text>
                              </div>
                            ) : (
                              <Text variant="sm" color="subdued">
                                <em>Not provided</em>
                              </Text>
                            )}
                          </div>

                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '4px',
                              }}
                            >
                              <Text variant="sm" weight="500">
                                Gender
                              </Text>
                              {getConfidenceBadge(
                                'gender',
                                extractedData.confidence,
                              )}
                            </div>
                            <Text
                              variant="sm"
                              color={
                                extractedData.gender !== undefined &&
                                extractedData.gender !== 99
                                  ? 'default'
                                  : 'subdued'
                              }
                            >
                              {extractedData.gender !== undefined ? (
                                HMIS_GENDER_CODES[extractedData.gender]
                              ) : (
                                <em>Not provided</em>
                              )}
                            </Text>
                          </div>
                        </Stack>
                      </div>

                      {/* Program-Specific Demographics */}
                      {programCustomFields.length > 0 && (
                        <div>
                          <div
                            style={{
                              padding: '12px 0',
                              borderBottom: '2px solid #e5e7eb',
                              marginBottom: '16px',
                            }}
                          >
                            <Text weight="600" style={{ fontSize: '15px' }}>
                              Program-Specific Demographics
                            </Text>
                          </div>
                          <Stack space="300">
                            {programCustomFields.map((field) => {
                              const value =
                                extractedData.customFields?.[field.name];
                              return (
                                <div key={field.id}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      marginBottom: '4px',
                                    }}
                                  >
                                    <Text variant="sm" weight="500">
                                      {field.label}
                                      {!field.required && (
                                        <span
                                          style={{
                                            color: '#6b7280',
                                            fontWeight: '400',
                                          }}
                                        >
                                          {' '}
                                          (optional)
                                        </span>
                                      )}
                                    </Text>
                                    {value &&
                                      getConfidenceBadge(
                                        field.name,
                                        extractedData.confidence,
                                      )}
                                  </div>
                                  <Text
                                    variant="sm"
                                    color={value ? 'default' : 'subdued'}
                                  >
                                    {value || <em>Not provided</em>}
                                  </Text>
                                </div>
                              );
                            })}
                          </Stack>
                        </div>
                      )}

                      {/* Contact Information */}
                      <div>
                        <div
                          style={{
                            padding: '12px 0',
                            borderBottom: '2px solid #e5e7eb',
                            marginBottom: '16px',
                          }}
                        >
                          <Text weight="600" style={{ fontSize: '15px' }}>
                            Contact Information
                          </Text>
                        </div>
                        <Stack space="300">
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '4px',
                              }}
                            >
                              <Text variant="sm" weight="500">
                                Phone Number{' '}
                                <span
                                  style={{
                                    color: '#6b7280',
                                    fontWeight: '400',
                                  }}
                                >
                                  (optional)
                                </span>
                              </Text>
                              {extractedData.phoneNumber &&
                                getConfidenceBadge(
                                  'phoneNumber',
                                  extractedData.confidence,
                                )}
                            </div>
                            <Text
                              variant="sm"
                              color={
                                extractedData.phoneNumber
                                  ? 'default'
                                  : 'subdued'
                              }
                            >
                              {extractedData.phoneNumber || (
                                <em>Not provided</em>
                              )}
                            </Text>
                          </div>

                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '4px',
                              }}
                            >
                              <Text variant="sm" weight="500">
                                Email{' '}
                                <span
                                  style={{
                                    color: '#6b7280',
                                    fontWeight: '400',
                                  }}
                                >
                                  (optional)
                                </span>
                              </Text>
                              {extractedData.email &&
                                getConfidenceBadge(
                                  'email',
                                  extractedData.confidence,
                                )}
                            </div>
                            <Text
                              variant="sm"
                              color={
                                extractedData.email ? 'default' : 'subdued'
                              }
                            >
                              {extractedData.email || <em>Not provided</em>}
                            </Text>
                          </div>

                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '4px',
                              }}
                            >
                              <Text variant="sm" weight="500">
                                Address{' '}
                                <span
                                  style={{
                                    color: '#6b7280',
                                    fontWeight: '400',
                                  }}
                                >
                                  (optional)
                                </span>
                              </Text>
                              {extractedData.address &&
                                getConfidenceBadge(
                                  'address',
                                  extractedData.confidence,
                                )}
                            </div>
                            <Text
                              variant="sm"
                              color={
                                extractedData.address ? 'default' : 'subdued'
                              }
                            >
                              {extractedData.address || <em>Not provided</em>}
                            </Text>
                          </div>
                        </Stack>
                      </div>
                    </Stack>
                  </div>
                )}

                {/* Complete Intake Button */}
                {(extractedData.program ||
                  extractedData.firstName ||
                  extractedData.familyMembers ||
                  extractedData.entityName) && (
                  <div
                    style={{
                      marginTop: '24px',
                      paddingTop: '24px',
                      borderTop: '1px solid #e5e7eb',
                    }}
                  >
                    <Button
                      variant="primary"
                      onPress={handleCompleteIntake}
                      isDisabled={!canComplete}
                      style={{ width: '100%', backgroundColor: '#10b981' }}
                    >
                      Complete Intake & Enroll
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
      </Stack>
    </PageLayout>
  );
}
