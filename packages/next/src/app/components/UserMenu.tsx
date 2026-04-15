'use client';

import { useState, useRef, useEffect } from 'react';
import { useUserStore } from '@/lib/stores/userStore';
import Link from 'next/link';
import {
  Text,
  InlineStack,
  Stack,
  Icon,
  Divider,
} from '@bonterratech/stitch-extension';

export default function UserMenu() {
  const { currentUser } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const roleLabels = {
    case_worker: 'Case Worker',
    program_manager: 'Program Manager',
    staff: 'Staff',
    super_admin: 'Super Admin',
  };

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          height: 'fit-content',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: '#7c3aed',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>
            {currentUser.firstName[0]}{currentUser.lastName[0]}
          </Text>
        </div>
        <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
          <Text variant="sm" weight="500" style={{ fontSize: '13px' }}>
            {currentUser.firstName} {currentUser.lastName}
          </Text>
          <Text variant="sm" color="subdued" style={{ fontSize: '11px' }}>
            {roleLabels[currentUser.role]}
          </Text>
        </div>
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
            marginTop: '8px',
            width: '256px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            padding: '8px 0',
            zIndex: 9999,
          }}
        >
          {/* Personal Section */}
          <div style={{ padding: '8px 12px' }}>
            <Text variant="sm" color="subdued" weight="600" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Personal
            </Text>
          </div>
          <Link
            href="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              textDecoration: 'none',
              color: '#374151',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => setIsOpen(false)}
          >
            <Icon name="user" size="small" />
            <Text variant="sm">My Profile</Text>
          </Link>
          <Link
            href="/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              textDecoration: 'none',
              color: '#374151',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => setIsOpen(false)}
          >
            <Icon name="cog" size="small" />
            <Text variant="sm">My Settings</Text>
          </Link>

          {/* Admin Section - Only for program managers and admins */}
          {(currentUser.role === 'program_manager' || currentUser.role === 'super_admin') && (
            <>
              <div style={{ margin: '8px 0' }}>
                <Divider />
              </div>
              <div style={{ padding: '8px 12px' }}>
                <Text variant="sm" color="subdued" weight="600" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Administration
                </Text>
              </div>
              <Link
                href="/admin/settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 16px',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => setIsOpen(false)}
              >
                <Icon name="sliders-h" size="small" />
                <Text variant="sm">Global Settings</Text>
              </Link>
              <Link
                href="/admin/programs"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 16px',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => setIsOpen(false)}
              >
                <Icon name="briefcase" size="small" />
                <Text variant="sm">Manage Programs</Text>
              </Link>
              <Link
                href="/admin/case-workers"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 16px',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => setIsOpen(false)}
              >
                <Icon name="user-tie" size="small" />
                <Text variant="sm">Manage Case Workers</Text>
              </Link>
            </>
          )}

          <div style={{ margin: '8px 0' }}>
            <Divider />
          </div>
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#dc2626',
              fontSize: '14px',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => {
              // TODO: Implement logout
              alert('Logout functionality coming soon');
              setIsOpen(false);
            }}
          >
            <Icon name="sign-out-alt" size="small" />
            <Text variant="sm" style={{ color: '#dc2626' }}>Sign Out</Text>
          </button>
        </div>
      )}
    </div>
  );
}
