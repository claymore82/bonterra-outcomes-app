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
import { useProgramStore } from '@/lib/stores/programStore';
import { useSiteStore } from '@/lib/stores/siteStore';
import { useServiceStore } from '@/lib/stores/serviceStore';
import { Program, ProgramType } from '@/types/poc';
import PageLayout from '../../components/PageLayout';

export default function ProgramsPage() {
  const { programs, addProgram, updateProgram, deleteProgram } = useProgramStore();
  const { sites } = useSiteStore();
  const { serviceTypes } = useServiceStore();

  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const activePrograms = programs.filter(p => p.active);

  const getSiteNames = (siteIds: string[]) => {
    if (siteIds.length === 0) return 'All sites';
    return siteIds
      .map(id => sites.find(s => s.id === id)?.name || id)
      .join(', ');
  };

  const getProgramServices = (programId: string) => {
    return serviceTypes.filter(s => s.programs.includes(programId));
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteProgram(id);
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
              <Heading level={1}>Programs</Heading>
              <Text>Create and manage programs</Text>
            </Stack>
            <Button
              variant="primary"
              onPress={() => {
                setEditingProgram(null);
                setShowModal(true);
              }}
            >
              + Create Program
            </Button>
          </InlineStack>
        </Stack>

        {/* Stats */}
        <InlineStack gap="400">
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Total Programs</Text>
              <Heading level={2}>{programs.length}</Heading>
            </Stack>
          </Card>

          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Active</Text>
              <Heading level={2}>{activePrograms.length}</Heading>
            </Stack>
          </Card>
        </InlineStack>

        {/* Programs List */}
        <Card>
          <Stack space="400">
            <Heading level={2}>All Programs</Heading>

            {programs.length === 0 ? (
              <Text>No programs yet. Click "Create Program" to get started.</Text>
            ) : (
              <Stack space="300">
                {programs.map((program) => (
                  <Card key={program.id}>
                    <Stack space="300">
                      <div>
                        <InlineStack gap="300" verticalAlign="center">
                          <Text weight="600" style={{ fontSize: '16px' }}>{program.name}</Text>
                          <div style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: program.status === 'active' ? '#d1fae5' : '#f3f4f6',
                            color: program.status === 'active' ? '#065f46' : '#6b7280',
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}>
                            {program.status}
                          </div>
                        </InlineStack>
                        {program.description && (
                          <Text variant="sm" style={{ marginTop: '4px' }}>{program.description}</Text>
                        )}
                      </div>

                      <InlineStack gap="400">
                        {program.programType && (
                          <div>
                            <Text variant="xs" color="subdued">Type</Text>
                            <Text variant="sm" weight="500" style={{ textTransform: 'capitalize' }}>
                              {program.programType.replace('_', ' ')}
                            </Text>
                          </div>
                        )}
                        {program.capacity && (
                          <div>
                            <Text variant="xs" color="subdued">Capacity</Text>
                            <Text variant="sm" weight="500">
                              {program.currentEnrollment || 0} / {program.capacity}
                            </Text>
                          </div>
                        )}
                      </InlineStack>

                      {program.outcomeGoals && program.outcomeGoals.length > 0 && (
                        <div style={{
                          padding: '12px',
                          backgroundColor: '#fef3c7',
                          borderRadius: '6px',
                          border: '1px solid #fbbf24',
                        }}>
                          <Text variant="sm" weight="500" style={{ marginBottom: '6px', color: '#78350f' }}>
                            🎯 Outcome Goals:
                          </Text>
                          <Stack space="100">
                            {program.outcomeGoals.map((goal, idx) => (
                              <Text key={idx} variant="sm" style={{ color: '#92400e' }}>
                                • {goal}
                              </Text>
                            ))}
                          </Stack>
                        </div>
                      )}

                      {(() => {
                        const programServices = getProgramServices(program.id);
                        return programServices.length > 0 && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#dbeafe',
                            borderRadius: '6px',
                            border: '1px solid #3b82f6',
                          }}>
                            <Text variant="sm" weight="500" style={{ marginBottom: '6px', color: '#1e40af' }}>
                              📋 Services ({programServices.length}):
                            </Text>
                            <Stack space="100">
                              {programServices.slice(0, 3).map(service => (
                                <Text key={service.id} variant="sm" style={{ color: '#1e3a8a' }}>
                                  • {service.name}
                                </Text>
                              ))}
                              {programServices.length > 3 && (
                                <Text variant="xs" style={{ color: '#1e40af', fontStyle: 'italic' }}>
                                  +{programServices.length - 3} more services
                                </Text>
                              )}
                            </Stack>
                          </div>
                        );
                      })()}

                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <Text variant="sm" weight="500" style={{ marginBottom: '4px' }}>
                          Sites:
                        </Text>
                        <Text variant="sm" color="subdued">
                          {getSiteNames(program.siteIds || [])}
                        </Text>
                      </div>

                      <InlineStack gap="200">
                        <Button
                          variant="secondary"
                          size="small"
                          onPress={() => handleEdit(program)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="small"
                          onPress={() => setShowDeleteConfirm(program.id)}
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
        <ProgramModal
          program={editingProgram}
          onClose={() => {
            setShowModal(false);
            setEditingProgram(null);
          }}
          onSave={(data) => {
            if (editingProgram) {
              updateProgram(editingProgram.id, data);
            } else {
              addProgram(data);
            }
            setShowModal(false);
            setEditingProgram(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <Card>
            <Stack space="400">
              <Heading level={3}>Confirm Delete</Heading>
              <Text>
                Are you sure you want to delete this program? This action cannot be undone.
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

interface ProgramModalProps {
  program: Program | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

function ProgramModal({ program, onClose, onSave }: ProgramModalProps) {
  const { sites } = useSiteStore();
  const { serviceTypes } = useServiceStore();
  const [name, setName] = useState(program?.name || '');
  const [description, setDescription] = useState(program?.description || '');
  const [programType, setProgramType] = useState<string>(program?.programType || 'emergency_shelter');
  const [targetPopulation, setTargetPopulation] = useState(program?.eligibilityCriteria || '');
  const [capacity, setCapacity] = useState(program?.capacity?.toString() || '');
  const [budget, setBudget] = useState(program?.budget?.toString() || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(program?.status || 'active');
  const [selectedSites, setSelectedSites] = useState<Set<string>>(
    new Set(program?.siteIds || [])
  );
  const [outcomeGoals, setOutcomeGoals] = useState<string[]>(program?.outcomeGoals || []);
  const [newGoalInput, setNewGoalInput] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a program name');
      return;
    }

    if (outcomeGoals.length === 0) {
      alert('Please add at least one outcome goal for this program');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      programType: programType as ProgramType,
      eligibilityCriteria: targetPopulation.trim() || undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      budget: budget ? parseFloat(budget) : undefined,
      status,
      active: status === 'active',
      siteIds: Array.from(selectedSites),
      servicesOffered: program?.servicesOffered || [],
      enrollmentRequirements: program?.enrollmentRequirements || [],
      outcomeGoals,
      requiresCaseWorker: program?.requiresCaseWorker ?? true,
    });
  };

  const toggleSite = (siteId: string) => {
    const newSet = new Set(selectedSites);
    if (newSet.has(siteId)) {
      newSet.delete(siteId);
    } else {
      newSet.add(siteId);
    }
    setSelectedSites(newSet);
  };

  const addOutcomeGoal = () => {
    if (newGoalInput.trim()) {
      setOutcomeGoals([...outcomeGoals, newGoalInput.trim()]);
      setNewGoalInput('');
    }
  };

  const removeOutcomeGoal = (index: number) => {
    setOutcomeGoals(outcomeGoals.filter((_, i) => i !== index));
  };

  const programServices = program ? serviceTypes.filter(s => s.programs.includes(program.id)) : [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <Card>
          <Stack space="500">
            <Heading level={2}>
              {program ? 'Edit Program' : 'Create Program'}
            </Heading>

            <Stack space="400">
              {/* Name */}
              <TextField
                label="Program Name *"
                value={name}
                onChange={setName}
                placeholder="Emergency Shelter"
              />

              {/* Description */}
              <TextField
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Describe the program..."
              />

              {/* Type & Status */}
              <InlineStack gap="400">
                <Select
                  label="Program Type *"
                  selectedKey={programType}
                  onSelectionChange={(key) => setProgramType(key as string)}
                >
                  <SelectItem id="emergency_shelter">Emergency Shelter</SelectItem>
                  <SelectItem id="rapid_rehousing">Rapid Rehousing</SelectItem>
                  <SelectItem id="permanent_supportive_housing">Permanent Supportive Housing</SelectItem>
                  <SelectItem id="transitional_housing">Transitional Housing</SelectItem>
                  <SelectItem id="job_training">Job Training</SelectItem>
                  <SelectItem id="educational_support">Educational Support</SelectItem>
                  <SelectItem id="mental_health_services">Mental Health Services</SelectItem>
                  <SelectItem id="substance_abuse_treatment">Substance Abuse Treatment</SelectItem>
                  <SelectItem id="case_management">Case Management</SelectItem>
                  <SelectItem id="other">Other</SelectItem>
                </Select>

                <Select
                  label="Status *"
                  selectedKey={status}
                  onSelectionChange={(key) => setStatus(key as 'active' | 'inactive')}
                >
                  <SelectItem id="active">Active</SelectItem>
                  <SelectItem id="inactive">Inactive</SelectItem>
                </Select>
              </InlineStack>

              {/* Eligibility / Target Population */}
              <TextField
                label="Eligibility Criteria"
                value={targetPopulation}
                onChange={setTargetPopulation}
                placeholder="Currently experiencing homelessness, adults 18+..."
              />

              {/* Capacity and Budget */}
              <InlineStack gap="400">
                <TextField
                  label="Capacity"
                  type="number"
                  value={capacity}
                  onChange={setCapacity}
                  placeholder="50"
                  helpText="Maximum number of participants"
                />

                <TextField
                  label="Annual Budget"
                  type="number"
                  value={budget}
                  onChange={setBudget}
                  placeholder="250000"
                  helpText="Total annual funds available ($)"
                />
              </InlineStack>

              {/* Outcome Goals */}
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}>
                  Outcome Goals * <span style={{ color: '#ef4444' }}>({outcomeGoals.length} goal{outcomeGoals.length !== 1 ? 's' : ''})</span>
                </div>

                {/* Add new goal input */}
                <div style={{ marginBottom: '12px' }}>
                  <InlineStack gap="200">
                    <div style={{ flex: 1 }}>
                      <TextField
                        label=""
                        value={newGoalInput}
                        onChange={setNewGoalInput}
                        placeholder="e.g., Reduce recidivism, Increase educational attainment"
                        onKeyDown={(e: any) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addOutcomeGoal();
                          }
                        }}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onPress={addOutcomeGoal}
                      isDisabled={!newGoalInput.trim()}
                    >
                      Add Goal
                    </Button>
                  </InlineStack>
                </div>

                {/* List of added goals */}
                {outcomeGoals.length > 0 && (
                  <div style={{
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                  }}>
                    <Stack space="200">
                      {outcomeGoals.map((goal, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            border: '1px solid #fbbf24',
                          }}
                        >
                          <Text variant="sm" weight="500" style={{ color: '#78350f' }}>
                            🎯 {goal}
                          </Text>
                          <button
                            onClick={() => removeOutcomeGoal(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              fontSize: '18px',
                              padding: '0 8px',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </Stack>
                  </div>
                )}
                <Text variant="xs" color="subdued" style={{ marginTop: '4px' }}>
                  Define measurable outcomes this program aims to achieve
                </Text>
              </div>

              {/* Show linked services */}
              {program && programServices.length > 0 && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '8px',
                  border: '1px solid #3b82f6',
                }}>
                  <Text variant="sm" weight="500" style={{ marginBottom: '8px', color: '#1e40af' }}>
                    📋 Services Linked to This Program ({programServices.length}):
                  </Text>
                  <Stack space="100">
                    {programServices.map(service => (
                      <Text key={service.id} variant="sm" style={{ color: '#1e3a8a' }}>
                        • {service.name}
                      </Text>
                    ))}
                  </Stack>
                  <Text variant="xs" style={{ marginTop: '8px', color: '#1e40af', fontStyle: 'italic' }}>
                    Services help achieve outcome goals. Manage services in the Services admin page.
                  </Text>
                </div>
              )}

              {/* Site Selection */}
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}>
                  Sites <span style={{ color: '#6b7280' }}>({selectedSites.size === 0 ? 'All sites' : `${selectedSites.size} selected`})</span>
                </div>
                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  backgroundColor: '#f9fafb',
                }}>
                  {sites.length === 0 ? (
                    <Text variant="sm" color="subdued">No sites available</Text>
                  ) : (
                    <Stack space="200">
                      {sites.map(site => (
                        <label
                          key={site.id}
                          style={{
                            display: 'flex',
                            alignItems: 'start',
                            padding: '8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: selectedSites.has(site.id) ? 'white' : 'transparent',
                            border: selectedSites.has(site.id) ? '1px solid #7c3aed' : '1px solid transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSites.has(site.id)}
                            onChange={() => toggleSite(site.id)}
                            style={{ marginRight: '10px', marginTop: '2px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <Text variant="sm" weight="500">{site.name}</Text>
                            {site.address && (
                              <Text variant="xs" color="subdued" style={{ marginTop: '2px' }}>
                                {site.address}
                              </Text>
                            )}
                          </div>
                        </label>
                      ))}
                    </Stack>
                  )}
                </div>
                <Text variant="xs" color="subdued" style={{ marginTop: '4px' }}>
                  Leave empty to make program available at all sites
                </Text>
              </div>
            </Stack>

            {/* Actions */}
            <InlineStack gap="300">
              <Button variant="secondary" onPress={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onPress={handleSubmit}>
                {program ? 'Save Changes' : 'Create Program'}
              </Button>
            </InlineStack>
          </Stack>
        </Card>
      </div>
    </div>
  );
}
