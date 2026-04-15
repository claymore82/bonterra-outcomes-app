'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  Heading,
  Text,
  Stack,
  InlineStack,
  Button,
  TextField,
  Select,
  SelectItem,
} from '@bonterratech/stitch-extension';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';
import { CaseWorker } from '@/types/poc';
import PageLayout from '../../components/PageLayout';

export default function CaseWorkersPage() {
  const { caseWorkers, createCaseWorker, updateCaseWorker, deleteCaseWorker } =
    useCaseWorkerStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCaseWorker, setEditingCaseWorker] = useState<CaseWorker | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );

  const activeCaseWorkers = caseWorkers.filter((cw) => cw.status === 'active');
  const totalCaseload = activeCaseWorkers.reduce(
    (sum, cw) => sum + (cw.currentCaseload || 0),
    0,
  );
  const avgCaseload =
    activeCaseWorkers.length > 0
      ? (totalCaseload / activeCaseWorkers.length).toFixed(1)
      : '0';

  const handleEdit = (caseWorker: CaseWorker) => {
    setEditingCaseWorker(caseWorker);
    setShowCreateModal(true);
  };

  const handleDelete = (id: string) => {
    deleteCaseWorker(id);
    setShowDeleteConfirm(null);
  };

  return (
    <PageLayout>
      <Stack space="600">
        {/* Header */}
        <Stack space="300">
          <Link href="/admin/settings">
            <Text color="link">← Back to Settings</Text>
          </Link>
          <InlineStack gap="400" verticalAlign="center">
            <Stack space="200">
              <Heading level={1}>Case Workers</Heading>
              <Text>Manage case workers and their program assignments</Text>
            </Stack>
            <Button
              variant="primary"
              onPress={() => {
                setEditingCaseWorker(null);
                setShowCreateModal(true);
              }}
            >
              + Add Case Worker
            </Button>
          </InlineStack>
        </Stack>

        {/* Stats */}
        <InlineStack gap="400">
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Total Case Workers
              </Text>
              <Heading level={2}>{caseWorkers.length}</Heading>
            </Stack>
          </Card>

          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Active
              </Text>
              <Heading level={2}>{activeCaseWorkers.length}</Heading>
            </Stack>
          </Card>

          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Total Caseload
              </Text>
              <Heading level={2}>{totalCaseload}</Heading>
            </Stack>
          </Card>

          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Average Caseload
              </Text>
              <Heading level={2}>{avgCaseload}</Heading>
            </Stack>
          </Card>
        </InlineStack>

        {/* Case Workers List */}
        <Card>
          <Stack space="400">
            <Heading level={2}>All Case Workers</Heading>

            {caseWorkers.length === 0 ? (
              <Text>
                No case workers yet. Click &quot;Add Case Worker&quot; to get
                started.
              </Text>
            ) : (
              <Stack space="300">
                {caseWorkers.map((cw) => (
                  <Card key={cw.id}>
                    <Stack space="200">
                      <InlineStack gap="300">
                        <Text weight="600">
                          {cw.firstName} {cw.lastName}
                        </Text>
                        <Text variant="sm" color="subdued">
                          • {cw.role}
                        </Text>
                        {cw.status === 'active' && (
                          <Text variant="sm" color="success">
                            ✓ Active
                          </Text>
                        )}
                      </InlineStack>
                      <InlineStack gap="400">
                        {cw.email && <Text variant="sm">{cw.email}</Text>}
                        {cw.phone && (
                          <Text variant="sm" color="subdued">
                            {cw.phone}
                          </Text>
                        )}
                      </InlineStack>
                      {cw.programIds && cw.programIds.length > 0 && (
                        <Text variant="sm">
                          Programs: {cw.programIds.length} assigned
                        </Text>
                      )}
                      {cw.currentCaseload !== undefined && (
                        <Text variant="sm" color="subdued">
                          Current caseload: {cw.currentCaseload} /{' '}
                          {cw.maxCaseload}
                        </Text>
                      )}
                      <InlineStack gap="200">
                        <Button
                          variant="secondary"
                          size="small"
                          onPress={() => handleEdit(cw)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="small"
                          onPress={() => setShowDeleteConfirm(cw.id)}
                        >
                          Delete
                        </Button>
                      </InlineStack>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CaseWorkerModal
          caseWorker={editingCaseWorker}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCaseWorker(null);
          }}
          onSave={(data) => {
            if (editingCaseWorker) {
              updateCaseWorker(editingCaseWorker.id, data);
            } else {
              createCaseWorker(data);
            }
            setShowCreateModal(false);
            setEditingCaseWorker(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Card>
            <Stack space="400">
              <Heading level={3}>Confirm Delete</Heading>
              <Text>
                Are you sure you want to delete this case worker? This action
                cannot be undone.
              </Text>
              <InlineStack gap="300">
                <Button
                  variant="secondary"
                  onPress={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onPress={() => handleDelete(showDeleteConfirm)}
                >
                  Delete
                </Button>
              </InlineStack>
            </Stack>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}

interface CaseWorkerModalProps {
  caseWorker: CaseWorker | null;
  onClose: () => void;
  onSave: (data: Partial<CaseWorker>) => void;
}

function CaseWorkerModal({
  caseWorker,
  onClose,
  onSave,
}: CaseWorkerModalProps) {
  const [firstName, setFirstName] = useState(caseWorker?.firstName || '');
  const [lastName, setLastName] = useState(caseWorker?.lastName || '');
  const [email, setEmail] = useState(caseWorker?.email || '');
  const [phone, setPhone] = useState(caseWorker?.phone || '');
  const [role, setRole] = useState(caseWorker?.role || 'Case Manager');
  const [maxCaseload, setMaxCaseload] = useState(
    caseWorker?.maxCaseload?.toString() || '25',
  );
  const [status, setStatus] = useState<'active' | 'inactive'>(
    caseWorker?.status || 'active',
  );

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter first and last name');
      return;
    }

    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      role: role.trim(),
      maxCaseload: maxCaseload ? parseInt(maxCaseload) : undefined,
      status,
      programIds: caseWorker?.programIds || [],
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <Card>
          <Stack space="500">
            <Heading level={2}>
              {caseWorker ? 'Edit Case Worker' : 'Add Case Worker'}
            </Heading>

            <Stack space="400">
              {/* Name */}
              <InlineStack gap="400">
                <TextField
                  label="First Name *"
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="Sarah"
                />
                <TextField
                  label="Last Name *"
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Johnson"
                />
              </InlineStack>

              {/* Contact */}
              <InlineStack gap="400">
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="sjohnson@org.org"
                />
                <TextField
                  label="Phone"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="555-1234"
                />
              </InlineStack>

              {/* Role & Caseload */}
              <InlineStack gap="400">
                <TextField
                  label="Role"
                  value={role}
                  onChange={setRole}
                  placeholder="Case Manager"
                />
                <TextField
                  label="Max Caseload"
                  type="number"
                  value={maxCaseload}
                  onChange={setMaxCaseload}
                  placeholder="25"
                />
              </InlineStack>

              {/* Status */}
              <Select
                label="Status"
                selectedKey={status}
                onSelectionChange={(key) =>
                  setStatus(key as 'active' | 'inactive')
                }
              >
                <SelectItem id="active">Active</SelectItem>
                <SelectItem id="inactive">Inactive</SelectItem>
              </Select>
            </Stack>

            {/* Actions */}
            <InlineStack gap="300">
              <Button variant="secondary" onPress={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onPress={handleSubmit}>
                {caseWorker ? 'Save Changes' : 'Create Case Worker'}
              </Button>
            </InlineStack>
          </Stack>
        </Card>
      </div>
    </div>
  );
}
