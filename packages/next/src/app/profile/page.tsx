'use client';

import Link from 'next/link';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
} from '@bonterratech/stitch-extension';
import { useUserStore } from '@/lib/stores/userStore';
import PageLayout from '../components/PageLayout';

export default function ProfilePage() {
  const { currentUser } = useUserStore();

  if (!currentUser) {
    return (
      <PageLayout pageTitle="Profile">
        <Card>
          <Stack space="400">
            <Heading level={2}>Not Logged In</Heading>
            <Link href="/">
              <Text color="link">Return to Home</Text>
            </Link>
          </Stack>
        </Card>
      </PageLayout>
    );
  }

  const roleLabels = {
    case_worker: 'Case Worker',
    program_manager: 'Program Manager',
    staff: 'Staff',
    super_admin: 'Super Admin',
  };

  return (
    <PageLayout pageTitle="My Profile">
      <Stack space="600">
        <Stack space="300">
          <Link href="/">
            <Text color="link">← Back to Home</Text>
          </Link>
          <Heading level={1}>My Profile</Heading>
        </Stack>

        <Card>
          <Stack space="500">
            {/* Header Section */}
            <div style={{
              backgroundColor: '#7c3aed',
              padding: '32px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <InlineStack gap="400" verticalAlign="center">
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: '32px', fontWeight: '700', color: '#7c3aed' }}>
                    {currentUser.firstName[0]}{currentUser.lastName[0]}
                  </Text>
                </div>
                <Stack space="100">
                  <Heading level={2} style={{ color: 'white' }}>
                    {currentUser.firstName} {currentUser.lastName}
                  </Heading>
                  <Text style={{ color: '#e9d5ff' }}>
                    {roleLabels[currentUser.role]}
                  </Text>
                </Stack>
              </InlineStack>
            </div>

            {/* Content Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Contact Information */}
              <Stack space="400">
                <Heading level={3}>Contact Information</Heading>
                <Stack space="300">
                  <Stack space="100">
                    <Text variant="sm" weight="600" color="subdued">Email</Text>
                    <Text>{currentUser.email}</Text>
                  </Stack>
                  {currentUser.phone && (
                    <Stack space="100">
                      <Text variant="sm" weight="600" color="subdued">Phone</Text>
                      <Text>{currentUser.phone}</Text>
                    </Stack>
                  )}
                </Stack>
              </Stack>

              {/* Account Information */}
              <Stack space="400">
                <Heading level={3}>Account Information</Heading>
                <Stack space="300">
                  <Stack space="100">
                    <Text variant="sm" weight="600" color="subdued">User ID</Text>
                    <Text style={{ fontFamily: 'monospace', fontSize: '14px' }}>{currentUser.id}</Text>
                  </Stack>
                  <Stack space="100">
                    <Text variant="sm" weight="600" color="subdued">Status</Text>
                    <Text weight="600" style={{ color: '#10b981', textTransform: 'capitalize' }}>
                      {currentUser.status}
                    </Text>
                  </Stack>
                  {currentUser.lastLoginAt && (
                    <Stack space="100">
                      <Text variant="sm" weight="600" color="subdued">Last Login</Text>
                      <Text>{currentUser.lastLoginAt.toLocaleString()}</Text>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </div>

            {/* Case Worker Profile */}
            {currentUser.caseWorkerProfile && (
              <>
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />
                <Stack space="400">
                  <Heading level={3}>Case Worker Information</Heading>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                    <Stack space="100">
                      <Text variant="sm" weight="600" color="subdued">Title</Text>
                      <Text>{currentUser.caseWorkerProfile.title}</Text>
                    </Stack>
                    <Stack space="100">
                      <Text variant="sm" weight="600" color="subdued">Current Caseload</Text>
                      <Text>{currentUser.caseWorkerProfile.currentCaseload} / {currentUser.caseWorkerProfile.maxCaseload}</Text>
                    </Stack>
                    <Stack space="100">
                      <Text variant="sm" weight="600" color="subdued">Program Access</Text>
                      <Text>
                        {currentUser.caseWorkerProfile.programIds.length === 0
                          ? 'All Programs'
                          : `${currentUser.caseWorkerProfile.programIds.length} Programs`}
                      </Text>
                    </Stack>
                  </div>
                </Stack>
              </>
            )}

            {/* Account Dates */}
            <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />
            <Stack space="300">
              <InlineStack gap="600">
                <Stack space="100">
                  <Text variant="sm" weight="600" color="subdued">Account Created</Text>
                  <Text variant="sm">{currentUser.createdAt.toLocaleDateString()}</Text>
                </Stack>
                <Stack space="100">
                  <Text variant="sm" weight="600" color="subdued">Last Updated</Text>
                  <Text variant="sm">{currentUser.updatedAt.toLocaleDateString()}</Text>
                </Stack>
              </InlineStack>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </PageLayout>
  );
}
