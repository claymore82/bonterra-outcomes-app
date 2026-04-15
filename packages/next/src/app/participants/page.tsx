'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import PageLayout from '../components/PageLayout';
import SimpleBadge from '../components/SimpleBadge';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useUserStore } from '@/lib/stores/userStore';

export default function ParticipantsPage() {
  const router = useRouter();
  const { participants } = useParticipantStore();
  const { enrollments, getActiveEnrollments } = useEnrollmentStore();
  const { programs } = useProgramStore();
  const { currentProgramId } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get enrollment status for each participant
  const getParticipantStatus = (participantId: string) => {
    const activeEnrollments = getActiveEnrollments();
    const participantEnrollments = activeEnrollments.filter(e => e.participantId === participantId);

    if (participantEnrollments.length === 0) return 'inactive';
    return 'active';
  };

  const getParticipantPrograms = (participantId: string) => {
    const activeEnrollments = getActiveEnrollments();
    const participantEnrollments = activeEnrollments.filter(e => e.participantId === participantId);
    return participantEnrollments
      .map(e => programs.find(p => p.id === e.programId)?.name || 'Unknown')
      .join(', ');
  };

  // Filter and search participants
  const filteredParticipants = useMemo(() => {
    const activeEnrollments = getActiveEnrollments();

    return participants.filter(participant => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        `${participant.firstName} ${participant.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const participantEnrollments = activeEnrollments.filter(e => e.participantId === participant.id);
      const status = participantEnrollments.length > 0 ? 'active' : 'inactive';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      // Program filter (from master selector)
      let matchesProgram = true;
      if (currentProgramId && currentProgramId !== '') {
        matchesProgram = participantEnrollments.some(e => e.programId === currentProgramId);
      }

      return matchesSearch && matchesStatus && matchesProgram;
    });
  }, [participants, searchQuery, statusFilter, currentProgramId, enrollments, programs]);

  const activeCount = participants.filter(p => getParticipantStatus(p.id) === 'active').length;
  const inactiveCount = participants.filter(p => getParticipantStatus(p.id) === 'inactive').length;

  return (
    <PageLayout pageTitle="Individuals">
      <Stack space="600">
        {/* Header */}
        <Stack space="200">
          <Heading level={1}>Individuals</Heading>
          <Text color="subdued">
            Search and manage all individuals in the system
          </Text>
        </Stack>

        {/* Action Button Row */}
        <InlineStack gap="400" distribute="end">
          <Button
            variant="secondary"
            onPress={() => router.push('/participants/create')}
          >
            <Icon name="user" />
            Create Individual
          </Button>
          <Button
            variant="primary"
            onPress={() => router.push('/intake')}
          >
            <Icon name="sparkles" />
            Intake Agent
          </Button>
        </InlineStack>

        {/* Stats Cards */}
        <InlineStack gap="400">
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Total Individuals</Text>
              <Heading level={2}>{participants.length}</Heading>
            </Stack>
          </Card>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Active</Text>
              <Heading level={2}>{activeCount}</Heading>
            </Stack>
          </Card>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Inactive</Text>
              <Heading level={2}>{inactiveCount}</Heading>
            </Stack>
          </Card>
        </InlineStack>

        {/* Search and Filters */}
        <Card>
          <Stack space="400">
            <Heading level={3}>Search & Filter</Heading>
            <InlineStack gap="400">
              <div style={{ flex: 2 }}>
                <TextField
                  label="Search by name or email"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Enter name or email..."
                />
              </div>
              <div style={{ flex: 1 }}>
                <Select
                  label="Status"
                  selectedKey={statusFilter}
                  onSelectionChange={(key) => setStatusFilter(key as string)}
                >
                  <SelectItem id="all">All Status</SelectItem>
                  <SelectItem id="active">Active</SelectItem>
                  <SelectItem id="inactive">Inactive</SelectItem>
                </Select>
              </div>
            </InlineStack>
          </Stack>
        </Card>

        {/* Individuals Table */}
        <Card>
          <Stack space="400">
            <InlineStack gap="400" verticalAlign="center" distribute="space-between">
              <Heading level={3}>
                {filteredParticipants.length} Individual{filteredParticipants.length !== 1 ? 's' : ''}
              </Heading>
              {searchQuery || statusFilter !== 'all' ? (
                <Button
                  variant="secondary"
                  onPress={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : null}
            </InlineStack>

            {filteredParticipants.length === 0 ? (
              <Stack space="300" style={{ padding: '40px', textAlign: 'center' }}>
                <Icon name="users" size="large" />
                <Heading level={3}>No individuals found</Heading>
                <Text color="subdued">
                  {searchQuery || statusFilter !== 'all' || currentProgramId
                    ? 'Try adjusting your filters or search query'
                    : 'Get started by enrolling your first individual'}
                </Text>
              </Stack>
            ) : (
              <Stack space="300">
                  {filteredParticipants.map((participant) => {
                    const status = getParticipantStatus(participant.id);
                    const programsText = getParticipantPrograms(participant.id) || 'None';

                    return (
                      <Card key={participant.id}>
                        <InlineStack gap="400" verticalAlign="center" distribute="space-between">
                          <Stack space="200" style={{ flex: 1 }}>
                            <InlineStack gap="300" verticalAlign="center">
                              <div
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '18px',
                                  fontWeight: '600',
                                  color: '#ffffff',
                                }}
                              >
                                {participant.firstName[0]}{participant.lastName[0]}
                              </div>
                              <Stack space="100">
                                <InlineStack gap="200" verticalAlign="center">
                                  <Text weight="500">
                                    {participant.firstName} {participant.lastName}
                                  </Text>
                                  <SimpleBadge tone={status === 'active' ? 'positive' : 'neutral'}>
                                    {status === 'active' ? 'Active' : 'Inactive'}
                                  </SimpleBadge>
                                </InlineStack>
                                <InlineStack gap="300">
                                  {participant.email && (
                                    <Text variant="sm" color="subdued">
                                      <Icon name="envelope" size="small" /> {participant.email}
                                    </Text>
                                  )}
                                  {participant.phone && (
                                    <Text variant="sm" color="subdued">
                                      <Icon name="phone" size="small" /> {participant.phone}
                                    </Text>
                                  )}
                                </InlineStack>
                                {programsText && programsText !== 'None' && (
                                  <Text variant="sm" color="subdued">
                                    <Icon name="tag" size="small" /> {programsText}
                                  </Text>
                                )}
                              </Stack>
                            </InlineStack>
                          </Stack>
                          <InlineStack gap="200">
                            <Button
                              variant="secondary"
                              size="sm"
                              onPress={() => router.push(`/participants/${participant.id}/add-case-note`)}
                            >
                              <Icon name="file-text" />
                              Note
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onPress={() => router.push(`/participants/${participant.id}/record-service`)}
                            >
                              <Icon name="clipboard-list" />
                              Service
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onPress={() => router.push(`/enroll?participantId=${participant.id}`)}
                            >
                              <Icon name="user-plus" />
                              Enroll
                            </Button>
                            <Button
                              variant="primary"
                              onPress={() => router.push(`/participants/${participant.id}`)}
                            >
                              View Profile
                            </Button>
                          </InlineStack>
                        </InlineStack>
                      </Card>
                    );
                  })}
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>
    </PageLayout>
  );
}
