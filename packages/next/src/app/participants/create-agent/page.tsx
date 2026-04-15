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
  Select,
  SelectItem,
} from '@bonterratech/stitch-extension';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useCustomFieldStore } from '@/lib/stores/customFieldStore';
import { useUserStore } from '@/lib/stores/userStore';
import { HMIS_GENDER_CODES } from '@/types/poc';
import PageLayout from '../../components/PageLayout';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ExtractedParticipantData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  approximateAge?: number;
  gender?: 0 | 1 | 2 | 3 | 4 | 5 | 99;
  email?: string;
  phoneNumber?: string;
  address?: string;
  customFields?: Record<string, any>;
  confidence?: Record<string, number>;
}

export default function CreateParticipantAgentPage() {
  const router = useRouter();
  const { createParticipant } = useParticipantStore();
  const { programs } = useProgramStore();
  const { customFields } = useCustomFieldStore();
  const { currentProgramId, currentSiteId } = useUserStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Program selection
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [showChat, setShowChat] = useState(false);

  // AI Agent mode state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedParticipantData>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Filter programs based on master context
  const availablePrograms = programs.filter((p) => {
    // Must be active
    if (p.status !== 'active') return false;

    // If master program selector is set, only show that program
    if (currentProgramId && currentProgramId !== '') {
      return p.id === currentProgramId;
    }

    // If master site selector is set, only show programs for that site
    if (currentSiteId && currentSiteId !== '') {
      return p.siteIds.length === 0 || p.siteIds.includes(currentSiteId);
    }

    return true;
  });

  // Get custom fields for selected program
  const programCustomFields = selectedProgramId
    ? customFields.filter(
        (field) =>
          field.programSpecific &&
          field.programIds?.includes(selectedProgramId) &&
          (field.appliesTo === 'individual' || field.appliesTo === 'all') &&
          field.visibleInIntake
      )
    : [];

  const handleProgramSelect = (programId: string) => {
    setSelectedProgramId(programId);
    const program = programs.find((p) => p.id === programId);

    // Initialize chat with program-specific greeting
    const fieldNames = programCustomFields.map((f) => f.label).join(', ');
    const greeting = fieldNames
      ? `Hello! I'll help you create a new participant for ${program?.name}. I'll ask about basic information (name, date of birth, contact details) and program-specific questions: ${fieldNames}. You can describe the participant in natural language. What would you like to tell me?`
      : `Hello! I'll help you create a new participant for ${program?.name}. Please describe the participant (name, date of birth, gender, contact information, etc.)`;

    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      },
    ]);
    setShowChat(true);
  };

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
        const response = await fetch('/api/participants/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            programId: selectedProgramId,
            customFields: programCustomFields.map((f) => ({
              name: f.name,
              label: f.label,
              fieldType: f.fieldType,
              options: f.options,
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
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage?.role === 'assistant' && lastMessage.id === assistantMessage.id) {
                        newMessages[newMessages.length - 1] = { ...assistantMessage };
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
          content: 'Sorry, there was an error communicating with the agent. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    [messages, selectedProgramId, programCustomFields]
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

  const handleCreateParticipant = () => {
    if (!extractedData.firstName || !extractedData.lastName) {
      alert('Please provide first and last name');
      return;
    }

    try {
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

      alert(`Successfully created participant ${participant.firstName} ${participant.lastName}`);
      router.push(`/participants/${participant.id}`);
    } catch (error) {
      console.error('Error creating participant:', error);
      alert('Error creating participant. Please try again.');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Calculate required fields progress
  const requiredFields = ['firstName', 'lastName', 'dateOfBirth_or_age'];

  // Add required custom fields from program
  const requiredCustomFields = programCustomFields.filter((f) => f.required);
  const totalRequired = requiredFields.length + requiredCustomFields.length;

  let completedRequired = 0;
  if (extractedData.firstName) completedRequired++;
  if (extractedData.lastName) completedRequired++;
  if (extractedData.dateOfBirth || extractedData.approximateAge) completedRequired++;

  // Count completed custom fields
  requiredCustomFields.forEach((field) => {
    if (extractedData.customFields?.[field.name]) completedRequired++;
  });

  const canCreate = extractedData.firstName && extractedData.lastName &&
    (extractedData.dateOfBirth || extractedData.approximateAge);

  // Helper function to get confidence badge
  const getConfidenceBadge = (field: string, confidence?: Record<string, number>) => {
    if (!confidence || confidence[field] === undefined) return null;

    const level = confidence[field];
    const color = level >= 0.8 ? '#10b981' : level >= 0.5 ? '#f59e0b' : '#ef4444';
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
    <PageLayout pageTitle="Create Participant with AI">
      <Stack space="400">
        {/* Header */}
        <Stack space="300">
          <Link href="/participants">
            <Text color="link">← Back to Participants</Text>
          </Link>
          <Heading level={1}>Create Participant with AI Agent</Heading>
          <Text>Select a program, then describe the participant in natural language</Text>
        </Stack>

        {/* Program Selection */}
        {!showChat && (
          <Stack space="400">
            <Heading level={2}>Select Program</Heading>
            <Text color="subdued">
              Choose which program this participant will be enrolled in. The AI will ask questions based on that program's demographics.
            </Text>
            <Stack space="300">
              {availablePrograms.map((program) => (
                <button
                  key={program.id}
                  onClick={() => handleProgramSelect(program.id)}
                  style={{
                    padding: '20px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
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
                  <Stack space="100">
                    <Text weight="500">{program.name}</Text>
                    {program.description && (
                      <Text variant="sm" color="subdued">
                        {program.description}
                      </Text>
                    )}
                  </Stack>
                </button>
              ))}
            </Stack>
          </Stack>
        )}

        {/* AI Chat Interface */}
        {showChat && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
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
                      justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
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
                      <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{message.content}</div>
                      <div
                        style={{
                          fontSize: '11px',
                          marginTop: '4px',
                          color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : '#6b7280',
                        }}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
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
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <TextField
                      value={input}
                      onChange={setInput}
                      placeholder="Describe the participant..."
                      isDisabled={isTyping}
                      aria-label="Message input"
                    />
                  </div>
                  <Button type="submit" variant="primary" isDisabled={!input.trim() || isTyping} onPress={() => {}}>
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
                {(extractedData.firstName || extractedData.lastName) && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text variant="sm" weight="500">Progress</Text>
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

              {!extractedData.firstName && !extractedData.lastName ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 0',
                  }}
                >
                  <svg
                    style={{ width: '64px', height: '64px', color: '#d1d5db', margin: '0 auto 16px' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <Text variant="sm" color="subdued">
                    Chat with the agent to create a participant
                  </Text>
                </div>
              ) : (
                <Stack space="400">
                  {/* Name Section */}
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#f5f3ff',
                      border: '1px solid #ddd6fe',
                      borderRadius: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text weight="500" style={{ color: '#6d28d9' }}>
                        {extractedData.firstName} {extractedData.lastName}
                      </Text>
                      <Button variant="secondary" size="sm" onPress={() => setIsEditing(!isEditing)}>
                        {isEditing ? 'Done' : 'Edit'}
                      </Button>
                    </div>
                  </div>

                  {isEditing ? (
                    <Stack space="300">
                      {/* Basic Info Fields */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <TextField
                          label="First Name"
                          value={extractedData.firstName || ''}
                          onChange={(value) => updateField('firstName', value)}
                        />
                        <TextField
                          label="Last Name"
                          value={extractedData.lastName || ''}
                          onChange={(value) => updateField('lastName', value)}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={extractedData.dateOfBirth || ''}
                            onChange={(e) => updateField('dateOfBirth', e.target.value)}
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
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                            Approximate Age
                          </label>
                          <input
                            type="number"
                            value={extractedData.approximateAge || ''}
                            onChange={(e) =>
                              updateField('approximateAge', e.target.value ? parseInt(e.target.value) : undefined)
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
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                          Gender
                        </label>
                        <select
                          value={extractedData.gender !== undefined ? extractedData.gender : 99}
                          onChange={(e) => updateField('gender', parseInt(e.target.value))}
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
                          <option value={4}>Culturally Specific Identity</option>
                          <option value={5}>Different Identity</option>
                          <option value={99}>Data Not Collected</option>
                        </select>
                      </div>

                      <TextField
                        label="Email"
                        value={extractedData.email || ''}
                        onChange={(value) => updateField('email', value)}
                      />

                      <TextField
                        label="Phone Number"
                        value={extractedData.phoneNumber || ''}
                        onChange={(value) => updateField('phoneNumber', value)}
                      />

                      <TextField
                        label="Address"
                        value={extractedData.address || ''}
                        onChange={(value) => updateField('address', value)}
                      />

                      {/* Custom Fields */}
                      {programCustomFields.length > 0 && (
                        <>
                          <div
                            style={{
                              padding: '8px 0',
                              borderTop: '1px solid #e5e7eb',
                              marginTop: '8px',
                            }}
                          >
                            <Text weight="500">Program Demographics</Text>
                          </div>
                          {programCustomFields.map((field) => {
                            const value = extractedData.customFields?.[field.name];

                            if (field.fieldType === 'dropdown') {
                              return (
                                <div key={field.name}>
                                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                                    {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                                  </label>
                                  <select
                                    value={value || ''}
                                    onChange={(e) => updateCustomField(field.name, e.target.value)}
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
                                key={field.name}
                                label={field.label + (field.required ? ' *' : '')}
                                value={value || ''}
                                onChange={(val) => updateCustomField(field.name, val)}
                              />
                            );
                          })}
                        </>
                      )}
                    </Stack>
                  ) : (
                    <div>
                      {/* Edit Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <Button variant="secondary" size="sm" onPress={() => setIsEditing(true)}>
                          Edit
                        </Button>
                      </div>

                      <Stack space="500">
                        {/* Program Details */}
                        <div>
                          <div
                            style={{
                              padding: '12px 0',
                              borderBottom: '2px solid #e5e7eb',
                              marginBottom: '16px',
                            }}
                          >
                            <Text weight="600" style={{ fontSize: '15px' }}>
                              Program Details
                            </Text>
                          </div>
                          <Stack space="300">
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <Text variant="sm" weight="500">
                                  Program
                                </Text>
                                {getConfidenceBadge('program', extractedData.confidence)}
                              </div>
                              <Text variant="sm" color="subdued">
                                {programs.find((p) => p.id === selectedProgramId)?.name || 'Not selected'}
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
                            {/* First Name */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <Text variant="sm" weight="500">
                                  First Name
                                </Text>
                                {getConfidenceBadge('firstName', extractedData.confidence)}
                              </div>
                              <Text variant="sm" color={extractedData.firstName ? 'default' : 'subdued'}>
                                {extractedData.firstName || <em>Not provided</em>}
                              </Text>
                            </div>

                            {/* Last Name */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <Text variant="sm" weight="500">
                                  Last Name
                                </Text>
                                {getConfidenceBadge('lastName', extractedData.confidence)}
                              </div>
                              <Text variant="sm" color={extractedData.lastName ? 'default' : 'subdued'}>
                                {extractedData.lastName || <em>Not provided</em>}
                              </Text>
                            </div>

                            {/* Date of Birth */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <Text variant="sm" weight="500">
                                  Date of Birth
                                </Text>
                                {getConfidenceBadge('dateOfBirth', extractedData.confidence)}
                              </div>
                              {extractedData.dateOfBirth ? (
                                <Text variant="sm">
                                  {new Date(extractedData.dateOfBirth).toLocaleDateString()}
                                </Text>
                              ) : extractedData.approximateAge ? (
                                <div>
                                  <Text variant="sm">~{extractedData.approximateAge} years old</Text>
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

                            {/* Gender */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <Text variant="sm" weight="500">
                                  Gender
                                </Text>
                                {getConfidenceBadge('gender', extractedData.confidence)}
                              </div>
                              <Text variant="sm" color={extractedData.gender !== undefined && extractedData.gender !== 99 ? 'default' : 'subdued'}>
                                {extractedData.gender !== undefined
                                  ? HMIS_GENDER_CODES[extractedData.gender]
                                  : <em>Not provided</em>}
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
                                const value = extractedData.customFields?.[field.name];
                                return (
                                  <div key={field.name}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                      <Text variant="sm" weight="500">
                                        {field.label}
                                        {!field.required && (
                                          <span style={{ color: '#6b7280', fontWeight: '400' }}> (optional)</span>
                                        )}
                                      </Text>
                                      {value && getConfidenceBadge(field.name, extractedData.confidence)}
                                    </div>
                                    <Text variant="sm" color={value ? 'default' : 'subdued'}>
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
                            {/* Phone Number */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <Text variant="sm" weight="500">
                                  Phone Number <span style={{ color: '#6b7280', fontWeight: '400' }}>(optional)</span>
                                </Text>
                                {extractedData.phoneNumber && getConfidenceBadge('phoneNumber', extractedData.confidence)}
                              </div>
                              <Text variant="sm" color={extractedData.phoneNumber ? 'default' : 'subdued'}>
                                {extractedData.phoneNumber || <em>Not provided</em>}
                              </Text>
                            </div>

                            {/* Email */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <Text variant="sm" weight="500">
                                  Email <span style={{ color: '#6b7280', fontWeight: '400' }}>(optional)</span>
                                </Text>
                                {extractedData.email && getConfidenceBadge('email', extractedData.confidence)}
                              </div>
                              <Text variant="sm" color={extractedData.email ? 'default' : 'subdued'}>
                                {extractedData.email || <em>Not provided</em>}
                              </Text>
                            </div>

                            {/* Address */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <Text variant="sm" weight="500">
                                  Address <span style={{ color: '#6b7280', fontWeight: '400' }}>(optional)</span>
                                </Text>
                                {extractedData.address && getConfidenceBadge('address', extractedData.confidence)}
                              </div>
                              <Text variant="sm" color={extractedData.address ? 'default' : 'subdued'}>
                                {extractedData.address || <em>Not provided</em>}
                              </Text>
                            </div>
                          </Stack>
                        </div>
                      </Stack>
                    </div>
                  )}

                  {/* Create Button - Always shown when data exists */}
                  {(extractedData.firstName || extractedData.lastName) && (
                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                      <Button
                        variant="primary"
                        onPress={handleCreateParticipant}
                        isDisabled={!canCreate}
                        style={{ width: '100%', backgroundColor: '#10b981' }}
                      >
                        Create Participant
                      </Button>
                    </div>
                  )}
                </Stack>
              )}
            </div>
          </div>
        )}
      </Stack>
    </PageLayout>
  );
}
