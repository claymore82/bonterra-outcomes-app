'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Button,
  Switch,
  Icon,
} from '@bonterratech/stitch-extension';
import { useUserStore } from '@/lib/stores/userStore';
import PageLayout from '../components/PageLayout';

export default function UserSettingsPage() {
  const { currentUser } = useUserStore();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');

  if (!currentUser) {
    return (
      <PageLayout pageTitle="Settings">
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

  const handleSave = () => {
    // TODO: Implement save functionality
    alert('Settings saved successfully!');
  };

  return (
    <PageLayout pageTitle="My Settings">
      <Stack space="600">
        {/* Header */}
        <Stack space="300">
          <Link href="/">
            <Text color="link">← Back to Home</Text>
          </Link>
          <Heading level={1}>My Settings</Heading>
          <Text>Manage your personal preferences and notifications</Text>
        </Stack>

        {/* Notifications Settings */}
        <Card>
          <Stack space="400">
            <Heading level={2}>Notifications</Heading>
            <Stack space="400">
              <InlineStack gap="400" verticalAlign="center">
                <Stack space="100" style={{ flex: 1 }}>
                  <Text weight="600">Email Notifications</Text>
                  <Text variant="sm" color="subdued">
                    Receive email updates about your cases
                  </Text>
                </Stack>
                <Switch
                  isSelected={emailNotifications}
                  onChange={setEmailNotifications}
                  aria-label="Email Notifications"
                />
              </InlineStack>

              <InlineStack gap="400" verticalAlign="center">
                <Stack space="100" style={{ flex: 1 }}>
                  <Text weight="600">Push Notifications</Text>
                  <Text variant="sm" color="subdued">
                    Receive browser notifications for urgent updates
                  </Text>
                </Stack>
                <Switch
                  isSelected={pushNotifications}
                  onChange={setPushNotifications}
                  aria-label="Push Notifications"
                />
              </InlineStack>

              <InlineStack gap="400" verticalAlign="center">
                <Stack space="100" style={{ flex: 1 }}>
                  <Text weight="600">Weekly Reports</Text>
                  <Text variant="sm" color="subdued">
                    Receive weekly summary of your caseload
                  </Text>
                </Stack>
                <Switch
                  isSelected={weeklyReports}
                  onChange={setWeeklyReports}
                  aria-label="Weekly Reports"
                />
              </InlineStack>
            </Stack>
          </Stack>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <Stack space="400">
            <Heading level={2}>Appearance</Heading>
            <Stack space="300">
              <Text weight="600">Theme</Text>
              <InlineStack gap="400">
                <Button
                  variant={theme === 'light' ? 'primary' : 'secondary'}
                  onPress={() => setTheme('light')}
                >
                  <InlineStack gap="200" verticalAlign="center">
                    <Icon name="sun" size="small" />
                    <Text>Light</Text>
                  </InlineStack>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'primary' : 'secondary'}
                  onPress={() => setTheme('dark')}
                >
                  <InlineStack gap="200" verticalAlign="center">
                    <Icon name="moon" size="small" />
                    <Text>Dark</Text>
                  </InlineStack>
                </Button>
                <Button
                  variant={theme === 'auto' ? 'primary' : 'secondary'}
                  onPress={() => setTheme('auto')}
                >
                  <InlineStack gap="200" verticalAlign="center">
                    <Icon name="cog" size="small" />
                    <Text>Auto</Text>
                  </InlineStack>
                </Button>
              </InlineStack>
            </Stack>
          </Stack>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <Stack space="400">
            <Heading level={2}>Privacy & Security</Heading>
            <Stack space="300">
              <Link
                href="/settings/password"
                style={{ textDecoration: 'none' }}
              >
                <InlineStack gap="400" verticalAlign="center">
                  <Icon name="key" size="medium" />
                  <Stack space="100" style={{ flex: 1 }}>
                    <Text weight="600">Change Password</Text>
                    <Text variant="sm" color="subdued">
                      Update your password
                    </Text>
                  </Stack>
                  <Icon name="chevron-right" size="small" />
                </InlineStack>
              </Link>

              <button
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <InlineStack gap="400" verticalAlign="center">
                  <Icon name="lock" size="medium" />
                  <Stack space="100" style={{ flex: 1 }}>
                    <Text weight="600">Two-Factor Authentication</Text>
                    <Text variant="sm" color="subdued">
                      Not enabled
                    </Text>
                  </Stack>
                  <Icon name="chevron-right" size="small" />
                </InlineStack>
              </button>
            </Stack>
          </Stack>
        </Card>

        {/* Save Button */}
        <InlineStack gap="400">
          <Link href="/">
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button variant="primary" onPress={handleSave}>
            Save Changes
          </Button>
        </InlineStack>
      </Stack>
    </PageLayout>
  );
}
