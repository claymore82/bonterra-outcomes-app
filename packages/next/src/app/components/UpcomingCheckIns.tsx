'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Button,
  Icon,
} from '@bonterratech/stitch-extension';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useUserStore } from '@/lib/stores/userStore';

export default function UpcomingCheckIns() {
  const router = useRouter();
  const { enrollments } = useEnrollmentStore();
  const { participants } = useParticipantStore();
  const { programs } = useProgramStore();
  const { currentUser } = useUserStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Get all enrollments with upcoming check-ins for the current case worker
  const upcomingCheckIns = useMemo(() => {
    if (!currentUser) return [];

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // Filter enrollments assigned to the current user with upcoming check-ins
    const checkIns = enrollments
      .filter(enrollment => {
        if (enrollment.status !== 'active') return false;
        if (!enrollment.nextCheckIn) return false;
        if (enrollment.caseWorkerId !== currentUser.id) return false;

        const checkInDate = new Date(enrollment.nextCheckIn);
        return checkInDate <= sevenDaysFromNow; // Show check-ins within the next 7 days
      })
      .map(enrollment => {
        const participant = participants.find(p => p.id === enrollment.participantId);
        const program = programs.find(p => p.id === enrollment.programId);
        const checkInDate = new Date(enrollment.nextCheckIn!);
        const isPast = checkInDate < now;
        const isToday = checkInDate.toDateString() === now.toDateString();

        // Calculate hours until check-in
        const hoursUntil = Math.floor((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60));

        return {
          enrollment,
          participant,
          program,
          checkInDate,
          isPast,
          isToday,
          hoursUntil,
        };
      })
      .sort((a, b) => a.checkInDate.getTime() - b.checkInDate.getTime()); // Sort by date

    return checkIns;
  }, [enrollments, participants, programs, currentUser]);

  if (!currentUser) return null;

  // Limit display to first 5 check-ins unless "showAll" is clicked
  const displayedCheckIns = showAll ? upcomingCheckIns : upcomingCheckIns.slice(0, 5);
  const hasMore = upcomingCheckIns.length > 5;

  return (
    <Card>
      <Stack space="400">
        <InlineStack gap="400" verticalAlign="center" distribute="space-between">
          <InlineStack gap="200" verticalAlign="center">
            <Icon name="calendar" size="medium" style={{ color: '#7C3AED' }} />
            <Heading level={3}>
              Upcoming Check-Ins {upcomingCheckIns.length > 0 && `(${upcomingCheckIns.length})`}
            </Heading>
          </InlineStack>
          {upcomingCheckIns.length > 0 && (
            <Button
              variant="tertiary"
              size="small"
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} />
              {isExpanded ? 'Minimize' : 'Expand'}
            </Button>
          )}
        </InlineStack>

        {isExpanded && (
          <>
            {upcomingCheckIns.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Text variant="sm" color="subdued">
                  No check-ins scheduled in the next 7 days
                </Text>
              </div>
            ) : (
              <Stack space="300">
                {displayedCheckIns.map(({ enrollment, participant, program, checkInDate, isPast, isToday, hoursUntil }) => {
                  if (!participant) return null;

                  const urgencyColor = isPast
                    ? '#ef4444'
                    : isToday
                    ? '#f59e0b'
                    : hoursUntil < 24
                    ? '#f59e0b'
                    : '#7C3AED';

                  return (
                    <Card
                      key={enrollment.id}
                      style={{
                        backgroundColor: isPast ? '#fef2f2' : isToday ? '#fffbeb' : 'white',
                        border: `1px solid ${urgencyColor}20`,
                      }}
                    >
                      <InlineStack gap="300" verticalAlign="center" distribute="space-between">
                        <Stack space="100">
                          <InlineStack gap="200" verticalAlign="center">
                            <Text weight="600">
                              {participant.firstName} {participant.lastName}
                            </Text>
                            {isPast && (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                }}
                              >
                                Overdue
                              </span>
                            )}
                            {isToday && (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  backgroundColor: '#f59e0b',
                                  color: 'white',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                }}
                              >
                                Today
                              </span>
                            )}
                          </InlineStack>

                          <Text variant="sm" color="subdued">
                            {program?.name || 'Unknown Program'}
                          </Text>

                          <InlineStack gap="200" verticalAlign="center">
                            <Icon
                              name="clock"
                              size="small"
                              style={{ color: urgencyColor }}
                            />
                            <Text variant="sm" style={{ color: urgencyColor }}>
                              {checkInDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                              {' at '}
                              {checkInDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </Text>
                            {!isPast && hoursUntil < 48 && (
                              <Text variant="xs" color="subdued">
                                ({hoursUntil < 1 ? 'Less than 1 hour' : `${hoursUntil} hours`})
                              </Text>
                            )}
                          </InlineStack>

                          {enrollment.nextCheckInZoomLink && (
                            <InlineStack gap="200" verticalAlign="center">
                              <Icon name="video" size="small" style={{ color: '#2563eb' }} />
                              <a
                                href={enrollment.nextCheckInZoomLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px' }}
                              >
                                Join Zoom Meeting
                              </a>
                            </InlineStack>
                          )}
                        </Stack>

                        <InlineStack gap="200">
                          <Button
                            variant="tertiary"
                            size="small"
                            onPress={() => router.push(`/participants/${participant.id}`)}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="primary"
                            size="small"
                            onPress={() => router.push(`/participants/${participant.id}/add-case-note`)}
                          >
                            <Icon name="plus" />
                            Add Note
                          </Button>
                        </InlineStack>
                      </InlineStack>
                    </Card>
                  );
                })}

                {hasMore && !showAll && (
                  <Button
                    variant="tertiary"
                    onPress={() => setShowAll(true)}
                    style={{ width: '100%' }}
                  >
                    Show {upcomingCheckIns.length - 5} more check-ins
                  </Button>
                )}

                {hasMore && showAll && (
                  <Button
                    variant="tertiary"
                    onPress={() => setShowAll(false)}
                    style={{ width: '100%' }}
                  >
                    Show less
                  </Button>
                )}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}
