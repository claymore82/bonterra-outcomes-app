'use client';

import { use, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Button,
  Icon,
  TileLayout,
  Tabs,
  TabList,
  Tab,
  TabPanel,
} from '@bonterratech/stitch-extension';
import SimpleBadge from '../../components/SimpleBadge';
import PageLayout from '../../components/PageLayout';
import { useHouseholdStore } from '@/lib/stores/householdStore';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useServiceStore } from '@/lib/stores/serviceStore';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';

interface FamilyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function FamilyDetailPage({ params }: FamilyDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { households } = useHouseholdStore();
  const { participants } = useParticipantStore();
  const { enrollments, getActiveEnrollments } = useEnrollmentStore();
  const { programs } = useProgramStore();
  const { serviceTransactions, serviceTypes } = useServiceStore();
  const { caseWorkers } = useCaseWorkerStore();

  const [selectedTab, setSelectedTab] = useState('overview');
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

  const household = households.find(h => h.id === id);

  if (!household) {
    return (
      <PageLayout>
        <Card>
          <Stack space="400" style={{ padding: '40px', textAlign: 'center' }}>
            <Icon name="users" size="large" />
            <Heading level={2}>Household not found</Heading>
            <Button onPress={() => router.push('/families')}>
              Back to Families
            </Button>
          </Stack>
        </Card>
      </PageLayout>
    );
  }

  const memberIds = household.members.map(m => m.id);
  const activeEnrollments = getActiveEnrollments();
  const activeFamilyEnrollments = activeEnrollments.filter(e => memberIds.includes(e.participantId));

  // Get all family services
  const familyServices = useMemo(() => {
    return serviceTransactions.filter(st => {
      const enrollment = enrollments.find(e => e.id === st.enrollmentId);
      return enrollment && memberIds.includes(enrollment.participantId);
    });
  }, [serviceTransactions, enrollments, memberIds]);

  // Chart data for analytics
  const servicesOverTimeData = useMemo(() => {
    const monthlyServices: { [key: string]: number } = {};
    familyServices.forEach(service => {
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
  }, [familyServices]);

  const servicesByMemberData = useMemo(() => {
    const memberServiceCounts: { [key: string]: number } = {};
    familyServices.forEach(service => {
      const enrollment = enrollments.find(e => e.id === service.enrollmentId);
      if (enrollment?.participantId) {
        const member = household.members.find(m => m.id === enrollment.participantId);
        const name = member ? `${member.firstName} ${member.lastName}` : 'Unknown';
        memberServiceCounts[name] = (memberServiceCounts[name] || 0) + 1;
      }
    });

    return Object.entries(memberServiceCounts).map(([name, count]) => ({
      name,
      y: count,
    }));
  }, [familyServices, enrollments, household.members]);

  const caseWorkerTimeData = useMemo(() => {
    const caseWorkerTime: { [key: string]: number } = {};
    familyServices.forEach(service => {
      const enrollment = enrollments.find(e => e.id === service.enrollmentId);
      if (enrollment?.caseWorkerId) {
        const caseWorker = caseWorkers.find(cw => cw.id === enrollment.caseWorkerId);
        const name = caseWorker ? `${caseWorker.firstName} ${caseWorker.lastName}` : 'Unknown';
        caseWorkerTime[name] = (caseWorkerTime[name] || 0) + (service.duration || 0);
      }
    });

    return Object.entries(caseWorkerTime).map(([name, minutes]) => ({
      name,
      y: Math.round(minutes / 60 * 10) / 10,
    }));
  }, [familyServices, enrollments, caseWorkers]);

  const totalServiceHours = useMemo(() => {
    const totalMinutes = familyServices.reduce((sum, service) => sum + (service.duration || 0), 0);
    return Math.round(totalMinutes / 60 * 10) / 10;
  }, [familyServices]);

  return (
    <PageLayout pageTitle={household.householdName}>
      <Stack space="600">
        {/* Back Button */}
        <InlineStack gap="400" verticalAlign="center">
          <Button
            variant="tertiary"
            onPress={() => router.push('/families')}
          >
            <Icon name="arrow-left" />
            Back
          </Button>
        </InlineStack>

        {/* Household Header */}
        <Card>
          <Stack space="400">
            <InlineStack gap="400" verticalAlign="center" distribute="space-between">
              <InlineStack gap="400" verticalAlign="center">
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: '#ffffff',
                  }}
                >
                  <Icon name="users" />
                </div>
                <Stack space="200">
                  <Heading level={1}>{household.householdName}</Heading>
                  <InlineStack gap="300">
                    {activeFamilyEnrollments.length > 0 ? (
                      <SimpleBadge tone="positive">Active</SimpleBadge>
                    ) : (
                      <SimpleBadge tone="neutral">Inactive</SimpleBadge>
                    )}
                    <SimpleBadge tone="info">{household.members.length} Members</SimpleBadge>
                  </InlineStack>
                </Stack>
              </InlineStack>
            </InlineStack>

            {household.address && (
              <InlineStack gap="200" verticalAlign="center">
                <Icon name="map-pin" />
                <Text>{household.address}</Text>
              </InlineStack>
            )}
          </Stack>
        </Card>

        {/* Quick Stats */}
        <TileLayout columns="4" columnsSM="2" space="400">
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Members</Text>
              <Heading level={2}>{household.members.length}</Heading>
            </Stack>
          </Card>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Active Enrollments</Text>
              <Heading level={2}>{activeFamilyEnrollments.length}</Heading>
            </Stack>
          </Card>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Programs</Text>
              <Heading level={2}>
                {new Set(activeFamilyEnrollments.map(e => e.programId)).size}
              </Heading>
            </Stack>
          </Card>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Head of Household</Text>
              <Text weight="500">
                {household.members.find(m => m.relationshipToHead === 'Self')?.firstName || 'Unknown'}
              </Text>
            </Stack>
          </Card>
        </TileLayout>

        {/* Tabbed Content */}
        <Card>
          <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key as string)}>
            <TabList>
              <Tab id="overview">Overview</Tab>
              <Tab id="members">Members ({household.members.length})</Tab>
              <Tab id="analytics">Analytics</Tab>
            </TabList>

            {/* Overview Tab */}
            <TabPanel id="overview">
              <Stack space="400">
                <Heading level={3}>Household Information</Heading>
                <TileLayout columns="2" columnsSM="1" space="300">
                  <Stack space="200">
                    <Text variant="sm" color="subdued">Household Name</Text>
                    <Text>{household.householdName}</Text>
                  </Stack>
                  {household.address && (
                    <Stack space="200">
                      <Text variant="sm" color="subdued">Address</Text>
                      <Text>{household.address}</Text>
                    </Stack>
                  )}
                </TileLayout>
              </Stack>
            </TabPanel>

            {/* Members Tab */}
            <TabPanel id="members">
              <Stack space="400">
                <Heading level={3}>{household.members.length} Family Members</Heading>
                <Stack space="300">
                  {household.members.map((member) => {
                    const memberParticipant = participants.find(p => p.id === member.id);
                    const memberEnrollments = activeEnrollments.filter(e => e.participantId === member.id);

                    return (
                      <Card key={member.id}>
                        <InlineStack gap="300" verticalAlign="center" distribute="space-between">
                          <InlineStack gap="300" verticalAlign="center">
                            <div
                              style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#ffffff',
                              }}
                            >
                              {member.firstName[0]}{member.lastName[0]}
                            </div>
                            <Stack space="100">
                              <Text weight="500">
                                {member.firstName} {member.lastName}
                              </Text>
                              <InlineStack gap="300">
                                <Text variant="sm" color="subdued">
                                  {member.relationshipToHead}
                                </Text>
                                {memberEnrollments.length > 0 && (
                                  <SimpleBadge tone="positive">{memberEnrollments.length} active</SimpleBadge>
                                )}
                              </InlineStack>
                            </Stack>
                          </InlineStack>
                          {memberParticipant && (
                            <Button
                              variant="tertiary"
                              onPress={() => router.push(`/participants/${member.id}`)}
                            >
                              View Profile
                            </Button>
                          )}
                        </InlineStack>
                      </Card>
                    );
                  })}
                </Stack>
              </Stack>
            </TabPanel>

            {/* Analytics Tab */}
            <TabPanel id="analytics">
              <Stack space="600">
                <Heading level={3}>Family Service Analytics</Heading>

                {familyServices.length === 0 ? (
                  <Text color="subdued">No service data available yet</Text>
                ) : (
                  <>
                    {/* Key Metrics */}
                    <TileLayout columns="3" columnsSM="1" space="400">
                      <Card>
                        <Stack space="200">
                          <Text variant="sm" color="subdued">Total Services</Text>
                          <Heading level={2}>{familyServices.length}</Heading>
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
                          <Text variant="sm" color="subdued">Avg Per Member</Text>
                          <Heading level={2}>
                            {Math.round(familyServices.length / household.members.length)}
                          </Heading>
                        </Stack>
                      </Card>
                    </TileLayout>

                    {/* Services Over Time */}
                    {servicesOverTimeData.categories.length > 0 && (
                      <Card>
                        <Stack space="300">
                          <Heading level={4}>Family Services Over Time</Heading>
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

                    {/* Services by Family Member */}
                    {servicesByMemberData.length > 0 && (
                      <Card>
                        <Stack space="300">
                          <Heading level={4}>Services by Family Member</Heading>
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
                                      text: 'Services Received',
                                    },
                                    allowDecimals: false,
                                  },
                                  plotOptions: {
                                    column: {
                                      colorByPoint: true,
                                      colors: ['#7C3AED', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'],
                                    },
                                  },
                                  series: [
                                    {
                                      name: 'Services',
                                      data: servicesByMemberData,
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

                    {/* Case Worker Time */}
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
                                    type: 'bar',
                                    height: 250,
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
                                    bar: {
                                      colorByPoint: true,
                                      colors: ['#7C3AED', '#A78BFA', '#C4B5FD'],
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
                  </>
                )}
              </Stack>
            </TabPanel>
          </Tabs>
        </Card>
      </Stack>
    </PageLayout>
  );
}
