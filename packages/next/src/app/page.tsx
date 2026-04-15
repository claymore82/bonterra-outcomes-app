'use client';

import {
  Heading,
  Text,
  Stack,
  GlobalToastProvider,
} from '@bonterratech/stitch-extension';
import PageLayout from './components/PageLayout';
import ProgramDashboard from './components/ProgramDashboard';
import UpcomingCheckIns from './components/UpcomingCheckIns';

export default function Home() {
  return (
    <>
      <GlobalToastProvider />
      <PageLayout pageTitle="Bonterra Outcomes">
        <Stack space="600">
          {/* Welcome */}
          <Stack space="400">
            <Heading level={1}>Welcome to Bonterra Outcomes</Heading>
            <Text>
              Modern case management system with AI-powered intake and outcomes
              tracking
            </Text>
          </Stack>

          {/* Upcoming Check-Ins */}
          <UpcomingCheckIns />

          {/* Program Dashboard with Charts */}
          <ProgramDashboard />
        </Stack>
      </PageLayout>
    </>
  );
}
