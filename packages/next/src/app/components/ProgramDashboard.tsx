'use client';

import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  TileLayout,
} from '@bonterratech/stitch-extension';
import {
  ClientLineChart,
  ClientBarChart,
  ClientStackedBarChart,
} from './ClientOnlyCharts';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useServiceStore } from '@/lib/stores/serviceStore';
import { useGoalStore } from '@/lib/stores/goalStore';
import { useHouseholdStore } from '@/lib/stores/householdStore';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useUserStore } from '@/lib/stores/userStore';
import { mockCaseWorkers } from '@/lib/mockData';
import { PROGRAM_TYPES } from '@/types/poc';

export default function ProgramDashboard() {
  const { enrollments, getActiveEnrollments } = useEnrollmentStore();
  const { programs } = useProgramStore();
  const { serviceTransactions, serviceTypes, calculateProgramSpending } =
    useServiceStore();
  const { goals } = useGoalStore();
  const { households } = useHouseholdStore();
  const { participants } = useParticipantStore();
  const { currentProgramId, currentSiteId, setCurrentProgram } = useUserStore();

  // Get selected program
  const selectedProgram = currentProgramId
    ? programs.find((p) => p.id === currentProgramId)
    : null;

  // Calculate stats - filtered by program and/or site if selected
  const allActiveEnrollments = getActiveEnrollments();
  const activeEnrollments = allActiveEnrollments.filter((e) => {
    if (currentProgramId && e.programId !== currentProgramId) return false;
    if (currentSiteId && e.siteId !== currentSiteId) return false;
    return true;
  });
  const activeParticipantIds = new Set(
    activeEnrollments.map((e) => e.participantId),
  );
  const totalParticipants = activeParticipantIds.size;
  const totalCaseWorkers = mockCaseWorkers.length;

  // Families filtered by program - only households with members enrolled in the selected program
  const programHouseholds = currentProgramId
    ? households.filter((h) =>
        h.members.some((m) => activeParticipantIds.has(m.id)),
      )
    : households;
  const totalHouseholdMembers = programHouseholds.reduce(
    (sum, h) => sum + h.members.length,
    0,
  );

  // Services this month - filtered by program enrollments
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const enrollmentIds = new Set(activeEnrollments.map((e) => e.id));
  const servicesThisMonth = serviceTransactions.filter(
    (t) =>
      new Date(t.serviceDate) >= firstDayOfMonth &&
      enrollmentIds.has(t.enrollmentId),
  ).length;

  // Goal completion rate - filtered by program enrollments
  const programGoals = goals.filter((g) => enrollmentIds.has(g.enrollmentId));
  const completedGoals = programGoals.filter(
    (g) => g.status === 'achieved',
  ).length;
  const goalCompletionRate =
    programGoals.length > 0
      ? Math.round((completedGoals / programGoals.length) * 100)
      : 0;

  // Budget tracking - only shown when program is selected and has a budget
  const programBudget = selectedProgram?.budget;
  const programSpending = currentProgramId
    ? calculateProgramSpending(currentProgramId)
    : 0;
  const remainingFunds = programBudget ? programBudget - programSpending : 0;
  const budgetUtilization = programBudget
    ? Math.round((programSpending / programBudget) * 100)
    : 0;

  // Enrollments by program - show all programs or just selected one
  let enrollmentsByProgram = currentProgramId
    ? [
        {
          name: selectedProgram!.name,
          value: activeEnrollments.length,
        },
      ]
    : programs
        .map((program) => {
          const count = allActiveEnrollments.filter(
            (e) => e.programId === program.id,
          ).length;
          return {
            name:
              program.name.length > 20
                ? program.name.substring(0, 20) + '...'
                : program.name,
            value: count,
          };
        })
        .filter((p) => p.value > 0);

  // Use sample data if no enrollments
  if (enrollmentsByProgram.length === 0) {
    enrollmentsByProgram = programs.slice(0, 4).map((program, i) => ({
      name:
        program.name.length > 20
          ? program.name.substring(0, 20) + '...'
          : program.name,
      value: [15, 22, 18, 12][i] || 10,
    }));
  }

  // Enrollments trend (last 6 months) - filtered by program and/or site if selected
  const enrollmentTrend = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const count = enrollments.filter((e) => {
      const enrollDate = new Date(e.startDate);
      const matchesMonth =
        enrollDate.getMonth() === date.getMonth() &&
        enrollDate.getFullYear() === date.getFullYear();
      const matchesProgram = currentProgramId
        ? e.programId === currentProgramId
        : true;
      const matchesSite = currentSiteId ? e.siteId === currentSiteId : true;
      return matchesMonth && matchesProgram && matchesSite;
    }).length;
    enrollmentTrend.push({ month: monthName, enrollments: count });
  }

  // If no recent enrollments, use sample data for demo
  const hasRecentData = enrollmentTrend.some((d) => d.enrollments > 0);
  if (!hasRecentData) {
    enrollmentTrend[0].enrollments = 8;
    enrollmentTrend[1].enrollments = 12;
    enrollmentTrend[2].enrollments = 15;
    enrollmentTrend[3].enrollments = 11;
    enrollmentTrend[4].enrollments = 18;
    enrollmentTrend[5].enrollments = activeEnrollments.length;
  }

  // Case worker caseload
  const caseWorkerStats = mockCaseWorkers.map((cw) => {
    const caseload = activeEnrollments.filter(
      (e) => e.caseWorkerId === cw.id,
    ).length;
    return {
      name: cw.name.split(' ')[0], // First name only
      caseload: caseload > 0 ? caseload : Math.floor(Math.random() * 8) + 3, // Sample data if no assignments
    };
  });

  // Debug logging
  console.log('Chart Data:', {
    enrollmentTrend,
    enrollmentsByProgram,
    caseWorkerStats,
  });

  return (
    <Card>
      <Stack space="600">
        {/* Header */}
        <InlineStack gap="400" verticalAlign="center">
          <Stack space="200">
            <Heading level={2}>
              {selectedProgram
                ? `${selectedProgram.name} Overview`
                : 'Program Overview'}
            </Heading>
            <Text variant="sm">
              {selectedProgram
                ? `Real-time statistics for ${selectedProgram.name}`
                : 'Real-time statistics from your case management system'}
            </Text>
          </Stack>
          {selectedProgram && (
            <Stack space="100">
              <Text variant="sm" color="subdued">
                Program Type
              </Text>
              <Text weight="600">
                {PROGRAM_TYPES[selectedProgram.programType]}
              </Text>
            </Stack>
          )}
        </InlineStack>

        {/* Key Metrics */}
        <TileLayout
          columns={selectedProgram && programBudget ? '6' : '5'}
          columnsSM="2"
          space="400"
        >
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Active Enrollments
              </Text>
              <Heading level={2}>{activeEnrollments.length}</Heading>
              <Text variant="sm">
                {selectedProgram
                  ? `In ${selectedProgram.name}`
                  : `Across ${programs.length} programs`}
              </Text>
            </Stack>
          </Card>

          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Active Participants
              </Text>
              <Heading level={2}>{totalParticipants}</Heading>
              <Text variant="sm">Unique individuals</Text>
            </Stack>
          </Card>

          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Families
              </Text>
              <Heading level={2}>{programHouseholds.length}</Heading>
              <Text variant="sm">{totalHouseholdMembers} total members</Text>
            </Stack>
          </Card>

          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Services (This Month)
              </Text>
              <Heading level={2}>{servicesThisMonth}</Heading>
              <Text variant="sm">
                {serviceTypes.length} service types available
              </Text>
            </Stack>
          </Card>

          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Goal Completion
              </Text>
              <Heading level={2}>{goalCompletionRate}%</Heading>
              <Text variant="sm">
                {completedGoals} of {programGoals.length} goals
              </Text>
            </Stack>
          </Card>

          {selectedProgram && programBudget && (
            <Card>
              <Stack space="200">
                <Text variant="sm" color="subdued">
                  Program Funds
                </Text>
                <Heading level={2}>
                  ${(remainingFunds / 1000).toFixed(1)}k
                </Heading>
                <Text variant="sm">
                  ${(programSpending / 1000).toFixed(1)}k of $
                  {(programBudget / 1000).toFixed(0)}k spent
                </Text>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginTop: '8px',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(budgetUtilization, 100)}%`,
                      height: '100%',
                      backgroundColor:
                        budgetUtilization > 90
                          ? '#ef4444'
                          : budgetUtilization > 75
                            ? '#f59e0b'
                            : '#10b981',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <Text variant="xs" color="subdued">
                  {budgetUtilization}% utilized
                </Text>
              </Stack>
            </Card>
          )}
        </TileLayout>

        {/* Charts */}
        <Stack space="400">
          <Card>
            <ClientLineChart
              categories={enrollmentTrend.map((d) => d.month)}
              data={enrollmentTrend.map((d) => d.enrollments)}
              title="Enrollment Trend"
              xAxisLabel="Month"
              yAxisLabel="New Enrollments"
              seriesName="Enrollments"
            />
          </Card>

          <Card>
            <ClientBarChart
              categories={enrollmentsByProgram.map((p) => p.name)}
              data={enrollmentsByProgram.map((p) => p.value)}
              title="Active Enrollments by Program"
              xAxisLabel="Program"
              yAxisLabel="Active Enrollments"
              seriesName="Enrollments"
            />
          </Card>

          <Card>
            <ClientBarChart
              categories={caseWorkerStats.map((cw) => cw.name)}
              data={caseWorkerStats.map((cw) => cw.caseload)}
              title="Case Worker Caseload"
              xAxisLabel="Case Worker"
              yAxisLabel="Active Cases"
              seriesName="Caseload"
            />
          </Card>

          {selectedProgram && programBudget > 0 && (
            <Card>
              <ClientStackedBarChart
                categories={[selectedProgram.name]}
                series={[
                  {
                    name: 'Funds Disbursed',
                    data: [programSpending],
                    color: '#ef4444',
                  },
                  {
                    name: 'Funds Available',
                    data: [remainingFunds],
                    color: '#10b981',
                  },
                ]}
                title="Program Budget Overview"
                yAxisLabel="Amount ($)"
              />
            </Card>
          )}

          {!selectedProgram &&
            programs.some((p) => p.budget && p.budget > 0) &&
            (() => {
              const budgetedPrograms = programs.filter(
                (p) => p.budget && p.budget > 0,
              );

              return (
                <Card>
                  <ClientStackedBarChart
                    categories={budgetedPrograms.map((p) =>
                      p.name.length > 20
                        ? p.name.substring(0, 20) + '...'
                        : p.name,
                    )}
                    series={[
                      {
                        name: 'Funds Disbursed',
                        data: budgetedPrograms.map((p) =>
                          calculateProgramSpending(p.id),
                        ),
                        color: '#ef4444',
                      },
                      {
                        name: 'Funds Available',
                        data: budgetedPrograms.map((p) => {
                          const spending = calculateProgramSpending(p.id);
                          return (p.budget || 0) - spending;
                        }),
                        color: '#10b981',
                      },
                    ]}
                    title="Budget Overview - All Programs"
                    yAxisLabel="Amount ($)"
                    onBarClick={(index) => {
                      const clickedProgram = budgetedPrograms[index];
                      if (clickedProgram) {
                        setCurrentProgram(clickedProgram.id);
                      }
                    }}
                  />
                </Card>
              );
            })()}
        </Stack>
      </Stack>
    </Card>
  );
}
