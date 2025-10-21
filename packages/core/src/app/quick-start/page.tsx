'use client';

import {
  Button,
  Heading,
  Text,
  Stack,
  InlineStack,
} from '@bonterratech/stitch-extension';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/pro-regular-svg-icons';
import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { coreTokens as $ } from '@bonterratech/stitch-tokens/coreTokens.stylex';
import PageLayout from '../components/PageLayout';
import { EXTERNAL_URLS } from '../constants';

interface CopyCodeProps {
  code: string;
}

function CopyCode({ code }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <InlineStack gap="200" verticalAlign="center">
      <code {...stylex.props(styles.codeBlock)}>{code}</code>
      <FontAwesomeIcon
        icon={faCopy}
        {...stylex.props(styles.copyIcon, copied && styles.copyIconCopied)}
        onClick={copyToClipboard}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      />
    </InlineStack>
  );
}

const styles = stylex.create({
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
});

const numberStyle = {
  minWidth: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: '#3b82f6',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: '600',
  flexShrink: 0,
};

export default function QuickStart() {
  return (
    <PageLayout pageTitle="Quick Start">
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
        <Stack space="600">
          <Stack space="400" horizontalAlign="center">
            <Heading level={1}>Quick Start</Heading>
            <Text>Get up and running with Bonstart in just a few steps.</Text>
          </Stack>

          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '32px',
              width: 'min(800px, 100vw - 4rem)',
              margin: '0 auto',
            }}
          >
            <Stack space="600" horizontalAlign="center">
              <Heading level={2}>Setup Steps</Heading>
              <Stack space="400" horizontalAlign="start">
                <InlineStack gap="300" verticalAlign="start">
                  <div style={numberStyle}>1</div>
                  <Stack space="100">
                    <Text weight="600">Install dependencies:</Text>
                    <CopyCode code="npm install" />
                  </Stack>
                </InlineStack>

                <InlineStack gap="300" verticalAlign="start">
                  <div style={numberStyle}>2</div>
                  <Stack space="100">
                    <Text weight="600">Configure your project:</Text>
                    <CopyCode code="npm run bonstart:init" />
                  </Stack>
                </InlineStack>

                <InlineStack gap="300" verticalAlign="start">
                  <div style={numberStyle}>3</div>
                  <Stack space="100">
                    <Text weight="600">Start developing:</Text>
                    <CopyCode code="npm run dev" />
                  </Stack>
                </InlineStack>

                <InlineStack gap="300" verticalAlign="start">
                  <div style={numberStyle}>4</div>
                  <Stack space="100">
                    <Text weight="600">Deploy to AWS:</Text>
                    <CopyCode code="npm run sst:deploy" />
                  </Stack>
                </InlineStack>
              </Stack>

              <InlineStack gap="400" horizontalAlign="center">
                <Button
                  variant="primary"
                  onPress={() =>
                    window.open(EXTERNAL_URLS.BONSTART_REPO, '_blank')
                  }
                >
                  Get Started
                </Button>
                <Button
                  variant="subtle"
                  onPress={() =>
                    window.open(EXTERNAL_URLS.BONSTART_DOCS, '_blank')
                  }
                >
                  View Docs
                </Button>
              </InlineStack>
            </Stack>
          </div>
        </Stack>
      </div>
    </PageLayout>
  );
}
