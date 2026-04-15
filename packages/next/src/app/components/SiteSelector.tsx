'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Text,
  InlineStack,
  Icon,
} from '@bonterratech/stitch-extension';
import { useUserStore } from '@/lib/stores/userStore';
import { useSiteStore } from '@/lib/stores/siteStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';

export default function SiteSelector() {
  const { currentUser, currentSiteId, setCurrentSite } = useUserStore();
  const { sites } = useSiteStore();
  const { getActiveEnrollments } = useEnrollmentStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!currentUser) return null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeSites = sites.filter(s => s.active);

  const currentSite = currentSiteId
    ? sites.find(s => s.id === currentSiteId)
    : null;

  const activeEnrollmentCount = currentSite
    ? getActiveEnrollments().filter(e => e.siteId === currentSite.id).length
    : getActiveEnrollments().length;

  const displayText = currentSite ? currentSite.name : 'All Sites';

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
          height: 'fit-content',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Text variant="sm" weight="500" style={{ fontSize: '15px' }}>
          {displayText}
        </Text>
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size="small"
          style={{ color: '#6b7280' }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '4px',
            width: '280px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 9999,
          }}
        >
          <button
            onClick={() => {
              setCurrentSite(null);
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              textAlign: 'left',
              border: 'none',
              background: currentSiteId === null ? '#f3f4f6' : 'white',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentSiteId === null ? '#f3f4f6' : 'white')}
          >
            <InlineStack gap="300" verticalAlign="center">
              <Text variant="sm" weight={currentSiteId === null ? '600' : '400'}>
                All Sites
              </Text>
              {currentSiteId === null && (
                <Text variant="sm" color="subdued">
                  ({activeEnrollmentCount} active)
                </Text>
              )}
            </InlineStack>
          </button>
          {activeSites.map((site) => {
            const isSelected = currentSiteId === site.id;
            const siteActiveCount = getActiveEnrollments().filter(e => e.siteId === site.id).length;

            return (
              <button
                key={site.id}
                onClick={() => {
                  setCurrentSite(site.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  textAlign: 'left',
                  border: 'none',
                  background: isSelected ? '#f3f4f6' : 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#f3f4f6' : 'white')}
              >
                <InlineStack gap="300" verticalAlign="center">
                  <Text variant="sm" weight={isSelected ? '600' : '400'}>
                    {site.name}
                  </Text>
                  <Text variant="sm" color="subdued">
                    ({siteActiveCount} active)
                  </Text>
                </InlineStack>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
