'use client';

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
import { Enrollment, Program } from '@/types/poc';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useUserStore } from '@/lib/stores/userStore';
import { useRouter } from 'next/navigation';

interface CompleteEnrollmentModalProps {
  enrollment: Enrollment;
  participantName: string;
  currentProgramName: string;
  onClose: () => void;
}

type ActionType = 'complete' | 'dismiss' | 'transfer';

const DISMISSAL_REASONS = [
  'Left program early',
  'Did not meet program requirements',
  'Moved out of area',
  'No longer interested',
  'Deceased',
  'Incarcerated',
  'Unable to contact',
  'Other (specify below)',
];

export default function CompleteEnrollmentModal({
  enrollment,
  participantName,
  currentProgramName,
  onClose,
}: CompleteEnrollmentModalProps) {
  const router = useRouter();
  const { completeEnrollment, dismissEnrollment, transferEnrollment } =
    useEnrollmentStore();
  const { programs } = useProgramStore();
  const { users } = useUserStore();

  const [actionType, setActionType] = useState<ActionType>('complete');
  const [outcomes, setOutcomes] = useState<string>('');
  const [dismissalReason, setDismissalReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [transferProgramId, setTransferProgramId] = useState<string>('');
  const [transferCaseWorkerId, setTransferCaseWorkerId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available programs (excluding current program)
  const availablePrograms = programs.filter(
    (p) => p.id !== enrollment.programId && p.active,
  );

  // Get case workers
  const caseWorkers = users.filter(
    (u) => u.role === 'case_worker' && u.status === 'active',
  );

  // Get case workers for selected transfer program
  const availableCaseWorkers = transferProgramId
    ? caseWorkers.filter((cw) => {
        if (!cw.caseWorkerProfile) return false;
        // If programIds is empty, case worker works with all programs
        if (cw.caseWorkerProfile.programIds.length === 0) return true;
        return cw.caseWorkerProfile.programIds.includes(transferProgramId);
      })
    : caseWorkers;

  const handleSubmit = () => {
    setIsSubmitting(true);

    try {
      if (actionType === 'complete') {
        // Complete successfully
        const outcomesList = outcomes
          .split('\n')
          .map((o) => o.trim())
          .filter((o) => o.length > 0);

        completeEnrollment(enrollment.id, outcomesList);
        alert(
          `✅ Success!\n\n${participantName} has successfully completed ${currentProgramName}.`,
        );
      } else if (actionType === 'dismiss') {
        // Dismiss enrollment
        const reason =
          dismissalReason === 'Other (specify below)'
            ? customReason
            : dismissalReason;

        if (!reason) {
          alert('Please select or enter a dismissal reason.');
          setIsSubmitting(false);
          return;
        }

        const outcomesList = outcomes
          .split('\n')
          .map((o) => o.trim())
          .filter((o) => o.length > 0);

        dismissEnrollment(enrollment.id, reason, outcomesList);
        alert(`Enrollment dismissed.\n\nReason: ${reason}`);
      } else if (actionType === 'transfer') {
        // Transfer to another program
        if (!transferProgramId || !transferCaseWorkerId) {
          alert(
            'Please select both a program and a case worker for the transfer.',
          );
          setIsSubmitting(false);
          return;
        }

        const transferProgram = programs.find(
          (p) => p.id === transferProgramId,
        );
        const reason = transferReason || `Referred to ${transferProgram?.name}`;

        transferEnrollment(
          enrollment.id,
          transferProgramId,
          transferCaseWorkerId,
          reason,
        );
        alert(
          `✅ Referral Success!\n\n${participantName} has been referred to ${transferProgram?.name}.\n\nA new active enrollment has been created in the new program.`,
        );
      }

      onClose();
      // Refresh the page to show updated enrollment status
      router.refresh();
    } catch (error) {
      console.error('Error updating enrollment:', error);
      alert('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card
        style={{
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <Stack space="500">
          {/* Header */}
          <InlineStack
            gap="400"
            verticalAlign="center"
            distribute="space-between"
          >
            <Heading level={2}>Complete Enrollment</Heading>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <Icon name="times" size="medium" />
            </button>
          </InlineStack>

          <Text color="subdued">
            {participantName} - {currentProgramName}
          </Text>

          {/* Action Type Selection */}
          <Stack space="300">
            <Text weight="600">What would you like to do?</Text>
            <Stack space="200">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="actionType"
                  value="complete"
                  checked={actionType === 'complete'}
                  onChange={(e) => setActionType(e.target.value as ActionType)}
                  style={{ width: '18px', height: '18px' }}
                />
                <Stack space="50">
                  <Text weight="600">✅ Complete Successfully</Text>
                  <Text variant="sm" color="subdued">
                    Participant achieved program goals and is graduating
                  </Text>
                </Stack>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="actionType"
                  value="dismiss"
                  checked={actionType === 'dismiss'}
                  onChange={(e) => setActionType(e.target.value as ActionType)}
                  style={{ width: '18px', height: '18px' }}
                />
                <Stack space="50">
                  <Text weight="600">❌ Dismiss</Text>
                  <Text variant="sm" color="subdued">
                    End enrollment before completion (left early, didn't meet
                    requirements, etc.)
                  </Text>
                </Stack>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="actionType"
                  value="transfer"
                  checked={actionType === 'transfer'}
                  onChange={(e) => setActionType(e.target.value as ActionType)}
                  style={{ width: '18px', height: '18px' }}
                />
                <Stack space="50">
                  <Text weight="600">🔄 Refer to Another Program</Text>
                  <Text variant="sm" color="subdued">
                    Transfer to a different program (e.g., graduated, now needs
                    job training)
                  </Text>
                </Stack>
              </label>
            </Stack>
          </Stack>

          {/* Complete Form */}
          {actionType === 'complete' && (
            <Stack space="300">
              <Stack space="200">
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Outcomes Achieved (one per line)
                </label>
                <textarea
                  value={outcomes}
                  onChange={(e) => setOutcomes(e.target.value)}
                  placeholder="Secured permanent housing&#10;Found full-time employment&#10;Completed training program&#10;Built emergency savings"
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
                <Text variant="sm" color="subdued">
                  List the outcomes and goals this participant achieved during
                  the program
                </Text>
              </Stack>
            </Stack>
          )}

          {/* Dismiss Form */}
          {actionType === 'dismiss' && (
            <Stack space="300">
              <Stack space="200">
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Reason for Dismissal *
                </label>
                <select
                  value={dismissalReason}
                  onChange={(e) => setDismissalReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select a reason...</option>
                  {DISMISSAL_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </Stack>

              {dismissalReason === 'Other (specify below)' && (
                <Stack space="200">
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    Custom Reason *
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Specify the reason for dismissal"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </Stack>
              )}

              <Stack space="200">
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Partial Outcomes (optional)
                </label>
                <textarea
                  value={outcomes}
                  onChange={(e) => setOutcomes(e.target.value)}
                  placeholder="Any progress or partial goals achieved before dismissal (optional)"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </Stack>
            </Stack>
          )}

          {/* Transfer Form */}
          {actionType === 'transfer' && (
            <Stack space="300">
              <Stack space="200">
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Refer to Program *
                </label>
                <select
                  value={transferProgramId}
                  onChange={(e) => setTransferProgramId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select a program...</option>
                  {availablePrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                <Text variant="sm" color="subdued">
                  The participant will be enrolled in the new program
                  immediately
                </Text>
              </Stack>

              {transferProgramId && (
                <Stack space="200">
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    Assign Case Worker *
                  </label>
                  <select
                    value={transferCaseWorkerId}
                    onChange={(e) => setTransferCaseWorkerId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select a case worker...</option>
                    {availableCaseWorkers.map((cw) => (
                      <option key={cw.id} value={cw.id}>
                        {cw.firstName} {cw.lastName}
                        {cw.caseWorkerProfile &&
                          ` (${cw.caseWorkerProfile.currentCaseload} active cases)`}
                      </option>
                    ))}
                  </select>
                </Stack>
              )}

              <Stack space="200">
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Referral Notes (optional)
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Why is this participant being referred? What should the new case worker know?&#10;&#10;e.g., 'Graduated from Emergency Shelter program with stable housing. Now ready for job training and employment support.'"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </Stack>
            </Stack>
          )}

          {/* Action Buttons */}
          <InlineStack gap="300" distribute="flex-end">
            <Button
              variant="tertiary"
              onPress={onClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleSubmit}
              isDisabled={isSubmitting}
            >
              {isSubmitting
                ? 'Processing...'
                : actionType === 'complete'
                  ? 'Complete Enrollment'
                  : actionType === 'dismiss'
                    ? 'Dismiss Enrollment'
                    : 'Refer to Program'}
            </Button>
          </InlineStack>
        </Stack>
      </Card>
    </div>
  );
}
