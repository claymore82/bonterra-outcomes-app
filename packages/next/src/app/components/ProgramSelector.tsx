'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Text,
  InlineStack,
  Icon,
} from '@bonterratech/stitch-extension';
import { useUserStore } from '@/lib/stores/userStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';

export default function ProgramSelector() {
  const { currentUser, currentProgramId, setCurrentProgram } = useUserStore();
  const { programs } = useProgramStore();
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

  // Filter programs based on user's access
  const availablePrograms = currentUser.caseWorkerProfile?.programIds.length
    ? programs.filter(p => currentUser.caseWorkerProfile!.programIds.includes(p.id))
    : programs;

  const currentProgram = currentProgramId
    ? programs.find(p => p.id === currentProgramId)
    : null;

  const activeEnrollmentCount = currentProgram
    ? getActiveEnrollments().filter(e => e.programId === currentProgram.id).length
    : getActiveEnrollments().length;

  const displayText = currentProgram ? currentProgram.name : 'All Programs';

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
              setCurrentProgram(null);
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              textAlign: 'left',
              border: 'none',
              background: currentProgramId === null ? '#f3f4f6' : 'white',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentProgramId === null ? '#f3f4f6' : 'white')}
          >
            <InlineStack gap="300" verticalAlign="center">
              <Text variant="sm" weight={currentProgramId === null ? '600' : '400'}>
                All Programs
              </Text>
              {currentProgramId === null && (
                <Text variant="sm" color="subdued">
                  ({activeEnrollmentCount} active)
                </Text>
              )}
            </InlineStack>
          </button>
          {availablePrograms.map((program) => {
            const isSelected = currentProgramId === program.id;
            const programActiveCount = getActiveEnrollments().filter(e => e.programId === program.id).length;

            return (
              <button
                key={program.id}
                onClick={() => {
                  setCurrentProgram(program.id);
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
                    {program.name}
                  </Text>
                  <Text variant="sm" color="subdued">
                    ({programActiveCount} active)
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
