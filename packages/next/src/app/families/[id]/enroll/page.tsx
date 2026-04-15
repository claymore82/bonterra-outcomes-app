'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Button,
  Select,
  SelectItem,
  TextField,
  Checkbox,
} from '@bonterratech/stitch-extension';
import { useHouseholdStore } from '@/lib/stores/householdStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useSiteStore } from '@/lib/stores/siteStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';
import { RELATIONSHIP_LABELS, RelationshipType } from '@/types/household';
import PageLayout from '../../../components/PageLayout';

export default function EnrollFamilyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getHouseholdById } = useHouseholdStore();
  const { programs } = useProgramStore();
  const { sites } = useSiteStore();
  const { createEnrollment } = useEnrollmentStore();
  const { caseWorkers, getCaseWorker, incrementCaseload } =
    useCaseWorkerStore();

  const household = getHouseholdById(id);

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedCaseWorkerId, setSelectedCaseWorkerId] = useState('');
  const [outcomeGoals, setOutcomeGoals] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  if (!household) {
    return (
      <PageLayout pageTitle="Family Not Found">
        <Stack space="600">
          <Card>
            <Stack space="400">
              <Heading level={2}>Family Not Found</Heading>
              <Link href="/families">
                <Text color="link">← Back to Families</Text>
              </Link>
            </Stack>
          </Card>
        </Stack>
      </PageLayout>
    );
  }

  const headOfHousehold = household.members.find(
    (m) =>
      m.id === household.headOfHouseholdId || m.relationshipToHoH === 'self',
  );

  const handleEnroll = () => {
    if (
      !selectedProgramId ||
      !selectedCaseWorkerId ||
      selectedMembers.length === 0
    ) {
      alert(
        'Please select a program, case worker, and at least one family member',
      );
      return;
    }

    // Validate case worker exists and is active
    const caseWorker = getCaseWorker(selectedCaseWorkerId);
    if (!caseWorker) {
      alert(
        'Selected case worker not found. Please select a valid case worker.',
      );
      return;
    }

    if (caseWorker.status !== 'active') {
      alert(
        `Case worker ${caseWorker.firstName} ${caseWorker.lastName} is not currently active. Please select an active case worker.`,
      );
      return;
    }

    const enrollmentDate = new Date();

    // Create enrollments for all selected family members
    selectedMembers.forEach((memberId) => {
      createEnrollment({
        participantId: memberId,
        householdId: household.id,
        programId: selectedProgramId,
        siteId: selectedSiteId || undefined,
        caseWorkerId: selectedCaseWorkerId,
        startDate: enrollmentDate,
        endDate: null,
        status: 'active',
        outcomes: [],
        servicesReceived: [],
        outcomeGoals: outcomeGoals ? [outcomeGoals] : [],
        notes: notes || undefined,
      });
      // Increment case worker's caseload for each family member
      incrementCaseload(selectedCaseWorkerId);
    });

    alert(`Successfully enrolled ${selectedMembers.length} family members!`);
    router.push('/families');
  };

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const selectedCaseWorker = selectedCaseWorkerId
    ? getCaseWorker(selectedCaseWorkerId)
    : null;

  return (
    <PageLayout pageTitle="Enroll Family">
      <Stack space="600">
        {/* Header */}
        <Stack space="300">
          <Link href="/families">
            <Text color="link">← Back to Families</Text>
          </Link>
          <Heading level={1}>Enroll Family in Program</Heading>
          <Text>
            {headOfHousehold?.firstName} {headOfHousehold?.lastName} Family
          </Text>
        </Stack>

        {/* Family Members Selection */}
        <Card>
          <Stack space="400">
            <Heading level={2}>Select Family Members to Enroll</Heading>
            <Stack space="300">
              {household.members.map((member) => (
                <Checkbox
                  key={member.id}
                  isSelected={selectedMembers.includes(member.id)}
                  onChange={(isSelected) => {
                    if (isSelected) {
                      setSelectedMembers([...selectedMembers, member.id]);
                    } else {
                      setSelectedMembers(
                        selectedMembers.filter((id) => id !== member.id),
                      );
                    }
                  }}
                >
                  <Stack space="100">
                    <InlineStack gap="200" verticalAlign="center">
                      <Text weight="600">
                        {member.firstName} {member.lastName}
                      </Text>
                      <Text variant="sm" color="subdued">
                        {
                          RELATIONSHIP_LABELS[
                            member.relationshipToHoH as RelationshipType
                          ]
                        }
                      </Text>
                    </InlineStack>
                    {member.dateOfBirth && (
                      <Text variant="sm" color="subdued">
                        {new Date().getFullYear() -
                          member.dateOfBirth.getFullYear()}{' '}
                        years old
                      </Text>
                    )}
                  </Stack>
                </Checkbox>
              ))}
            </Stack>
            <InlineStack gap="300">
              <Button
                variant="secondary"
                size="small"
                onPress={() =>
                  setSelectedMembers(household.members.map((m) => m.id))
                }
              >
                Select All
              </Button>
              <Button
                variant="secondary"
                size="small"
                onPress={() => setSelectedMembers([])}
              >
                Clear All
              </Button>
            </InlineStack>
          </Stack>
        </Card>

        {/* Enrollment Details */}
        <Card>
          <Stack space="500">
            <Heading level={2}>Enrollment Details</Heading>

            <Stack space="400">
              {/* Program */}
              <Select
                label="Program *"
                placeholder="Select a program..."
                selectedKey={selectedProgramId}
                onSelectionChange={(key) => setSelectedProgramId(key as string)}
              >
                {programs.map((program) => (
                  <SelectItem key={program.id} id={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </Select>

              {/* Site */}
              <Select
                label="Site (Optional)"
                placeholder="Select a site..."
                selectedKey={selectedSiteId}
                onSelectionChange={(key) => setSelectedSiteId(key as string)}
              >
                <SelectItem id="">No site selected</SelectItem>
                {sites
                  .filter((site) => site.status === 'active')
                  .map((site) => (
                    <SelectItem key={site.id} id={site.id}>
                      {site.name} - {site.city}, {site.state}
                    </SelectItem>
                  ))}
              </Select>

              {/* Case Worker */}
              <Select
                label="Case Worker *"
                placeholder="Select a case worker..."
                selectedKey={selectedCaseWorkerId}
                onSelectionChange={(key) =>
                  setSelectedCaseWorkerId(key as string)
                }
              >
                {caseWorkers
                  .filter((cw) => cw.status === 'active')
                  .map((cw) => (
                    <SelectItem key={cw.id} id={cw.id}>
                      {cw.firstName} {cw.lastName} - {cw.role} (
                      {cw.currentCaseload}/{cw.maxCaseload})
                    </SelectItem>
                  ))}
              </Select>

              {/* Outcome Goals */}
              <TextField
                label="Family Outcome Goal"
                value={outcomeGoals}
                onChange={setOutcomeGoals}
                placeholder="e.g., Secure permanent housing for entire family"
              />

              {/* Notes */}
              <TextField
                label="Notes"
                value={notes}
                onChange={setNotes}
                placeholder="e.g., Family lost home in fire, needs immediate housing assistance"
              />
            </Stack>
          </Stack>
        </Card>

        {/* Summary */}
        <Card
          style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}
        >
          <Stack space="400">
            <Heading level={3}>Enrollment Summary</Heading>
            <Stack space="200">
              <InlineStack gap="400">
                <Text variant="sm" color="subdued">
                  Family Members:
                </Text>
                <Text variant="sm" weight="600">
                  {selectedMembers.length} selected
                </Text>
              </InlineStack>
              <InlineStack gap="400">
                <Text variant="sm" color="subdued">
                  Program:
                </Text>
                <Text variant="sm" weight="600">
                  {selectedProgram?.name || 'Not selected'}
                </Text>
              </InlineStack>
              <InlineStack gap="400">
                <Text variant="sm" color="subdued">
                  Case Worker:
                </Text>
                <Text variant="sm" weight="600">
                  {selectedCaseWorker
                    ? `${selectedCaseWorker.firstName} ${selectedCaseWorker.lastName}`
                    : 'Not selected'}
                </Text>
              </InlineStack>
              <InlineStack gap="400">
                <Text variant="sm" color="subdued">
                  Enrollment Date:
                </Text>
                <Text variant="sm" weight="600">
                  {new Date().toLocaleDateString()}
                </Text>
              </InlineStack>
            </Stack>
          </Stack>
        </Card>

        {/* Actions */}
        <InlineStack gap="400">
          <Button variant="secondary" onPress={() => router.push('/families')}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleEnroll}
            isDisabled={
              !selectedProgramId ||
              !selectedCaseWorkerId ||
              selectedMembers.length === 0
            }
          >
            Enroll Family ({selectedMembers.length} members)
          </Button>
        </InlineStack>
      </Stack>
    </PageLayout>
  );
}
