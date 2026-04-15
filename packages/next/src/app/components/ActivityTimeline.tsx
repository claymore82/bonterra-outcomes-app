'use client';

import { Card, Stack, InlineStack, Text, Icon } from '@bonterratech/stitch-extension';
import type { IconName } from '@bonterratech/stitch-extension';
import SimpleBadge from './SimpleBadge';

export interface TimelineEvent {
  id: string;
  type: 'enrollment' | 'service' | 'goal' | 'note' | 'assessment' | 'document';
  title: string;
  description: string;
  date: string;
  icon: IconName;
  color: string;
  metadata?: {
    program?: string;
    status?: string;
    [key: string]: any;
  };
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
}

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  const sortedEvents = [...events].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (events.length === 0) {
    return (
      <Stack space="300" style={{ padding: '40px', textAlign: 'center' }}>
        <Icon name="clock" size="large" />
        <Text color="subdued">No activity yet</Text>
      </Stack>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Timeline Line */}
      <div
        style={{
          position: 'absolute',
          left: '28px',
          top: '32px',
          bottom: '32px',
          width: '2px',
          background: '#E5E7EB',
        }}
      />

      <Stack space="400">
        {sortedEvents.map((event, index) => (
          <div key={event.id} style={{ position: 'relative' }}>
            {/* Timeline Dot */}
            <div
              style={{
                position: 'absolute',
                left: '0',
                top: '16px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: event.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid white',
                zIndex: 1,
              }}
            >
              <Icon name={event.icon} color="white" />
            </div>

            {/* Event Card */}
            <div style={{ marginLeft: '72px' }}>
              <Card>
                <Stack space="200">
                  <InlineStack gap="300" verticalAlign="center" distribute="space-between">
                    <Stack space="100">
                      <Text weight="600">{event.title}</Text>
                      <Text variant="sm" color="subdued">
                        {formatDate(event.date)}
                      </Text>
                    </Stack>
                    {event.metadata?.status && (
                      <SimpleBadge
                        tone={
                          event.metadata.status === 'active' || event.metadata.status === 'achieved'
                            ? 'positive'
                            : event.metadata.status === 'in-progress'
                            ? 'caution'
                            : 'neutral'
                        }
                      >
                        {event.metadata.status}
                      </SimpleBadge>
                    )}
                  </InlineStack>

                  <Text variant="sm">{event.description}</Text>

                  {event.metadata?.program && (
                    <InlineStack gap="200" verticalAlign="center">
                      <Icon name="tag" size="small" />
                      <Text variant="sm" color="subdued">
                        {event.metadata.program}
                      </Text>
                    </InlineStack>
                  )}
                </Stack>
              </Card>
            </div>
          </div>
        ))}
      </Stack>
    </div>
  );
}
