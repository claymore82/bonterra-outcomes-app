'use client';

import { use, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Button,
  Icon,
  Divider,
  TileLayout,
  Tabs,
  TabList,
  Tab,
  TabPanel,
} from '@bonterratech/stitch-extension';
import PageLayout from '../../components/PageLayout';
import ActivityTimeline, { type TimelineEvent } from '../../components/ActivityTimeline';
import SimpleBadge from '../../components/SimpleBadge';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useServiceStore } from '@/lib/stores/serviceStore';
import { useGoalStore } from '@/lib/stores/goalStore';
import { useHouseholdStore } from '@/lib/stores/householdStore';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';
import { useTouchpointStore } from '@/lib/stores/touchpointStore';

interface ParticipantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ParticipantDetailPage({ params }: ParticipantDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { participants } = useParticipantStore();
  const { enrollments, getActiveEnrollments } = useEnrollmentStore();
  const { programs } = useProgramStore();
  const { serviceTransactions, serviceTypes } = useServiceStore();
  const { goals } = useGoalStore();
  const { households } = useHouseholdStore();
  const { caseWorkers } = useCaseWorkerStore();
  const { touchpoints } = useTouchpointStore();

  const tabFromUrl = searchParams.get('tab');
  const [selectedTab, setSelectedTab] = useState(tabFromUrl || 'overview');
  const [chartsReady, setChartsReady] = useState(false);
  const [Highcharts, setHighcharts] = useState<any>(null);
  const [HighchartsReact, setHighchartsReact] = useState<any>(null);

  // Load Highcharts on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Promise.all([
        import('highcharts'),
        import('@highcharts/react'),
      ]).then(([highchartsModule, highchartsReactModule]) => {
        setHighcharts(highchartsModule.default);
        setHighchartsReact(() => highchartsReactModule.default);
        setChartsReady(true);
      });
    }
  }, []);

  const participant = participants.find(p => p.id === id);

  if (!participant) {
    return (
      <PageLayout>
        <Card>
          <Stack space="400" style={{ padding: '40px', textAlign: 'center' }}>
            <Icon name="user" size="large" />
            <Heading level={2}>Individual not found</Heading>
            <Text color="subdued">The individual you're looking for doesn't exist.</Text>
            <Button onPress={() => router.push('/participants')}>
              Back to Individuals
            </Button>
          </Stack>
        </Card>
      </PageLayout>
    );
  }

  // Get all participant data
  const participantEnrollments = enrollments.filter(e => e.participantId === id);
  const activeEnrollments = getActiveEnrollments().filter(e => e.participantId === id);
  const participantServices = serviceTransactions.filter(st => {
    const enrollment = enrollments.find(e => e.id === st.enrollmentId);
    return enrollment?.participantId === id;
  });
  const participantGoals = goals.filter(g => {
    const enrollment = enrollments.find(e => e.id === g.enrollmentId);
    return enrollment?.participantId === id;
  });

  // Get participant's touchpoints
  const participantTouchpoints = touchpoints.filter(t => t.participantId === id);

  // Find household
  const household = households.find(h => h.members.some(m => m.id === id));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Build activity timeline
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add enrollments (last 5)
    participantEnrollments.slice(-5).forEach(enrollment => {
      const program = programs.find(p => p.id === enrollment.programId);
      events.push({
        id: `enrollment-${enrollment.id}`,
        type: 'enrollment',
        title: `Enrolled in ${program?.name || 'Program'}`,
        description: `Started enrollment`,
        date: enrollment.startDate,
        icon: 'clipboard-list',
        color: '#7C3AED',
        metadata: {
          program: program?.name,
          status: enrollment.status,
        },
      });
    });

    // Add services (last 5)
    participantServices.slice(-5).forEach(service => {
      const serviceType = serviceTypes.find(st => st.id === service.serviceTypeId);
      events.push({
        id: `service-${service.id}`,
        type: 'service',
        title: serviceType?.name || 'Service',
        description: `${service.duration} minutes`,
        date: service.serviceDate,
        icon: 'briefcase',
        color: '#3B82F6',
        metadata: {},
      });
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [participantEnrollments, participantServices, serviceTypes, programs]);

  // Chart data for analytics
  const servicesOverTimeData = useMemo(() => {
    // Group services by month
    const monthlyServices: { [key: string]: number } = {};
    participantServices.forEach(service => {
      const date = new Date(service.serviceDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyServices[monthKey] = (monthlyServices[monthKey] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthlyServices).sort();
    return {
      categories: sortedMonths.map(m => {
        const [year, month] = m.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      data: sortedMonths.map(m => monthlyServices[m]),
    };
  }, [participantServices]);

  const caseWorkerTimeData = useMemo(() => {
    // Calculate total time spent by each case worker
    const caseWorkerTime: { [key: string]: number } = {};
    participantServices.forEach(service => {
      const enrollment = enrollments.find(e => e.id === service.enrollmentId);
      if (enrollment?.caseWorkerId) {
        const caseWorker = caseWorkers.find(cw => cw.id === enrollment.caseWorkerId);
        const name = caseWorker ? `${caseWorker.firstName} ${caseWorker.lastName}` : 'Unknown';
        caseWorkerTime[name] = (caseWorkerTime[name] || 0) + (service.duration || 0);
      }
    });

    return Object.entries(caseWorkerTime).map(([name, minutes]) => ({
      name,
      y: Math.round(minutes / 60 * 10) / 10, // Convert to hours, round to 1 decimal
    }));
  }, [participantServices, enrollments, caseWorkers]);

  const serviceTypeDistribution = useMemo(() => {
    const serviceTypeCounts: { [key: string]: number } = {};
    participantServices.forEach(service => {
      const serviceType = serviceTypes.find(st => st.id === service.serviceTypeId);
      const typeName = serviceType?.name || 'Other';
      serviceTypeCounts[typeName] = (serviceTypeCounts[typeName] || 0) + 1;
    });

    return Object.entries(serviceTypeCounts).map(([name, count]) => ({
      name,
      y: count,
    }));
  }, [participantServices, serviceTypes]);

  // Calculate total funds distributed to participant
  const totalFundsDistributed = useMemo(() => {
    return participantServices.reduce((sum, service) => sum + (service.totalCost || 0), 0);
  }, [participantServices]);

  // Calculate total service hours
  const totalServiceHours = useMemo(() => {
    const totalMinutes = participantServices.reduce((sum, service) => sum + (service.duration || 0), 0);
    return Math.round(totalMinutes / 60 * 10) / 10;
  }, [participantServices]);

  return (
    <PageLayout pageTitle={`${participant.firstName} ${participant.lastName}`}>
      <Stack space="600">
        {/* Back Button */}
        <InlineStack gap="400" verticalAlign="center">
          <Button
            variant="tertiary"
            onPress={() => router.push('/participants')}
          >
            <Icon name="arrow-left" />
            Back
          </Button>
        </InlineStack>

        {/* Profile Header */}
        <Card>
          <Stack space="400">
            <InlineStack gap="400" verticalAlign="center" distribute="space-between">
              <InlineStack gap="400" verticalAlign="center">
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: '600',
                    color: '#ffffff',
                  }}
                >
                  {participant.firstName[0]}{participant.lastName[0]}
                </div>
                <Stack space="200">
                  <Heading level={1}>
                    {participant.firstName} {participant.lastName}
                  </Heading>
                  <InlineStack gap="300">
                    {activeEnrollments.length > 0 ? (
                      <SimpleBadge tone="positive">Active</SimpleBadge>
                    ) : (
                      <SimpleBadge tone="neutral">Inactive</SimpleBadge>
                    )}
                  </InlineStack>
                </Stack>
              </InlineStack>
              <InlineStack gap="300">
                <Button
                  variant="primary"
                  onPress={() => router.push(`/enroll?participantId=${id}`)}
                >
                  <Icon name="user-plus" />
                  Enroll
                </Button>
              </InlineStack>
            </InlineStack>
          </Stack>
        </Card>

        {/* Quick Stats */}
        <Stack space="400">
          <TileLayout columns="4" columnsSM="2" space="400">
            <Card>
              <Stack space="200">
                <Text variant="sm" color="subdued">Active Enrollments</Text>
                <Heading level={2}>{activeEnrollments.length}</Heading>
              </Stack>
            </Card>
            <Card>
              <Stack space="200">
                <Text variant="sm" color="subdued">Services</Text>
                <Heading level={2}>{participantServices.length}</Heading>
              </Stack>
            </Card>
            <Card>
              <Stack space="200">
                <Text variant="sm" color="subdued">Goals</Text>
                <Heading level={2}>{participantGoals.length}</Heading>
              </Stack>
            </Card>
            <Card>
              <Stack space="200">
                <Text variant="sm" color="subdued">Household</Text>
                <Heading level={2}>{household?.members.length || 1}</Heading>
              </Stack>
            </Card>
          </TileLayout>

          {totalFundsDistributed > 0 && (
            <Card>
              <Stack space="200">
                <Text variant="sm" color="subdued">Funds Distributed</Text>
                <Heading level={2}>
                  ${totalFundsDistributed.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Heading>
                <Text variant="sm" color="subdued">
                  Total value of services provided across all enrollments
                </Text>
              </Stack>
            </Card>
          )}
        </Stack>

        {/* Tabbed Content */}
        <Card>
          <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key as string)}>
            <TabList>
              <Tab id="overview">Overview</Tab>
              <Tab id="enrollments">Enrollments ({participantEnrollments.length})</Tab>
              <Tab id="services">Services ({participantServices.length})</Tab>
              <Tab id="case-notes">Case Notes ({participantTouchpoints.length})</Tab>
              <Tab id="analytics">Analytics</Tab>
              <Tab id="activity">Activity</Tab>
            </TabList>

            {/* Overview Tab */}
            <TabPanel id="overview">
              <Stack space="400">
                <Heading level={3}>Contact Information</Heading>
                <TileLayout columns="2" columnsSM="1" space="300">
                  <Stack space="200">
                    <Text variant="sm" color="subdued">Email</Text>
                    <Text>{participant.email || '—'}</Text>
                  </Stack>
                  <Stack space="200">
                    <Text variant="sm" color="subdued">Phone</Text>
                    <Text>{participant.phone || '—'}</Text>
                  </Stack>
                </TileLayout>
              </Stack>
            </TabPanel>

            {/* Enrollments Tab */}
            <TabPanel id="enrollments">
              <Stack space="400">
                <Heading level={3}>{participantEnrollments.length} Enrollments</Heading>
                {participantEnrollments.length === 0 ? (
                  <Text color="subdued">No enrollments yet</Text>
                ) : (
                  <Stack space="300">
                    {participantEnrollments.map((enrollment) => {
                      const program = programs.find(p => p.id === enrollment.programId);
                      const hasNextCheckIn = enrollment.nextCheckIn && enrollment.status === 'active';
                      const isUpcoming = hasNextCheckIn && new Date(enrollment.nextCheckIn!) > new Date();
                      const isPast = hasNextCheckIn && new Date(enrollment.nextCheckIn!) <= new Date();

                      return (
                        <Card key={enrollment.id}>
                          <InlineStack gap="300" verticalAlign="center" distribute="space-between">
                            <Stack space="100">
                              <Text weight="500">{program?.name || 'Unknown Program'}</Text>
                              <InlineStack gap="300">
                                <Text variant="sm" color="subdued">Started {formatDate(enrollment.startDate)}</Text>
                                <SimpleBadge tone={enrollment.status === 'active' ? 'positive' : 'neutral'}>
                                  {enrollment.status}
                                </SimpleBadge>
                              </InlineStack>
                              {hasNextCheckIn && (
                                <InlineStack gap="200" verticalAlign="center">
                                  <Icon
                                    name="calendar"
                                    size="small"
                                    style={{ color: isPast ? '#ef4444' : '#7C3AED' }}
                                  />
                                  <Text
                                    variant="sm"
                                    style={{ color: isPast ? '#ef4444' : '#7C3AED' }}
                                  >
                                    {isPast ? 'Check-in was ' : 'Next check-in: '}
                                    {new Date(enrollment.nextCheckIn!).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                    {' at '}
                                    {new Date(enrollment.nextCheckIn!).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}
                                  </Text>
                                </InlineStack>
                              )}
                            </Stack>
                            <Button
                              variant="tertiary"
                              onPress={() => router.push(`/enrollments/${enrollment.id}`)}
                            >
                              View
                            </Button>
                          </InlineStack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            </TabPanel>

            {/* Services Tab */}
            <TabPanel id="services">
              <Stack space="400">
                <InlineStack gap="400" verticalAlign="center" distribute="space-between">
                  <Heading level={3}>Service History</Heading>
                  <Button variant="primary" onPress={() => router.push(`/participants/${id}/record-service`)}>
                    <Icon name="plus" />
                    Record Service
                  </Button>
                </InlineStack>

                {participantServices.length === 0 ? (
                  <Card>
                    <Stack space="300" style={{ padding: '40px', textAlign: 'center' }}>
                      <Icon name="briefcase" size="large" />
                      <Heading level={3}>No services recorded yet</Heading>
                      <Text color="subdued">
                        Services provided to this individual will appear here.
                      </Text>
                    </Stack>
                  </Card>
                ) : (
                  <Card>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                          <tr>
                            <th style={{ padding: '12px', textAlign: 'left' }}>
                              <Text variant="sm" weight="600">Date</Text>
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>
                              <Text variant="sm" weight="600">Service</Text>
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>
                              <Text variant="sm" weight="600">Program</Text>
                            </th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>
                              <Text variant="sm" weight="600">Quantity</Text>
                            </th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>
                              <Text variant="sm" weight="600">Cost</Text>
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>
                              <Text variant="sm" weight="600">Provided By</Text>
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>
                              <Text variant="sm" weight="600">Status</Text>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {participantServices
                            .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
                            .map((service) => {
                              const serviceType = serviceTypes.find(st => st.id === service.serviceTypeId);
                              const enrollment = enrollments.find(e => e.id === service.enrollmentId);
                              const program = enrollment ? programs.find(p => p.id === enrollment.programId) : null;
                              const caseWorker = caseWorkers.find(cw => cw.id === service.providedBy);

                              return (
                                <tr key={service.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                  <td style={{ padding: '12px' }}>
                                    <Text variant="sm">
                                      {new Date(service.serviceDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </Text>
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <Stack space="100">
                                      <Text variant="sm" weight="500">{serviceType?.name || 'Unknown Service'}</Text>
                                      {service.notes && (
                                        <Text variant="xs" color="subdued">{service.notes}</Text>
                                      )}
                                    </Stack>
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <Text variant="sm" color="subdued">{program?.name || '—'}</Text>
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'right' }}>
                                    <Text variant="sm">
                                      {service.quantity} {service.unit}
                                    </Text>
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'right' }}>
                                    <Text variant="sm" weight="500">
                                      {service.totalCost ? `$${service.totalCost.toLocaleString()}` : '—'}
                                    </Text>
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <Text variant="sm" color="subdued">
                                      {caseWorker ? `${caseWorker.firstName} ${caseWorker.lastName}` : service.providedBy}
                                    </Text>
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    {service.outcome && (
                                      <SimpleBadge
                                        tone={
                                          service.outcome === 'successful' ? 'positive' :
                                          service.outcome === 'unsuccessful' ? 'critical' :
                                          'neutral'
                                        }
                                      >
                                        {service.outcome}
                                      </SimpleBadge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </Stack>
            </TabPanel>

            {/* Case Notes Tab */}
            <TabPanel id="case-notes">
              <Stack space="400">
                <InlineStack gap="400" verticalAlign="center" distribute="space-between">
                  <Heading level={3}>Case Notes</Heading>
                  <Button variant="primary" onPress={() => router.push(`/participants/${id}/add-case-note`)}>
                    <Icon name="plus" />
                    Add Case Note
                  </Button>
                </InlineStack>

                {participantTouchpoints.length === 0 ? (
                  <Card>
                    <Stack space="300" style={{ padding: '40px', textAlign: 'center' }}>
                      <Icon name="file-text" size="large" />
                      <Heading level={3}>No case notes yet</Heading>
                      <Text color="subdued">
                        Add your first case note to track interactions with this individual.
                      </Text>
                    </Stack>
                  </Card>
                ) : (
                  <Stack space="300">
                    {participantTouchpoints
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((touchpoint) => {
                        const enrollment = enrollments.find(e => e.id === touchpoint.enrollmentId);
                        const program = enrollment ? programs.find(p => p.id === enrollment.programId) : null;
                        const caseWorker = touchpoint.caseWorkerId ? caseWorkers.find(cw => cw.id === touchpoint.caseWorkerId) : null;

                        return (
                          <Card key={touchpoint.id}>
                            <Stack space="300">
                              <InlineStack gap="400" verticalAlign="center" distribute="space-between">
                                <Stack space="100">
                                  <InlineStack gap="200" verticalAlign="center">
                                    <Text weight="500">
                                      {new Date(touchpoint.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </Text>
                                    <SimpleBadge tone="neutral">
                                      {touchpoint.touchpointType.replace('-', ' ')}
                                    </SimpleBadge>
                                    {program && (
                                      <Text variant="sm" color="subdued">
                                        {program.name}
                                      </Text>
                                    )}
                                  </InlineStack>
                                  {caseWorker && (
                                    <Text variant="sm" color="subdued">
                                      By: {caseWorker.firstName} {caseWorker.lastName}
                                    </Text>
                                  )}
                                </Stack>
                                {touchpoint.duration && (
                                  <Text variant="sm" color="subdued">
                                    {touchpoint.duration} min
                                  </Text>
                                )}
                              </InlineStack>

                              <Text>{touchpoint.content}</Text>

                              {touchpoint.extractedData && (
                                <Stack space="200">
                                  {touchpoint.extractedData.progressOnGoals && touchpoint.extractedData.progressOnGoals.length > 0 && (
                                    <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                      <Text variant="sm" weight="500" style={{ color: '#166534' }}>
                                        📊 Goal Progress Recorded
                                      </Text>
                                    </div>
                                  )}
                                  {touchpoint.servicesRecorded && touchpoint.servicesRecorded.length > 0 && (
                                    <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                      <Text variant="sm" weight="500" style={{ color: '#1e40af' }}>
                                        💼 {touchpoint.servicesRecorded.length} Service{touchpoint.servicesRecorded.length !== 1 ? 's' : ''} Created
                                      </Text>
                                    </div>
                                  )}
                                  {touchpoint.extractedData.riskFlags && touchpoint.extractedData.riskFlags.length > 0 && (
                                    <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                                      <Text variant="sm" weight="500" style={{ color: '#7f1d1d' }}>
                                        ⚠️ {touchpoint.extractedData.riskFlags.length} Risk Flag{touchpoint.extractedData.riskFlags.length !== 1 ? 's' : ''}
                                      </Text>
                                    </div>
                                  )}
                                </Stack>
                              )}
                            </Stack>
                          </Card>
                        );
                      })}
                  </Stack>
                )}
              </Stack>
            </TabPanel>

            {/* Analytics Tab */}
            <TabPanel id="analytics">
              <Stack space="600">
                <Heading level={3}>Service Analytics</Heading>

                {participantServices.length === 0 ? (
                  <Text color="subdued">No service data available yet</Text>
                ) : (
                  <>
                    {/* Key Metrics */}
                    <TileLayout columns="3" columnsSM="1" space="400">
                      <Card>
                        <Stack space="200">
                          <Text variant="sm" color="subdued">Total Services</Text>
                          <Heading level={2}>{participantServices.length}</Heading>
                        </Stack>
                      </Card>
                      <Card>
                        <Stack space="200">
                          <Text variant="sm" color="subdued">Service Hours</Text>
                          <Heading level={2}>{totalServiceHours}h</Heading>
                        </Stack>
                      </Card>
                      <Card>
                        <Stack space="200">
                          <Text variant="sm" color="subdued">Case Workers</Text>
                          <Heading level={2}>{caseWorkerTimeData.length}</Heading>
                        </Stack>
                      </Card>
                    </TileLayout>

                    {/* Services Over Time Chart */}
                    {servicesOverTimeData.categories.length > 0 && (
                      <Card>
                        <Stack space="300">
                          <Heading level={4}>Services Received Over Time</Heading>
                          <div>
                            {chartsReady && HighchartsReact && (
                              <HighchartsReact
                                highcharts={Highcharts}
                                options={{
                                  chart: {
                                    type: 'area',
                                    height: 300,
                                  },
                                  title: {
                                    text: null,
                                  },
                                  xAxis: {
                                    categories: servicesOverTimeData.categories,
                                  },
                                  yAxis: {
                                    title: {
                                      text: 'Number of Services',
                                    },
                                    allowDecimals: false,
                                  },
                                  plotOptions: {
                                    area: {
                                      fillColor: {
                                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                                        stops: [
                                          [0, 'rgba(124, 58, 237, 0.3)'],
                                          [1, 'rgba(124, 58, 237, 0.05)'],
                                        ],
                                      },
                                      marker: {
                                        radius: 4,
                                      },
                                      lineWidth: 2,
                                      states: {
                                        hover: {
                                          lineWidth: 2,
                                        },
                                      },
                                      threshold: null,
                                    },
                                  },
                                  series: [
                                    {
                                      name: 'Services',
                                      data: servicesOverTimeData.data,
                                      color: '#7C3AED',
                                    },
                                  ],
                                  credits: {
                                    enabled: false,
                                  },
                                  legend: {
                                    enabled: false,
                                  },
                                }}
                              />
                            )}
                          </div>
                        </Stack>
                      </Card>
                    )}

                    {/* Case Worker Time Chart */}
                    {caseWorkerTimeData.length > 0 && (
                      <Card>
                        <Stack space="300">
                          <Heading level={4}>Time Spent by Case Worker</Heading>
                          <div>
                            {chartsReady && HighchartsReact && (
                              <HighchartsReact
                                highcharts={Highcharts}
                                options={{
                                  chart: {
                                    type: 'column',
                                    height: 300,
                                  },
                                  title: {
                                    text: null,
                                  },
                                  xAxis: {
                                    type: 'category',
                                  },
                                  yAxis: {
                                    title: {
                                      text: 'Hours',
                                    },
                                  },
                                  plotOptions: {
                                    column: {
                                      colorByPoint: true,
                                      colors: ['#7C3AED', '#A78BFA', '#C4B5FD', '#DDD6FE'],
                                    },
                                  },
                                  series: [
                                    {
                                      name: 'Hours',
                                      data: caseWorkerTimeData,
                                    },
                                  ],
                                  credits: {
                                    enabled: false,
                                  },
                                  legend: {
                                    enabled: false,
                                  },
                                }}
                              />
                            )}
                          </div>
                        </Stack>
                      </Card>
                    )}

                    {/* Service Type Distribution */}
                    {serviceTypeDistribution.length > 0 && (
                      <Card>
                        <Stack space="300">
                          <Heading level={4}>Service Type Distribution</Heading>
                          <div>
                            {chartsReady && HighchartsReact && (
                              <HighchartsReact
                                highcharts={Highcharts}
                                options={{
                                  chart: {
                                    type: 'pie',
                                    height: 350,
                                  },
                                  title: {
                                    text: null,
                                  },
                                  plotOptions: {
                                    pie: {
                                      allowPointSelect: true,
                                      cursor: 'pointer',
                                      dataLabels: {
                                        enabled: true,
                                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                      },
                                      colors: ['#7C3AED', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#F5F3FF'],
                                    },
                                  },
                                  series: [
                                    {
                                      name: 'Services',
                                      data: serviceTypeDistribution,
                                    },
                                  ],
                                  credits: {
                                    enabled: false,
                                  },
                                }}
                              />
                            )}
                          </div>
                        </Stack>
                      </Card>
                    )}
                  </>
                )}
              </Stack>
            </TabPanel>

            {/* Activity Tab */}
            <TabPanel id="activity">
              <Stack space="400">
                <Heading level={3}>Activity Timeline</Heading>
                <ActivityTimeline events={timelineEvents} />
              </Stack>
            </TabPanel>
          </Tabs>
        </Card>
      </Stack>
    </PageLayout>
  );
}
