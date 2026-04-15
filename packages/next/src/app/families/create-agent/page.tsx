'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stack,
  InlineStack,
  Heading,
  Text,
  Button,
  TextField,
} from '@bonterratech/stitch-extension';
import { useHouseholdStore } from '@/lib/stores/householdStore';
import { useParticipantStore } from '@/lib/stores/participantStore';
import {
  HouseholdMember,
  RELATIONSHIP_LABELS,
  RelationshipType,
} from '@/types/household';
import { HMIS_GENDER_CODES } from '@/types/poc';
import PageLayout from '../../components/PageLayout';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ExtractedFamilyData {
  members?: Array<{
    tempId: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    approximateAge?: number;
    dobDataQuality?: 1 | 2 | 8 | 9 | 99;
    gender?: 0 | 1 | 2 | 3 | 4 | 5 | 99;
    phoneNumber?: string;
    email?: string;
    relationshipToHoH?: RelationshipType;
    confidence?: Record<string, number>;
  }>;
  headOfHouseholdId?: string;
}

export default function CreateFamilyAgentPage() {
  const router = useRouter();
  const { createHousehold } = useHouseholdStore();
  const { createParticipant, participants } = useParticipantStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mode toggle
  const [creationMode, setCreationMode] = useState<'ai' | 'existing'>('ai');

  // AI Agent mode state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'll help you create a new family. You can tell me about the family in natural language, like 'I want to add the Smith family - John (father), Maria (mother), and their kids Sofia (8) and Diego (5).' What family would you like to add?",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedFamilyData>({});
  const [isTyping, setIsTyping] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [customFamilyName, setCustomFamilyName] = useState<string>('');
  const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);

  // Existing participants mode state
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >([]);
  const [headOfHouseholdId, setHeadOfHouseholdId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [familyName, setFamilyName] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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
        const response = await fetch('/api/families/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            existingParticipants: participants.map((p) => ({
              id: p.id,
              firstName: p.firstName,
              lastName: p.lastName,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let assistantMessage: Message = {
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
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (
                        lastMessage?.role === 'assistant' &&
                        lastMessage.id === assistantMessage.id
                      ) {
                        newMessages[newMessages.length - 1] = {
                          ...assistantMessage,
                        };
                      } else {
                        newMessages.push({ ...assistantMessage });
                      }
                      return newMessages;
                    });
                  } else if (data.type === 'extraction') {
                    setExtractedData(data.data);
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
    [messages, participants],
  );

  const updateMemberField = (tempId: string, field: string, value: any) => {
    setExtractedData((prev) => {
      if (!prev.members) return prev;

      return {
        ...prev,
        members: prev.members.map((member) =>
          member.tempId === tempId ? { ...member, [field]: value } : member,
        ),
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      handleSendMessage(input);
    }
  };

  const handleCreateFamily = () => {
    if (!extractedData.members || extractedData.members.length === 0) {
      alert('No family members to create. Please describe the family first.');
      return;
    }

    if (!extractedData.headOfHouseholdId) {
      alert('Please identify who is the head of household.');
      return;
    }

    try {
      // Create participants for each family member
      const createdMembers: HouseholdMember[] = [];
      let headOfHouseholdParticipantId = '';

      for (const member of extractedData.members) {
        if (!member.firstName || !member.lastName) {
          alert(`Please provide first and last name for all family members.`);
          return;
        }

        // Calculate DOB from age if needed
        let dob: Date;
        if (member.dateOfBirth) {
          dob = new Date(member.dateOfBirth);
        } else if (member.approximateAge) {
          const currentYear = new Date().getFullYear();
          dob = new Date(currentYear - member.approximateAge, 0, 1);
        } else {
          dob = new Date();
        }

        const participant = createParticipant({
          firstName: member.firstName,
          lastName: member.lastName,
          dateOfBirth: dob,
          approximateAge: member.approximateAge,
          dobDataQuality: member.dobDataQuality || (member.dateOfBirth ? 1 : 2),
          gender: member.gender || 99,
          phoneNumber: member.phoneNumber,
          email: member.email,
          customData: {},
        });

        const householdMember: HouseholdMember = {
          id: participant.id,
          firstName: participant.firstName,
          lastName: participant.lastName,
          dateOfBirth: participant.dateOfBirth,
          dobDataQuality: participant.dobDataQuality,
          gender: participant.gender,
          phoneNumber: participant.phoneNumber,
          email: participant.email,
          relationshipToHoH: member.relationshipToHoH || 'other',
          confidence: member.confidence || {},
        };

        createdMembers.push(householdMember);

        if (member.tempId === extractedData.headOfHouseholdId) {
          headOfHouseholdParticipantId = participant.id;
        }
      }

      // Create household
      const household = createHousehold(
        headOfHouseholdParticipantId,
        createdMembers,
      );

      const headMember = createdMembers.find(
        (m) => m.id === headOfHouseholdParticipantId,
      );
      alert(
        `Successfully created ${headMember?.firstName} ${headMember?.lastName} family with ${createdMembers.length} members!`,
      );
      router.push(`/families/${household.id}`);
    } catch (error) {
      console.error('Error creating family:', error);
      alert('Error creating family. Please try again.');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const headMember = extractedData.members?.find(
    (m) => m.tempId === extractedData.headOfHouseholdId,
  );
  const canCreate =
    extractedData.members &&
    extractedData.members.length > 0 &&
    extractedData.headOfHouseholdId &&
    extractedData.members.every((m) => m.firstName && m.lastName);

  const displayFamilyName =
    customFamilyName ||
    (headMember
      ? `${headMember.firstName} ${headMember.lastName} Family`
      : 'Family');

  const handleCreateFromExisting = () => {
    if (selectedParticipantIds.length === 0) {
      alert('Please select at least one participant');
      return;
    }
    if (!headOfHouseholdId) {
      alert('Please select a head of household');
      return;
    }

    const selectedMembers: HouseholdMember[] = selectedParticipantIds.map(
      (participantId) => {
        const participant = participants.find((p) => p.id === participantId)!;
        return {
          id: participant.id,
          firstName: participant.firstName,
          lastName: participant.lastName,
          dateOfBirth: participant.dateOfBirth,
          dobDataQuality: participant.dobDataQuality,
          gender: participant.gender,
          phoneNumber: participant.phoneNumber,
          email: participant.email,
          relationshipToHoH:
            participantId === headOfHouseholdId ? 'self' : 'other',
          confidence: {},
        };
      },
    );

    const household = createHousehold(headOfHouseholdId, selectedMembers);
    const headMember = selectedMembers.find((m) => m.id === headOfHouseholdId);
    alert(
      `Successfully created family with ${selectedMembers.length} members!`,
    );
    router.push(`/families/${household.id}`);
  };

  const filteredParticipants = participants.filter(
    (p) =>
      searchQuery === '' ||
      `${p.firstName} ${p.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <PageLayout pageTitle="Create Family">
      <Stack space="400">
        {/* Header */}
        <Stack space="300">
          <Link href="/families">
            <Text color="link">← Back to Families</Text>
          </Link>
          <Heading level={1}>Create Family</Heading>
          <Text>
            Create a new family using AI or select existing participants
          </Text>
        </Stack>

        {/* Mode Toggle */}
        <InlineStack gap="200">
          <Button
            variant={creationMode === 'ai' ? 'primary' : 'secondary'}
            onPress={() => setCreationMode('ai')}
          >
            Create with AI
          </Button>
          <Button
            variant={creationMode === 'existing' ? 'primary' : 'secondary'}
            onPress={() => setCreationMode('existing')}
          >
            Select Existing Participants
          </Button>
        </InlineStack>

        {/* AI Agent Mode */}
        {creationMode === 'ai' && (
          <>
            <Text color="subdued">
              Describe the family in natural language and the AI will help you
              create it
            </Text>
            {/* Main Content - Chat + Preview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
              }}
            >
              {/* Chat Interface */}
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
                {/* Messages */}
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
                        placeholder="Describe the family..."
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

              {/* Family Preview */}
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
                <Heading level={2}>Family Preview</Heading>

                {!extractedData.members ||
                extractedData.members.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '48px 0',
                    }}
                  >
                    <svg
                      style={{
                        width: '64px',
                        height: '64px',
                        color: '#d1d5db',
                        margin: '0 auto 16px',
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <Text variant="sm" color="subdued">
                      Chat with the agent to create a family
                    </Text>
                  </div>
                ) : (
                  <Stack space="400">
                    {headMember && (
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: '#f5f3ff',
                          border: '1px solid #ddd6fe',
                          borderRadius: '6px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px',
                          }}
                        >
                          {isEditingFamilyName ? (
                            <div style={{ flex: 1, marginRight: '8px' }}>
                              <TextField
                                value={
                                  customFamilyName ||
                                  `${headMember.firstName} ${headMember.lastName} Family`
                                }
                                onChange={setCustomFamilyName}
                                aria-label="Family name"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <Text weight="500" style={{ color: '#6d28d9' }}>
                              {displayFamilyName}
                            </Text>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onPress={() =>
                              setIsEditingFamilyName(!isEditingFamilyName)
                            }
                          >
                            {isEditingFamilyName ? 'Done' : 'Edit'}
                          </Button>
                        </div>
                        <Text variant="sm" style={{ color: '#7c3aed' }}>
                          {extractedData.members.length} member
                          {extractedData.members.length !== 1 ? 's' : ''}
                        </Text>
                      </div>
                    )}

                    <Stack space="300">
                      {extractedData.members.map((member) => {
                        const isEditing = editingMemberId === member.tempId;

                        return (
                          <div
                            key={member.tempId}
                            style={{
                              border:
                                member.tempId ===
                                extractedData.headOfHouseholdId
                                  ? '2px solid #c4b5fd'
                                  : '1px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '16px',
                              backgroundColor:
                                member.tempId ===
                                extractedData.headOfHouseholdId
                                  ? '#f5f3ff'
                                  : 'white',
                            }}
                          >
                            <Stack space="200">
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <InlineStack gap="200" verticalAlign="center">
                                  {member.tempId ===
                                    extractedData.headOfHouseholdId && (
                                    <span
                                      style={{
                                        padding: '2px 8px',
                                        backgroundColor: '#7c3aed',
                                        color: 'white',
                                        fontSize: '11px',
                                        fontWeight: '500',
                                        borderRadius: '4px',
                                      }}
                                    >
                                      Head of Household
                                    </span>
                                  )}
                                  {member.tempId !==
                                    extractedData.headOfHouseholdId &&
                                    member.relationshipToHoH && (
                                      <span
                                        style={{
                                          padding: '2px 8px',
                                          backgroundColor: '#e5e7eb',
                                          color: '#374151',
                                          fontSize: '11px',
                                          fontWeight: '500',
                                          borderRadius: '4px',
                                        }}
                                      >
                                        {
                                          RELATIONSHIP_LABELS[
                                            member.relationshipToHoH
                                          ]
                                        }
                                      </span>
                                    )}
                                </InlineStack>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onPress={() =>
                                    setEditingMemberId(
                                      isEditing ? null : member.tempId,
                                    )
                                  }
                                >
                                  {isEditing ? 'Done' : 'Edit'}
                                </Button>
                              </div>

                              {isEditing ? (
                                <Stack space="300">
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: '1fr 1fr',
                                      gap: '12px',
                                    }}
                                  >
                                    <TextField
                                      label="First Name"
                                      value={member.firstName || ''}
                                      onChange={(value) =>
                                        updateMemberField(
                                          member.tempId,
                                          'firstName',
                                          value,
                                        )
                                      }
                                    />
                                    <TextField
                                      label="Last Name"
                                      value={member.lastName || ''}
                                      onChange={(value) =>
                                        updateMemberField(
                                          member.tempId,
                                          'lastName',
                                          value,
                                        )
                                      }
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
                                        value={member.dateOfBirth || ''}
                                        onChange={(e) =>
                                          updateMemberField(
                                            member.tempId,
                                            'dateOfBirth',
                                            e.target.value,
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
                                        value={member.approximateAge || ''}
                                        onChange={(e) =>
                                          updateMemberField(
                                            member.tempId,
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
                                        member.gender !== undefined
                                          ? member.gender
                                          : 99
                                      }
                                      onChange={(e) =>
                                        updateMemberField(
                                          member.tempId,
                                          'gender',
                                          parseInt(e.target.value),
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
                                      <option value={0}>Female</option>
                                      <option value={1}>Male</option>
                                      <option value={2}>Transgender</option>
                                      <option value={3}>Non-Binary</option>
                                      <option value={4}>
                                        Culturally Specific Identity
                                      </option>
                                      <option value={5}>
                                        Different Identity
                                      </option>
                                      <option value={99}>
                                        Data Not Collected
                                      </option>
                                    </select>
                                  </div>

                                  {member.tempId !==
                                    extractedData.headOfHouseholdId && (
                                    <div>
                                      <label
                                        style={{
                                          display: 'block',
                                          fontSize: '14px',
                                          fontWeight: '500',
                                          marginBottom: '8px',
                                        }}
                                      >
                                        Relationship to Head of Household
                                      </label>
                                      <select
                                        value={
                                          member.relationshipToHoH || 'other'
                                        }
                                        onChange={(e) =>
                                          updateMemberField(
                                            member.tempId,
                                            'relationshipToHoH',
                                            e.target.value as RelationshipType,
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
                                        <option value="self">Self</option>
                                        <option value="spouse">
                                          Spouse/Partner
                                        </option>
                                        <option value="child">Child</option>
                                        <option value="parent">Parent</option>
                                        <option value="sibling">Sibling</option>
                                        <option value="grandchild">
                                          Grandchild
                                        </option>
                                        <option value="grandparent">
                                          Grandparent
                                        </option>
                                        <option value="other_relative">
                                          Other Relative
                                        </option>
                                        <option value="foster">
                                          Foster Child/Parent
                                        </option>
                                        <option value="ward">Ward</option>
                                        <option value="unrelated">
                                          Unrelated Household Member
                                        </option>
                                        <option value="other">Other</option>
                                      </select>
                                    </div>
                                  )}

                                  <TextField
                                    label="Phone Number"
                                    value={member.phoneNumber || ''}
                                    onChange={(value) =>
                                      updateMemberField(
                                        member.tempId,
                                        'phoneNumber',
                                        value,
                                      )
                                    }
                                  />

                                  <TextField
                                    label="Email"
                                    value={member.email || ''}
                                    onChange={(value) =>
                                      updateMemberField(
                                        member.tempId,
                                        'email',
                                        value,
                                      )
                                    }
                                  />
                                </Stack>
                              ) : (
                                <>
                                  <Heading level={3}>
                                    {member.firstName || '?'}{' '}
                                    {member.lastName || '?'}
                                  </Heading>

                                  <Stack space="100">
                                    {(member.dateOfBirth ||
                                      member.approximateAge) && (
                                      <Text variant="sm" color="subdued">
                                        {member.approximateAge
                                          ? `${member.approximateAge} years old (approx)`
                                          : member.dateOfBirth
                                            ? `DOB: ${new Date(member.dateOfBirth).toLocaleDateString()}`
                                            : 'Age unknown'}
                                      </Text>
                                    )}
                                    {member.gender !== undefined && (
                                      <Text variant="sm" color="subdued">
                                        Gender:{' '}
                                        {HMIS_GENDER_CODES[member.gender]}
                                      </Text>
                                    )}
                                    {member.phoneNumber && (
                                      <Text variant="sm" color="subdued">
                                        Phone: {member.phoneNumber}
                                      </Text>
                                    )}
                                    {member.email && (
                                      <Text variant="sm" color="subdued">
                                        Email: {member.email}
                                      </Text>
                                    )}
                                  </Stack>
                                </>
                              )}
                            </Stack>
                          </div>
                        );
                      })}
                    </Stack>

                    <Button
                      variant="primary"
                      onPress={handleCreateFamily}
                      isDisabled={!canCreate}
                      style={{ width: '100%', backgroundColor: '#10b981' }}
                    >
                      Create Family
                    </Button>
                  </Stack>
                )}
              </div>
            </div>
          </>
        )}

        {/* Select Existing Participants Mode */}
        {creationMode === 'existing' && (
          <Stack space="400">
            <Card>
              <Stack space="400">
                <Heading level={2}>Select Participants</Heading>
                <Text color="subdued">
                  Choose existing participants to form a family. You must select
                  at least one participant and designate a head of household.
                </Text>

                {/* Search */}
                <TextField
                  label="Search Participants"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by name or email..."
                />

                {/* Participants List */}
                <Stack space="300">
                  {filteredParticipants.length === 0 ? (
                    <Text color="subdued">No participants found</Text>
                  ) : (
                    filteredParticipants.map((participant) => {
                      const isSelected = selectedParticipantIds.includes(
                        participant.id,
                      );
                      const isHead = headOfHouseholdId === participant.id;

                      return (
                        <div
                          key={participant.id}
                          style={{
                            padding: '16px',
                            border: isSelected
                              ? '2px solid #7c3aed'
                              : '1px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: isSelected ? '#f5f3ff' : 'white',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedParticipantIds((prev) =>
                                prev.filter((id) => id !== participant.id),
                              );
                              if (headOfHouseholdId === participant.id) {
                                setHeadOfHouseholdId('');
                              }
                            } else {
                              setSelectedParticipantIds((prev) => [
                                ...prev,
                                participant.id,
                              ]);
                            }
                          }}
                        >
                          <Stack space="200">
                            <InlineStack gap="300" verticalAlign="center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ width: '20px', height: '20px' }}
                              />
                              <Stack space="100">
                                <Text weight="500">
                                  {participant.firstName} {participant.lastName}
                                </Text>
                                {participant.email && (
                                  <Text variant="sm" color="subdued">
                                    {participant.email}
                                  </Text>
                                )}
                                <Text variant="sm" color="subdued">
                                  Gender:{' '}
                                  {HMIS_GENDER_CODES[participant.gender]}
                                </Text>
                              </Stack>
                              {isHead && (
                                <div style={{ marginLeft: 'auto' }}>
                                  <span
                                    style={{
                                      padding: '4px 12px',
                                      backgroundColor: '#7c3aed',
                                      color: 'white',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    Head of Household
                                  </span>
                                </div>
                              )}
                            </InlineStack>

                            {isSelected && !isHead && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setHeadOfHouseholdId(participant.id);
                                }}
                              >
                                Set as Head of Household
                              </Button>
                            )}
                          </Stack>
                        </div>
                      );
                    })
                  )}
                </Stack>

                {/* Selected Summary */}
                {selectedParticipantIds.length > 0 && (
                  <Card style={{ backgroundColor: '#f5f3ff' }}>
                    <Stack space="200">
                      <Text weight="500">
                        {selectedParticipantIds.length} participant
                        {selectedParticipantIds.length !== 1 ? 's' : ''}{' '}
                        selected
                      </Text>
                      {headOfHouseholdId && (
                        <Text variant="sm" color="subdued">
                          Head of Household:{' '}
                          {
                            participants.find((p) => p.id === headOfHouseholdId)
                              ?.firstName
                          }{' '}
                          {
                            participants.find((p) => p.id === headOfHouseholdId)
                              ?.lastName
                          }
                        </Text>
                      )}
                      {!headOfHouseholdId &&
                        selectedParticipantIds.length > 0 && (
                          <Text variant="sm" style={{ color: '#dc2626' }}>
                            Please designate a head of household
                          </Text>
                        )}
                    </Stack>
                  </Card>
                )}

                {/* Create Button */}
                <Button
                  variant="primary"
                  onPress={handleCreateFromExisting}
                  isDisabled={
                    selectedParticipantIds.length === 0 || !headOfHouseholdId
                  }
                  style={{ width: '100%', backgroundColor: '#10b981' }}
                >
                  Create Family ({selectedParticipantIds.length} member
                  {selectedParticipantIds.length !== 1 ? 's' : ''})
                </Button>
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>
    </PageLayout>
  );
}
