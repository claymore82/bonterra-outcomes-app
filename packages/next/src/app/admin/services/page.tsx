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
import { useServiceStore } from '@/lib/stores/serviceStore';
import { useProgramStore } from '@/lib/stores/programStore';
import {
  ServiceType,
  SERVICE_CATEGORIES,
  SERVICE_UNITS,
} from '@/types/services';
import PageLayout from '../../components/PageLayout';

export default function ServicesPage() {
  const { serviceTypes, addServiceType, updateServiceType, deleteServiceType } =
    useServiceStore();
  const { programs } = useProgramStore();

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [selectedProgramFilter, setSelectedProgramFilter] =
    useState<string>('all');

  const handleEdit = (service: ServiceType) => {
    setEditingService(service);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteServiceType(id);
    setShowDeleteConfirm(null);
  };

  // Filter services by program
  const filteredServices =
    selectedProgramFilter === 'all'
      ? serviceTypes
      : serviceTypes.filter((s) => s.programs.includes(selectedProgramFilter));

  const getProgramNames = (programIds: string[]) => {
    if (programIds.length === 0) return 'All programs';
    return programIds
      .map((id) => programs.find((p) => p.id === id)?.name || id)
      .join(', ');
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
              <Heading level={1}>Services</Heading>
              <Text>Define service types and billing</Text>
            </Stack>
            <Button
              variant="primary"
              onPress={() => {
                setEditingService(null);
                setShowModal(true);
              }}
            >
              + Create Service Type
            </Button>
          </InlineStack>
        </Stack>

        {/* Program Filter */}
        <Card>
          <Stack space="300">
            <Heading level={3}>Filter by Program</Heading>
            <Select
              label=""
              selectedKey={selectedProgramFilter}
              onSelectionChange={(key) =>
                setSelectedProgramFilter(key as string)
              }
            >
              <SelectItem id="all">All Programs</SelectItem>
              {programs
                .filter((p) => p.status === 'active')
                .map((program) => (
                  <SelectItem key={program.id} id={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
            </Select>
          </Stack>
        </Card>

        {/* Service Types List */}
        <Card>
          <Stack space="400">
            <Heading level={2}>
              Service Types ({filteredServices.length})
            </Heading>

            {filteredServices.length === 0 ? (
              <Text>
                {selectedProgramFilter === 'all'
                  ? 'No service types yet. Click "Create Service Type" to get started.'
                  : 'No services configured for this program.'}
              </Text>
            ) : (
              <Stack space="300">
                {filteredServices.map((service) => (
                  <Card key={service.id}>
                    <Stack space="300">
                      <div>
                        <Text weight="600" style={{ fontSize: '16px' }}>
                          {service.name}
                        </Text>
                        {service.description && (
                          <Text variant="sm" style={{ marginTop: '4px' }}>
                            {service.description}
                          </Text>
                        )}
                      </div>

                      <InlineStack gap="300" verticalAlign="center">
                        <div
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#f3f4f6',
                            fontSize: '13px',
                            fontWeight: 500,
                          }}
                        >
                          {SERVICE_CATEGORIES[service.category]}
                        </div>
                        {service.costPerUnit && (
                          <Text variant="sm" color="subdued">
                            ${service.costPerUnit} per{' '}
                            {SERVICE_UNITS[service.unit].toLowerCase()}
                          </Text>
                        )}
                      </InlineStack>

                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <Text
                          variant="sm"
                          weight="500"
                          style={{ marginBottom: '4px' }}
                        >
                          Programs:
                        </Text>
                        <Text variant="sm" color="subdued">
                          {getProgramNames(service.programs)}
                        </Text>
                      </div>

                      <InlineStack gap="200">
                        <Button
                          variant="secondary"
                          size="small"
                          onPress={() => handleEdit(service)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="small"
                          onPress={() => setShowDeleteConfirm(service.id)}
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
      {showModal && (
        <ServiceModal
          service={editingService}
          onClose={() => {
            setShowModal(false);
            setEditingService(null);
          }}
          onSave={(data) => {
            if (editingService) {
              updateServiceType(editingService.id, data);
            } else {
              addServiceType(data);
            }
            setShowModal(false);
            setEditingService(null);
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
                Are you sure you want to delete this service type? This action
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

interface ServiceModalProps {
  service: ServiceType | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

function ServiceModal({ service, onClose, onSave }: ServiceModalProps) {
  const { programs } = useProgramStore();
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [category, setCategory] = useState<string>(
    service?.category || 'case-management',
  );
  const [costPerUnit, setCostPerUnit] = useState(
    service?.costPerUnit?.toString() || '',
  );
  const [unit, setUnit] = useState<string>(service?.unit || 'sessions');
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(
    new Set(service?.programs || []),
  );

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a service name');
      return;
    }

    if (selectedPrograms.size === 0) {
      alert('Please select at least one program for this service');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      costPerUnit: costPerUnit ? parseFloat(costPerUnit) : undefined,
      unit,
      programs: Array.from(selectedPrograms),
      requiresDocumentation: false,
      active: true,
    });
  };

  const toggleProgram = (programId: string) => {
    const newSet = new Set(selectedPrograms);
    if (newSet.has(programId)) {
      newSet.delete(programId);
    } else {
      newSet.add(programId);
    }
    setSelectedPrograms(newSet);
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
              {service ? 'Edit Service Type' : 'Create Service Type'}
            </Heading>

            <Stack space="400">
              {/* Name */}
              <TextField
                label="Service Name *"
                value={name}
                onChange={setName}
                placeholder="Individual Counseling"
              />

              {/* Description */}
              <TextField
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Describe what this service provides..."
              />

              {/* Category & Unit */}
              <InlineStack gap="400">
                <Select
                  label="Category *"
                  selectedKey={category}
                  onSelectionChange={(key) => setCategory(key as string)}
                >
                  {Object.entries(SERVICE_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} id={key}>
                      {label}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Unit *"
                  selectedKey={unit}
                  onSelectionChange={(key) => setUnit(key as string)}
                >
                  {Object.entries(SERVICE_UNITS).map(([key, label]) => (
                    <SelectItem key={key} id={key}>
                      {label}
                    </SelectItem>
                  ))}
                </Select>
              </InlineStack>

              {/* Cost Per Unit */}
              <TextField
                label="Cost Per Unit ($)"
                type="number"
                value={costPerUnit}
                onChange={setCostPerUnit}
                placeholder="50.00"
                helpText="Optional: cost for budgeting and reporting"
              />

              {/* Program Selection */}
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                  }}
                >
                  Programs *{' '}
                  <span style={{ color: '#ef4444' }}>
                    ({selectedPrograms.size} selected)
                  </span>
                </div>
                <div
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '12px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  {programs.filter((p) => p.status === 'active').length ===
                  0 ? (
                    <Text variant="sm" color="subdued">
                      No active programs available
                    </Text>
                  ) : (
                    <Stack space="200">
                      {programs
                        .filter((p) => p.status === 'active')
                        .map((program) => (
                          <label
                            key={program.id}
                            style={{
                              display: 'flex',
                              alignItems: 'start',
                              padding: '8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: selectedPrograms.has(program.id)
                                ? 'white'
                                : 'transparent',
                              border: selectedPrograms.has(program.id)
                                ? '1px solid #7c3aed'
                                : '1px solid transparent',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPrograms.has(program.id)}
                              onChange={() => toggleProgram(program.id)}
                              style={{ marginRight: '10px', marginTop: '2px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <Text variant="sm" weight="500">
                                {program.name}
                              </Text>
                              {program.description && (
                                <Text
                                  variant="xs"
                                  color="subdued"
                                  style={{ marginTop: '2px' }}
                                >
                                  {program.description}
                                </Text>
                              )}
                              {program.outcomeGoals &&
                                program.outcomeGoals.length > 0 && (
                                  <Text
                                    variant="xs"
                                    color="subdued"
                                    style={{ marginTop: '4px' }}
                                  >
                                    Outcomes:{' '}
                                    {program.outcomeGoals
                                      .slice(0, 2)
                                      .join(', ')}
                                    {program.outcomeGoals.length > 2 &&
                                      ` +${program.outcomeGoals.length - 2} more`}
                                  </Text>
                                )}
                            </div>
                          </label>
                        ))}
                    </Stack>
                  )}
                </div>
                <Text variant="xs" color="subdued" style={{ marginTop: '4px' }}>
                  Select which programs offer this service
                </Text>
              </div>
            </Stack>

            {/* Actions */}
            <InlineStack gap="300">
              <Button variant="secondary" onPress={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onPress={handleSubmit}>
                {service ? 'Save Changes' : 'Create Service Type'}
              </Button>
            </InlineStack>
          </Stack>
        </Card>
      </div>
    </div>
  );
}
