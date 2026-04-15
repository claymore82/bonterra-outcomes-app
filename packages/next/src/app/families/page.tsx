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
  TileLayout,
} from '@bonterratech/stitch-extension';
import SimpleBadge from '../components/SimpleBadge';
import { useHouseholdStore } from '@/lib/stores/householdStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useUserStore } from '@/lib/stores/userStore';
import PageLayout from '../components/PageLayout';

export default function FamiliesPage() {
  const router = useRouter();
  const { households } = useHouseholdStore();
  const { enrollments, getActiveEnrollments } = useEnrollmentStore();
  const { participants } = useParticipantStore();
  const { currentProgramId, currentSiteId } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState('all');

  const totalMembers = households.reduce((sum, h) => sum + h.members.length, 0);
  const avgSize =
    households.length > 0 ? (totalMembers / households.length).toFixed(1) : 0;

  // Get enrollment status for household
  const getHouseholdStatus = (household: any) => {
    const activeEnrollments = getActiveEnrollments();
    const hasActiveMembers = household.members.some((member: any) =>
      activeEnrollments.some((e) => e.participantId === member.id),
    );
    return hasActiveMembers;
  };

  // Filter households
  const filteredHouseholds = useMemo(() => {
    const activeEnrollments = getActiveEnrollments();

    return households.filter((household) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        household.householdName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        household.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        household.members.some((m) =>
          `${m.firstName} ${m.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
        );

      // Size filter
      let matchesSize = true;
      if (sizeFilter !== 'all') {
        const size = household.members.length;
        if (sizeFilter === 'small') matchesSize = size <= 2;
        else if (sizeFilter === 'medium') matchesSize = size >= 3 && size <= 4;
        else if (sizeFilter === 'large') matchesSize = size >= 5;
      }

      // Program/Site filter (from master selectors)
      let matchesProgramOrSite = true;
      if (currentProgramId || currentSiteId) {
        // Check if any household member has an enrollment matching the current program/site
        matchesProgramOrSite = household.members.some((member) => {
          return activeEnrollments.some((e) => {
            if (e.participantId !== member.id) return false;

            // Check program filter
            if (currentProgramId && e.programId !== currentProgramId)
              return false;

            // Check site filter
            if (currentSiteId && e.siteId !== currentSiteId) return false;

            return true;
          });
        });
      }

      return matchesSearch && matchesSize && matchesProgramOrSite;
    });
  }, [
    households,
    searchQuery,
    sizeFilter,
    currentProgramId,
    currentSiteId,
    enrollments,
  ]);

  const activeHouseholds = households.filter((h) =>
    getHouseholdStatus(h),
  ).length;

  return (
    <PageLayout pageTitle="Families">
      <Stack space="600">
        {/* Header */}
        <Stack space="200">
          <Heading level={1}>Families & Households</Heading>
          <Text color="subdued">
            Manage family units and household relationships
          </Text>
        </Stack>

        {/* Action Button Row */}
        <InlineStack gap="400" distribute="end">
          <Button
            variant="primary"
            onPress={() => router.push('/families/create-agent')}
          >
            <Icon name="plus" />
            Create Family
          </Button>
        </InlineStack>

        {/* Stats */}
        <TileLayout columns="4" columnsSM="2" space="400">
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Total Households
              </Text>
              <Heading level={2}>{households.length}</Heading>
            </Stack>
          </Card>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Total Members
              </Text>
              <Heading level={2}>{totalMembers}</Heading>
            </Stack>
          </Card>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Active Households
              </Text>
              <Heading level={2}>{activeHouseholds}</Heading>
              <Text variant="sm">With enrollments</Text>
            </Stack>
          </Card>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Avg. Size
              </Text>
              <Heading level={2}>{avgSize}</Heading>
              <Text variant="sm">Members per household</Text>
            </Stack>
          </Card>
        </TileLayout>

        {/* Search and Filters */}
        <Card>
          <Stack space="400">
            <Heading level={3}>Search & Filter</Heading>
            <InlineStack gap="400">
              <div style={{ flex: 2 }}>
                <TextField
                  label="Search families"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by name, address, or member..."
                />
              </div>
              <div style={{ flex: 1 }}>
                <Select
                  label="Household Size"
                  selectedKey={sizeFilter}
                  onSelectionChange={(key) => setSizeFilter(key as string)}
                >
                  <SelectItem id="all">All Sizes</SelectItem>
                  <SelectItem id="small">Small (1-2)</SelectItem>
                  <SelectItem id="medium">Medium (3-4)</SelectItem>
                  <SelectItem id="large">Large (5+)</SelectItem>
                </Select>
              </div>
            </InlineStack>
          </Stack>
        </Card>

        {/* Households Grid */}
        <Stack space="400">
          <InlineStack
            gap="400"
            verticalAlign="center"
            distribute="space-between"
          >
            <Heading level={3}>
              {filteredHouseholds.length} Household
              {filteredHouseholds.length !== 1 ? 's' : ''}
            </Heading>
            {(searchQuery || sizeFilter !== 'all') && (
              <Button
                variant="secondary"
                onPress={() => {
                  setSearchQuery('');
                  setSizeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </InlineStack>

          {filteredHouseholds.length === 0 ? (
            <Card>
              <Stack
                space="300"
                style={{ padding: '40px', textAlign: 'center' }}
              >
                <Icon name="users" size="large" />
                <Heading level={3}>No households found</Heading>
                <Text color="subdued">
                  {searchQuery || sizeFilter !== 'all'
                    ? 'Try adjusting your filters or search query'
                    : 'Create your first family to get started'}
                </Text>
                {!searchQuery && sizeFilter === 'all' && (
                  <Button
                    variant="primary"
                    onPress={() => router.push('/families/create-agent')}
                  >
                    <Icon name="plus" />
                    Create Family
                  </Button>
                )}
              </Stack>
            </Card>
          ) : (
            <TileLayout columns="2" columnsSM="1" space="400">
              {filteredHouseholds.map((household) => {
                const hasActiveEnrollments = getHouseholdStatus(household);

                return (
                  <Card key={household.id}>
                    <Stack space="400">
                      {/* Header */}
                      <InlineStack
                        gap="300"
                        verticalAlign="center"
                        distribute="space-between"
                      >
                        <Stack space="200">
                          <InlineStack gap="200" verticalAlign="center">
                            <Heading level={3}>
                              {household.householdName}
                            </Heading>
                            {hasActiveEnrollments && (
                              <SimpleBadge tone="positive">Active</SimpleBadge>
                            )}
                          </InlineStack>
                          <InlineStack gap="300">
                            <Text variant="sm" color="subdued">
                              <Icon name="users" /> {household.members.length}{' '}
                              member{household.members.length !== 1 ? 's' : ''}
                            </Text>
                          </InlineStack>
                        </Stack>
                      </InlineStack>

                      {/* Address */}
                      {household.address && (
                        <Text variant="sm" color="subdued">
                          <Icon name="map-pin" /> {household.address}
                        </Text>
                      )}

                      {/* Members Preview */}
                      <Stack space="200">
                        <Text variant="sm" weight="500">
                          Members
                        </Text>
                        <InlineStack gap="200">
                          {household.members.slice(0, 5).map((member) => {
                            const memberInfo = participants.find(
                              (p) => p.id === member.id,
                            );
                            return (
                              <div
                                key={member.id}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background:
                                    'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                }}
                                title={`${member.firstName} ${member.lastName}`}
                              >
                                {member.firstName[0]}
                                {member.lastName[0]}
                              </div>
                            );
                          })}
                          {household.members.length > 5 && (
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#E5E7EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#666',
                              }}
                            >
                              +{household.members.length - 5}
                            </div>
                          )}
                        </InlineStack>
                      </Stack>

                      {/* Members List */}
                      <Stack space="100">
                        {household.members.slice(0, 3).map((member) => (
                          <InlineStack
                            key={member.id}
                            gap="200"
                            verticalAlign="center"
                          >
                            <Text variant="sm">
                              {member.firstName} {member.lastName}
                            </Text>
                            <Text variant="sm" color="subdued">
                              • {member.relationshipToHead}
                            </Text>
                          </InlineStack>
                        ))}
                        {household.members.length > 3 && (
                          <Text variant="sm" color="subdued">
                            + {household.members.length - 3} more member
                            {household.members.length - 3 !== 1 ? 's' : ''}
                          </Text>
                        )}
                      </Stack>

                      {/* Actions */}
                      <Button
                        variant="primary"
                        onPress={() => router.push(`/families/${household.id}`)}
                      >
                        View Household
                      </Button>
                    </Stack>
                  </Card>
                );
              })}
            </TileLayout>
          )}
        </Stack>
      </Stack>
    </PageLayout>
  );
}
