"use client";

import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import {
  Button,
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Link,
  GlobalToastProvider,
  toastQueue
} from "@bonterratech/stitch-extension";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/pro-regular-svg-icons';
import { coreTokens as $ } from '@bonterratech/stitch-tokens/coreTokens.stylex';

interface CopyCodeProps {
  code: string;
}

function CopyCode({ code }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Show toast notification
    toastQueue.add({
      title: 'Copied to clipboard!',
      description: code,
      variant: 'success'
    });
  };

  return (
    <InlineStack gap="200" verticalAlign="center">
      <code {...stylex.props(styles.codeBlock)}>{code}</code>
      <FontAwesomeIcon
        icon={faCopy}
        {...stylex.props(styles.copyIcon, copied && styles.copyIconCopied)}
        onClick={copyToClipboard}
        title={copied ? "Copied!" : "Copy to clipboard"}
      />
    </InlineStack>
  );
}

const styles = stylex.create({
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(8px)',
  },
  headerContainer: {
    maxWidth: '80rem',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${$['--s-space-400']} ${$['--s-space-600']}`,
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#111827',
  },
  version: {
    borderRadius: '9999px',
    backgroundColor: '#dbeafe',
    padding: '0.125rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#1d4ed8',
  },
  mainContainer: {
    display: 'flex',
    minHeight: 'calc(100vh - 73px)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${$['--s-space-600']} ${$['--s-space-400']}`,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: '48rem',
  },
  warningIcon: {
    fontSize: '3.75rem',
    marginTop: $['--s-space-400'],
  },
  warningIconInline: {
    fontSize: '2rem',
  },
  stepNumber: {
    height: '1.5rem',
    width: '1.5rem',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    backgroundColor: '#dbeafe',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#2563eb',
  },
  stepNumberSmall: {
    height: '1.25rem',
    width: '1.25rem',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    backgroundColor: '#dbeafe',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#2563eb',
  },
  stepNumberMedium: {
    height: '1.375rem',
    width: '1.375rem',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    backgroundColor: '#dbeafe',
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: '#2563eb',
  },
  codeBlock: {
    borderRadius: $['--s-border-radius-sm'],
    backgroundColor: '#f3f4f6',
    padding: `${$['--s-space-200']} ${$['--s-space-300']}`,
    fontSize: $['--s-font-size-100'],
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    border: '1px solid #e5e7eb',
    display: 'inline-block',
  },
  copyIcon: {
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    width: '16px',
    height: '16px',
    ':hover': {
      color: '#374151',
      transform: 'scale(1.1)',
    },
    ':active': {
      transform: 'scale(0.95)',
    },
  },
  copyIconCopied: {
    color: '#059669',
    transform: 'scale(1.1)',
  },
  featureIcon: {
    height: '2rem',
    width: '2rem',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: $['--s-border-radius-sm'],
    backgroundColor: '#eff6ff',
  },
  grid: {
    display: 'grid',
    gap: $['--s-space-600'],
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  },
  enhancedCard: {
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    borderWidth: 0,
  },
  warningCard: {
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    borderWidth: 0,
    padding: $['--s-space-800'],
  },
  quickStartCard: {
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    borderWidth: 0,
    padding: $['--s-space-800'],
  },
});

