'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stack,
  Heading,
  Text,
  Button,
  TextField,
  Select,
  SelectItem,
  Checkbox,
} from '@bonterratech/stitch-extension';
import { useSiteStore } from '@/lib/stores/siteStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { Site } from '@/types/poc';
import PageLayout from '../../../components/PageLayout';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ExtractedSiteData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  capacity?: number;
  programIds?: string[];
  programNames?: string[];
  status?: 'active' | 'inactive';
  hoursOfOperation?: string;
  accessibilityFeatures?: string[];
  contactPerson?: string;
  confidence?: Record<string, number>;
}

const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
];

export default function CreateSiteAgentPage() {
  const router = useRouter();
  const { addSite } = useSiteStore();
  const { programs } = useProgramStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'll help you create a new site. You can tell me about the site in natural language, like 'Create a new emergency shelter at 123 Main St, Seattle, WA 98101 with capacity for 50 people.' What site would you like to add?",
      timestamp: new Date(),
    },
  ]);

  const [extractedData, setExtractedData] = useState<ExtractedSiteData>({});
  const [isTyping, setIsTyping] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Site>>({
    name: '',
    address: '',
    city: '',
    state: 'WA',
    zipCode: '',
    phone: '',
    email: '',
    capacity: undefined,
    programIds: [],
    status: 'active',
    hoursOfOperation: '',
    accessibilityFeatures: [],
    contactPerson: '',
  });

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

      try {
        const response = await fetch('/api/sites/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            availablePrograms: programs.map((p) => ({
              id: p.id,
              name: p.name,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };

        if (reader) {
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
                    setExtractedData((prev) => ({
                      ...prev,
                      ...data.data,
                    }));

                    if (data.data.name && data.data.address) {
                      setShowForm(true);

                      let programIds: string[] = [];
                      if (
                        data.data.programNames &&
                        data.data.programNames.length > 0
                      ) {
                        programIds = data.data.programNames
                          .map((name: string) => {
                            const program = programs.find(
                              (p) =>
                                p.name
                                  .toLowerCase()
                                  .includes(name.toLowerCase()) ||
                                name
                                  .toLowerCase()
                                  .includes(p.name.toLowerCase()),
                            );
                            return program?.id;
                          })
                          .filter(
                            (id: string | undefined): id is string =>
                              id !== undefined,
                          );
                      }

                      setFormData({
                        name: data.data.name || '',
                        address: data.data.address || '',
                        city: data.data.city || '',
                        state: data.data.state || 'WA',
                        zipCode: data.data.zipCode || '',
                        phone: data.data.phone || '',
                        email: data.data.email || '',
                        capacity: data.data.capacity,
                        programIds: programIds,
                        status: data.data.status || 'active',
                        hoursOfOperation: data.data.hoursOfOperation || '',
                        accessibilityFeatures:
                          data.data.accessibilityFeatures || [],
                        contactPerson: data.data.contactPerson || '',
                      });
                    }
                  } else if (data.type === 'done') {
                    setIsTyping(false);
                  } else if (data.type === 'error') {
                    console.error('Stream error:', data.error);
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
          content: 'Sorry, there was an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    [messages, programs],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.zipCode
    ) {
      alert('Please fill in all required fields');
      return;
    }

    addSite({
      name: formData.name,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      phone: formData.phone,
      email: formData.email,
      capacity: formData.capacity,
      programIds: formData.programIds || [],
      status: formData.status as 'active' | 'inactive',
      hoursOfOperation: formData.hoursOfOperation,
      accessibilityFeatures: formData.accessibilityFeatures || [],
      contactPerson: formData.contactPerson,
    });

    router.push('/admin/sites');
  };

  const toggleProgram = (programId: string) => {
    setFormData((prev) => {
      const currentIds = prev.programIds || [];
      const newIds = currentIds.includes(programId)
        ? currentIds.filter((id) => id !== programId)
        : [...currentIds, programId];
      return { ...prev, programIds: newIds };
    });
  };

  return (
    <PageLayout pageTitle="Create Site with AI Agent">
      <Stack space="400">
        {/* Header */}
        <Stack space="300">
          <Link href="/admin/sites">
            <Text color="link">← Back to Sites</Text>
          </Link>
          <Heading level={1}>Create Site with AI Agent</Heading>
          <Text>
            Describe the site in natural language and the AI will extract the
            details
          </Text>
        </Stack>

        {/* Main Content - Chat + Form */}
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
            {/* Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <Heading level={2}>Conversation</Heading>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
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
                      padding: '12px',
                      backgroundColor:
                        message.role === 'user'
                          ? '#7c3aed'
                          : message.role === 'system'
                            ? '#fef3c7'
                            : '#f9fafb',
                      color: message.role === 'user' ? 'white' : '#111827',
                      border:
                        message.role === 'system'
                          ? '1px solid #fcd34d'
                          : 'none',
                    }}
                  >
                    <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {message.content}
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
                      padding: '12px',
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
            </div>

            {/* Input */}
            <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem(
                    'message',
                  ) as HTMLInputElement;
                  if (input.value.trim()) {
                    handleSendMessage(input.value);
                    input.value = '';
                  }
                }}
                style={{ display: 'flex', gap: '8px' }}
              >
                <input
                  type="text"
                  name="message"
                  placeholder="Describe the site..."
                  disabled={isTyping}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                <Button
                  type="submit"
                  variant="primary"
                  isDisabled={isTyping}
                  onPress={() => {}}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>

          {/* Form Panel */}
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
            <Heading level={2}>Site Details</Heading>

            {!showForm ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <Text>
                  Start describing the site in the chat, and extracted details
                  will appear here.
                </Text>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack space="400">
                  <TextField
                    label="Site Name"
                    value={formData.name || ''}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, name: val }))
                    }
                    isRequired
                  />

                  <TextField
                    label="Address"
                    value={formData.address || ''}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, address: val }))
                    }
                    isRequired
                  />

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                    }}
                  >
                    <TextField
                      label="City"
                      value={formData.city || ''}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, city: val }))
                      }
                      isRequired
                    />
                    <TextField
                      label="ZIP Code"
                      value={formData.zipCode || ''}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, zipCode: val }))
                      }
                      isRequired
                    />
                  </div>

                  <Select
                    label="State"
                    selectedKey={formData.state}
                    onSelectionChange={(key) =>
                      setFormData((prev) => ({ ...prev, state: key as string }))
                    }
                  >
                    {US_STATES.map((state) => (
                      <SelectItem key={state} id={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </Select>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                    }}
                  >
                    <TextField
                      label="Phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, phone: val }))
                      }
                    />
                    <TextField
                      label="Capacity"
                      type="number"
                      value={formData.capacity?.toString() || ''}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          capacity: val ? parseInt(val) : undefined,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Text weight="600" style={{ marginBottom: '8px' }}>
                      Programs
                    </Text>
                    <div
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '12px',
                        maxHeight: '192px',
                        overflowY: 'auto',
                      }}
                    >
                      <Stack space="200">
                        {programs.map((program) => (
                          <Checkbox
                            key={program.id}
                            isSelected={(formData.programIds || []).includes(
                              program.id,
                            )}
                            onChange={() => toggleProgram(program.id)}
                          >
                            {program.name}
                          </Checkbox>
                        ))}
                      </Stack>
                    </div>
                  </div>

                  <TextField
                    label="Hours of Operation"
                    value={formData.hoursOfOperation || ''}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        hoursOfOperation: val,
                      }))
                    }
                  />

                  <TextField
                    label="Contact Person"
                    value={formData.contactPerson || ''}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, contactPerson: val }))
                    }
                  />

                  <Select
                    label="Status"
                    selectedKey={formData.status}
                    onSelectionChange={(key) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: key as 'active' | 'inactive',
                      }))
                    }
                  >
                    <SelectItem key="active" id="active">
                      Active
                    </SelectItem>
                    <SelectItem key="inactive" id="inactive">
                      Inactive
                    </SelectItem>
                  </Select>

                  <Button
                    type="submit"
                    variant="primary"
                    style={{ width: '100%' }}
                  >
                    Create Site
                  </Button>
                </Stack>
              </form>
            )}
          </div>
        </div>
      </Stack>
    </PageLayout>
  );
}
