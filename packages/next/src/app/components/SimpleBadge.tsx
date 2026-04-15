'use client';

import { Text } from '@bonterratech/stitch-extension';

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'positive' | 'caution' | 'critical' | 'neutral' | 'info';
}

export default function SimpleBadge({
  children,
  tone = 'neutral',
}: BadgeProps) {
  const colors = {
    positive: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
    caution: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
    critical: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
    neutral: { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
    info: { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
  };

  const style = colors[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '12px',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        fontSize: '12px',
        fontWeight: '500',
        lineHeight: '20px',
      }}
    >
      {children}
    </span>
  );
}