export default function Home() {
  return (
    <div {...stylex.props(styles.page)}>
      <GlobalToastProvider />
      {/* Header */}
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.headerContainer)}>
          <InlineStack gap="200" verticalAlign="center">
            <div {...stylex.props(styles.logo)}>Bonstart</div>
            <span {...stylex.props(styles.version)}>v2.0</span>
          </InlineStack>
          <InlineStack gap="600" verticalAlign="center">
            <Link
              href="https://github.com/bonterratech/bonstart/tree/main/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </Link>
            <Link
              href="https://github.com/bonterratech/bonstart"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Link>
          </InlineStack>
        </div>
      </header>

      {/* Main Content */}
      <div {...stylex.props(styles.mainContainer)}>
        <div {...stylex.props(styles.contentWrapper)}>
          <Stack space="500">
            {/* Warning Section */}
            <Card {...stylex.props(styles.warningCard)}>
              <Stack space="500" horizontalAlign="center">
                <InlineStack gap="300" verticalAlign="center" horizontalAlign="center">
                  <div {...stylex.props(styles.warningIconInline)}>⚠️</div>
                  <Heading level={1}>Setup Required</Heading>
                </InlineStack>
                <Text variant="lg">
                  Configure this template to get started with your new project
                </Text>
                <CopyCode code="npm run bonstart:init" />
              </Stack>
            </Card>

            {/* Quick Start Card */}
            <Card {...stylex.props(styles.quickStartCard)}>
              <Stack space="600" horizontalAlign="center">
                <Heading level={2}>Quick Start</Heading>
                <Stack space="400">
                  <InlineStack gap="300" verticalAlign="start">
                    <div {...stylex.props(styles.stepNumberMedium)}>1</div>
                    <Stack space="200">
                      <Text><strong>Install dependencies:</strong></Text>
                      <CopyCode code="npm install" />
                    </Stack>
                  </InlineStack>

                  <InlineStack gap="300" verticalAlign="start">
                    <div {...stylex.props(styles.stepNumberMedium)}>2</div>
                    <Stack space="200">
                      <Text><strong>Configure your project:</strong></Text>
                      <CopyCode code="npm run bonstart:init" />
                    </Stack>
                  </InlineStack>

                  <InlineStack gap="300" verticalAlign="start">
                    <div {...stylex.props(styles.stepNumberMedium)}>3</div>
                    <Stack space="200">
                      <Text><strong>Start developing:</strong></Text>
                      <CopyCode code="npm run dev" />
                    </Stack>
                  </InlineStack>

                  <InlineStack gap="300" verticalAlign="start">
                    <div {...stylex.props(styles.stepNumberMedium)}>4</div>
                    <Stack space="200">
                      <Text><strong>Deploy to AWS:</strong></Text>
                      <CopyCode code="npm run sst:deploy" />
                    </Stack>
                  </InlineStack>
                </Stack>

                <InlineStack gap="300" horizontalAlign="center">
                  <Button
                    variant="primary"
                    onPress={() => window.open('https://github.com/bonterratech/bonstart', '_blank')}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="subtle"
                    onPress={() => window.open('https://github.com/bonterratech/bonstart/tree/main/docs', '_blank')}
                  >
                    View Docs
                  </Button>
                </InlineStack>
              </Stack>
            </Card>

            {/* Features Section */}
            <Card {...stylex.props(styles.enhancedCard)}>
              <Stack space="600" horizontalAlign="center">
                <Heading level={2}>What's Included</Heading>
                <div {...stylex.props(styles.grid)}>
                  <InlineStack gap="300" verticalAlign="start">
                    <div {...stylex.props(styles.featureIcon)}>⚡</div>
                    <Stack space="100">
                      <Text weight="600">SST v3</Text>
                      <Text variant="sm">Modern infrastructure as code for AWS</Text>
                    </Stack>
                  </InlineStack>

                  <InlineStack gap="300" verticalAlign="start">
                    <div {...stylex.props(styles.featureIcon)}>⚛️</div>
                    <Stack space="100">
                      <Text weight="600">Next.js 15</Text>
                      <Text variant="sm">React framework with App Router</Text>
                    </Stack>
                  </InlineStack>

                  <InlineStack gap="300" verticalAlign="start">
                    <div {...stylex.props(styles.featureIcon)}>🎨</div>
                    <Stack space="100">
                      <Text weight="600">Stitch Design System</Text>
                      <Text variant="sm">Bonterra's design system</Text>
                    </Stack>
                  </InlineStack>

                  <InlineStack gap="300" verticalAlign="start">
                    <div {...stylex.props(styles.featureIcon)}>📘</div>
                    <Stack space="100">
                      <Text weight="600">TypeScript</Text>
                      <Text variant="sm">Full type safety and better DX</Text>
                    </Stack>
                  </InlineStack>

                  <InlineStack gap="300" verticalAlign="start">
                    <div {...stylex.props(styles.featureIcon)}>📝</div>
                    <Stack space="100">
                      <Text weight="600">ITD Documentation</Text>
                      <Text variant="sm">Architecture decision templates</Text>
                    </Stack>
                  </InlineStack>

                  <InlineStack gap="300" verticalAlign="start">
                    <div {...stylex.props(styles.featureIcon)}>✨</div>
                    <Stack space="100">
                      <Text weight="600">ESLint + Prettier</Text>
                      <Text variant="sm">Code quality and formatting</Text>
                    </Stack>
                  </InlineStack>
                </div>
              </Stack>
            </Card>

            {/* Footer */}
            <Stack horizontalAlign="center">
              <Text variant="sm">Bonterra Bonstart Template</Text>
            </Stack>
          </Stack>
        </div>
      </div>
    </div>
  );
}