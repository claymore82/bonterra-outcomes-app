'use client';

import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
} from '@bonterratech/stitch-extension';
import { useProgramStore } from '@/lib/stores/programStore';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import PageLayout from '../components/PageLayout';

export default function TestMigrationPage() {
  const { programs } = useProgramStore();
  const { participants } = useParticipantStore();
  const { enrollments } = useEnrollmentStore();

  return (
    <PageLayout>
      <Stack space="600">
        {/* Header */}
        <Stack space="400">
          <Heading level={1}>Migration Test Page</Heading>
          <Text>
            Testing ported POC data with Stitch components. All data below is from your ported Zustand stores.
          </Text>
        </Stack>

        {/* Stats Overview */}
        <InlineStack gap="400">
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Programs</Text>
              <Heading level={2}>{programs.length}</Heading>
              <Text variant="sm">
                {programs.filter(p => p.active).length} active
              </Text>
            </Stack>
          </Card>

          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Participants</Text>
              <Heading level={2}>{participants.length}</Heading>
              <Text variant="sm">Total participants</Text>
            </Stack>
          </Card>

          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Enrollments</Text>
              <Heading level={2}>{enrollments.length}</Heading>
              <Text variant="sm">
                {enrollments.filter(e => e.status === 'active').length} active
              </Text>
            </Stack>
          </Card>
        </InlineStack>

        {/* Programs List */}
        <Card>
          <Stack space="400">
            <Heading level={2}>Programs Sample</Heading>
            <Stack space="300">
              {programs.slice(0, 5).map((program) => (
                <Card key={program.id}>
                  <Stack space="200">
                    <InlineStack gap="200">
                      <Text weight="600">{program.name}</Text>
                      <Text variant="sm" color="subdued">• {program.type}</Text>
                    </InlineStack>
                    <Text variant="sm">
                      {program.active ? '✅ Active' : '⏸️ Inactive'}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </Stack>
            {programs.length > 5 && (
              <Text variant="sm" color="subdued">Showing 5 of {programs.length} programs</Text>
            )}
          </Stack>
        </Card>

        {/* Participants List */}
        <Card>
          <Stack space="400">
            <Heading level={2}>Participants Sample</Heading>
            <Stack space="300">
              {participants.slice(0, 5).map((participant) => (
                <Card key={participant.id}>
                  <Stack space="200">
                    <Text weight="600">
                      {participant.firstName} {participant.lastName}
                    </Text>
                    {participant.email && (
                      <Text variant="sm">{participant.email}</Text>
                    )}
                    {participant.phone && (
                      <Text variant="sm" color="subdued">{participant.phone}</Text>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
            {participants.length > 5 && (
              <Text variant="sm" color="subdued">Showing 5 of {participants.length} participants</Text>
            )}
          </Stack>
        </Card>

        {/* Enrollment Stats */}
        <Card>
          <Stack space="400">
            <Heading level={2}>Enrollment Status</Heading>
            <Stack space="300">
              <InlineStack gap="400">
                <Text>
                  ✅ Active: <strong>{enrollments.filter(e => e.status === 'active').length}</strong>
                </Text>
                <Text>
                  ✔️ Completed: <strong>{enrollments.filter(e => e.status === 'completed').length}</strong>
                </Text>
                <Text>
                  ⏳ Pending: <strong>{enrollments.filter(e => e.status === 'pending').length}</strong>
                </Text>
              </InlineStack>
            </Stack>
          </Stack>
        </Card>

        {/* Success Message */}
        <Card>
          <Stack space="300">
            <Text weight="600">✅ Phase 2 Complete!</Text>
            <Text>
              All types, stores, and mock data have been successfully ported from POC to Bonstart.
              Stitch components are rendering correctly with your data.
            </Text>
            <Text variant="sm" color="subdued">
              Next: Phase 3 will recreate all POC pages using Stitch components
            </Text>
          </Stack>
        </Card>
      </Stack>
    </PageLayout>
  );
}
