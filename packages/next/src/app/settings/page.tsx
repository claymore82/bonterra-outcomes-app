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
  Icon,
} from '@bonterratech/stitch-extension';
import { useUserStore } from '@/lib/stores/userStore';
import PageLayout from '../components/PageLayout';

// Simple Toggle Switch Component
function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '48px',
        height: '24px',
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        style={{
          opacity: 0,
          width: 0,
          height: 0,
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? '#7c3aed' : '#d1d5db',
          borderRadius: '24px',
          transition: 'background-color 0.2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            content: '',
            height: '18px',
            width: '18px',
            left: checked ? '26px' : '3px',
            bottom: '3px',
            backgroundColor: 'white',
            borderRadius: '50%',
            transition: 'left 0.2s',
          }}
        />
      </span>
    </label>
  );
}

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
                <ToggleSwitch
                  checked={emailNotifications}
                  onChange={setEmailNotifications}
                  label="Email Notifications"
                />
              </InlineStack>

              <InlineStack gap="400" verticalAlign="center">
                <Stack space="100" style={{ flex: 1 }}>
                  <Text weight="600">Push Notifications</Text>
                  <Text variant="sm" color="subdued">
                    Receive browser notifications for urgent updates
                  </Text>
                </Stack>
                <ToggleSwitch
                  checked={pushNotifications}
                  onChange={setPushNotifications}
                  label="Push Notifications"
                />
              </InlineStack>

              <InlineStack gap="400" verticalAlign="center">
                <Stack space="100" style={{ flex: 1 }}>
                  <Text weight="600">Weekly Reports</Text>
                  <Text variant="sm" color="subdued">
                    Receive weekly summary of your caseload
                  </Text>
                </Stack>
                <ToggleSwitch
                  checked={weeklyReports}
                  onChange={setWeeklyReports}
                  label="Weekly Reports"
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
