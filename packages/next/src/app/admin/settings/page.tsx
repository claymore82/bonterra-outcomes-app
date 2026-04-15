'use client';

import Link from 'next/link';
import {
  Card,
  Heading,
  Text,
  Stack,
  TileLayout,
  Icon,
  InlineStack,
} from '@bonterratech/stitch-extension';
import PageLayout from '../../components/PageLayout';

export default function SettingsPage() {
  return (
    <PageLayout>
      <Stack space="600">
        {/* Header */}
        <Stack space="300">
          <Link href="/">
            <Text color="link">← Back to Home</Text>
          </Link>
          <Heading level={1}>Settings</Heading>
          <Text>
            Configure programs, participants, and system-wide settings
          </Text>
        </Stack>

        {/* Data Management */}
        <Card>
          <Stack space="500">
            <InlineStack gap="300" verticalAlign="center">
              <Icon name="database" size="large" color="info" />
              <Heading level={2}>Data Management</Heading>
            </InlineStack>

            <TileLayout columns="2" columnsSM="1" space="400">
              <Link
                href="/admin/demographics"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '24px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#7C3AED';
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 8px 16px rgba(124, 58, 237, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Stack space="300">
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background:
                          'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                      }}
                    >
                      <div style={{ fontSize: '28px' }}>📋</div>
                    </div>
                    <Heading level={3}>Demographic Fields</Heading>
                    <Text variant="sm" color="subdued">
                      Configure demographics, import HMIS standards
                    </Text>
                  </Stack>
                </div>
              </Link>

              <Link
                href="/admin/touchpoint-fields"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '24px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#7C3AED';
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 8px 16px rgba(124, 58, 237, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Stack space="300">
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background:
                          'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                      }}
                    >
                      <div style={{ fontSize: '28px' }}>✨</div>
                    </div>
                    <Heading level={3}>Smart Fields</Heading>
                    <Text variant="sm" color="subdued">
                      Configure AI-detected touchpoint fields
                    </Text>
                  </Stack>
                </div>
              </Link>
            </TileLayout>
          </Stack>
        </Card>

        {/* Program Configuration */}
        <Card>
          <Stack space="500">
            <InlineStack gap="300" verticalAlign="center">
              <Icon name="briefcase" size="large" color="success" />
              <Heading level={2}>Program Configuration</Heading>
            </InlineStack>

            <TileLayout columns="3" columnsSM="1" space="400">
              <Link href="/admin/programs" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    padding: '24px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10B981';
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 8px 16px rgba(16, 185, 129, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Stack space="300">
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background:
                          'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      <div style={{ fontSize: '28px' }}>🎯</div>
                    </div>
                    <Heading level={3}>Programs</Heading>
                    <Text variant="sm" color="subdued">
                      Create and manage programs
                    </Text>
                  </Stack>
                </div>
              </Link>

              <Link href="/admin/sites" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    padding: '24px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10B981';
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 8px 16px rgba(16, 185, 129, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Stack space="300">
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background:
                          'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                      }}
                    >
                      <div style={{ fontSize: '28px' }}>📍</div>
                    </div>
                    <Heading level={3}>Sites</Heading>
                    <Text variant="sm" color="subdued">
                      Manage physical locations and sites
                    </Text>
                  </Stack>
                </div>
              </Link>

              <Link href="/admin/services" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    padding: '24px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10B981';
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 8px 16px rgba(16, 185, 129, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Stack space="300">
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background:
                          'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
                      }}
                    >
                      <div style={{ fontSize: '28px' }}>🛠️</div>
                    </div>
                    <Heading level={3}>Services</Heading>
                    <Text variant="sm" color="subdued">
                      Define service types and billing
                    </Text>
                  </Stack>
                </div>
              </Link>
            </TileLayout>
          </Stack>
        </Card>

        {/* User Management */}
        <Card>
          <Stack space="500">
            <InlineStack gap="300" verticalAlign="center">
              <Icon name="user-friends" size="large" color="warning" />
              <Heading level={2}>User Management</Heading>
            </InlineStack>

            <TileLayout columns="3" columnsSM="1" space="400">
              <Link
                href="/admin/case-workers"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '24px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#7C3AED';
                    e.currentTarget.style.backgroundColor = '#F5F3FF';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(124, 58, 237, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Stack space="300">
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="user-tie" size="large" />
                    </div>
                    <Heading level={3}>Case Workers</Heading>
                    <Text variant="sm" color="subdued">
                      Manage case workers and assignments
                    </Text>
                  </Stack>
                </div>
              </Link>
            </TileLayout>
          </Stack>
        </Card>
      </Stack>
    </PageLayout>
  );
}
