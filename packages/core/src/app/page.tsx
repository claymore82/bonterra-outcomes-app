"use client";

import * as stylex from '@stylexjs/stylex';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Link,
  GlobalToastProvider,
  TileLayout,
  Icon
} from "@bonterratech/stitch-extension";
import PageLayout from './components/PageLayout';
import { EXTERNAL_URLS } from './constants';
import { cardStyles } from './sharedStyles';

export default function Home() {
  return (
    <>
      <GlobalToastProvider />
      <PageLayout>
        <div {...stylex.props(cardStyles.maxWidth)}>
          <Stack space="600">
          {/* Welcome */}
          <Stack space="400">
            <Heading level={1}>Welcome to Bonstart</Heading>
            <Text>Platform starter template with Stitch design system. Get started by configuring your project and exploring the available resources.</Text>
          </Stack>

          {/* Setup Warning */}
          <Card>
            <Stack space="400">
              <InlineStack gap="200" verticalAlign="center">
                <Text>⚠️</Text>
                <Heading level={2}>Setup Required</Heading>
              </InlineStack>
              <Text>Configure this template to get started with your new project</Text>
              <code {...stylex.props(cardStyles.codeBlock)}>npm run bonstart:init</code>
            </Stack>
          </Card>

          {/* Features */}
          <Card>
            <Stack space="400">
              <Heading level={2}>What's Included</Heading>
              <TileLayout columns="2" columnsSM="1" space="400">
                <Stack space="200">
                  <Text weight="600">⚡ SST v3</Text>
                  <Text variant="sm">Modern infrastructure as code for AWS</Text>
                </Stack>
                <Stack space="200">
                  <Text weight="600">⚛️ Next.js 15</Text>
                  <Text variant="sm">React framework with App Router</Text>
                </Stack>
                <Stack space="200">
                  <Text weight="600">🎨 Stitch Design System</Text>
                  <Text variant="sm">Bonterra's design system</Text>
                </Stack>
                <Stack space="200">
                  <Text weight="600">📘 TypeScript</Text>
                  <Text variant="sm">Full type safety and better DX</Text>
                </Stack>
                <Stack space="200">
                  <Text weight="600">📝 ITD Documentation</Text>
                  <Text variant="sm">Architecture decision templates</Text>
                </Stack>
                <Stack space="200">
                  <Text weight="600">✨ ESLint + Prettier</Text>
                  <Text variant="sm">Code quality and formatting</Text>
                </Stack>
              </TileLayout>
            </Stack>
          </Card>

          {/* Resources */}
          <Card>
            <Stack space="400">
              <Heading level={2}>Resources</Heading>
              <Stack space="300">
                <InlineStack gap="300" verticalAlign="center">
                  <Icon name="bookmark" size="medium" color="info" />
                  <Stack space="100">
                    <Link
                      href={EXTERNAL_URLS.BONSTART_DOCS}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Text weight="600">Documentation</Text>
                    </Link>
                    <Text variant="sm">Complete setup guides and architecture decisions</Text>
                  </Stack>
                </InlineStack>
                <InlineStack gap="300" verticalAlign="center">
                  <Icon name="arrow-up-right-from-square" size="medium" color="link" />
                  <Stack space="100">
                    <Link
                      href={EXTERNAL_URLS.BONSTART_REPO}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Text weight="600">GitHub Repository</Text>
                    </Link>
                    <Text variant="sm">Source code, issues, and contributions</Text>
                  </Stack>
                </InlineStack>
                <InlineStack gap="300" verticalAlign="center">
                  <Icon name="paper-plane" size="medium" color="success" />
                  <Stack space="100">
                    <Link href="/quick-start">
                      <Text weight="600">Quick Start Guide</Text>
                    </Link>
                    <Text variant="sm">Step-by-step setup instructions</Text>
                  </Stack>
                </InlineStack>
              </Stack>
            </Stack>
          </Card>
          </Stack>
        </div>
      </PageLayout>
    </>
  );
}