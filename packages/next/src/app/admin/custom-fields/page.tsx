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
  Checkbox,
} from '@bonterratech/stitch-extension';
import { useCustomFieldStore } from '@/lib/stores/customFieldStore';
import { useProgramStore } from '@/lib/stores/programStore';
import {
  CustomField,
  FieldType,
  FIELD_TYPE_LABELS,
  FieldAppliesTo,
} from '@/types/customFields';
import PageLayout from '../../components/PageLayout';

export default function CustomFieldsPage() {
  const { customFields, addCustomField, updateCustomField, deleteCustomField } =
    useCustomFieldStore();
  const { programs } = useProgramStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );

  const [formData, setFormData] = useState<Partial<CustomField>>({
    name: '',
    label: '',
    fieldType: 'text',
    required: false,
    visibleInIntake: true,
    visibleInProfile: true,
    programSpecific: false,
    hmisCompliant: false,
    options: [],
    programIds: [],
    appliesTo: 'individual',
    profiles: [],
    synonyms: [],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      fieldType: 'text',
      required: false,
      visibleInIntake: true,
      visibleInProfile: true,
      programSpecific: false,
      hmisCompliant: false,
      options: [],
      programIds: [],
      appliesTo: 'individual',
      profiles: [],
      synonyms: [],
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.label || !formData.fieldType) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateCustomField(editingId, formData);
    } else {
      addCustomField(
        formData as Omit<
          CustomField,
          'id' | 'createdAt' | 'updatedAt' | 'order'
        >,
      );
    }

    resetForm();
  };

  const handleEdit = (field: CustomField) => {
    setFormData(field);
    setEditingId(field.id);
    setIsCreating(true);
  };

  const handleDelete = (id: string) => {
    deleteCustomField(id);
    setShowDeleteConfirm(null);
  };

  const needsOptions =
    formData.fieldType === 'dropdown' || formData.fieldType === 'multi-select';

  return (
    <PageLayout pageTitle="Custom Fields">
      <Stack space="600">
        {/* Header */}
        <Stack space="300">
          <Link href="/admin/settings">
            <Text color="link">← Back to Settings</Text>
          </Link>
          <Heading level={1}>Custom Fields Configuration</Heading>
          <Text>Configure custom demographic and program-specific fields</Text>
        </Stack>

        {/* Action Buttons */}
        {!isCreating && (
          <InlineStack gap="300">
            <Button variant="primary" onPress={() => setIsCreating(true)}>
              + Create Custom Field
            </Button>
          </InlineStack>
        )}

        {/* Create/Edit Form */}
        {isCreating && (
          <Card>
            <Stack space="500">
              <Heading level={2}>
                {editingId ? 'Edit Field' : 'Create New Field'}
              </Heading>

              <Stack space="400">
                {/* Basic Info */}
                <InlineStack gap="400">
                  <TextField
                    label="Field Name (Internal) *"
                    value={formData.name || ''}
                    onChange={(value) =>
                      setFormData({ ...formData, name: value })
                    }
                    placeholder="e.g., veteran_status"
                    description="Lowercase, underscores only"
                  />
                  <TextField
                    label="Display Label *"
                    value={formData.label || ''}
                    onChange={(value) =>
                      setFormData({ ...formData, label: value })
                    }
                    placeholder="e.g., Veteran Status"
                  />
                </InlineStack>

                <InlineStack gap="400">
                  <Select
                    label="Field Type *"
                    selectedKey={formData.fieldType || 'text'}
                    onSelectionChange={(key) =>
                      setFormData({ ...formData, fieldType: key as FieldType })
                    }
                  >
                    {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} id={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Applies To *"
                    selectedKey={formData.appliesTo || 'individual'}
                    onSelectionChange={(key) =>
                      setFormData({
                        ...formData,
                        appliesTo: key as FieldAppliesTo,
                      })
                    }
                  >
                    <SelectItem id="individual">
                      Individual (person-level)
                    </SelectItem>
                    <SelectItem id="household">
                      Household (family-level)
                    </SelectItem>
                    <SelectItem id="entity">
                      Entity (organization-level)
                    </SelectItem>
                    <SelectItem id="all">All types</SelectItem>
                  </Select>
                </InlineStack>

                <TextField
                  label="Help Text"
                  value={formData.helpText || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, helpText: value })
                  }
                  placeholder="Additional guidance for users"
                />

                {/* Options for dropdown/multi-select */}
                {needsOptions && (
                  <TextField
                    label="Options (one per line)"
                    value={(formData.options || []).join('\n')}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        options: value.split('\n').filter((o) => o.trim()),
                      })
                    }
                    placeholder="Yes&#10;No&#10;Prefer not to answer"
                  />
                )}

                {/* Checkboxes */}
                <Stack space="300">
                  <Text weight="600">Field Settings</Text>
                  <InlineStack gap="400">
                    <Checkbox
                      isSelected={formData.required || false}
                      onChange={(isSelected) =>
                        setFormData({ ...formData, required: isSelected })
                      }
                    >
                      <Text variant="sm">Required</Text>
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.visibleInIntake || false}
                      onChange={(isSelected) =>
                        setFormData({
                          ...formData,
                          visibleInIntake: isSelected,
                        })
                      }
                    >
                      <Text variant="sm">Show in Intake</Text>
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.visibleInProfile || false}
                      onChange={(isSelected) =>
                        setFormData({
                          ...formData,
                          visibleInProfile: isSelected,
                        })
                      }
                    >
                      <Text variant="sm">Show in Profile</Text>
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.hmisCompliant || false}
                      onChange={(isSelected) =>
                        setFormData({ ...formData, hmisCompliant: isSelected })
                      }
                    >
                      <Text variant="sm">HMIS Standard</Text>
                    </Checkbox>
                  </InlineStack>
                </Stack>

                {/* Program-Specific */}
                <Stack space="300">
                  <Checkbox
                    isSelected={formData.programSpecific || false}
                    onChange={(isSelected) =>
                      setFormData({
                        ...formData,
                        programSpecific: isSelected,
                        programIds: isSelected ? formData.programIds : [],
                      })
                    }
                  >
                    <Text weight="600">Program-Specific Field</Text>
                  </Checkbox>

                  {formData.programSpecific && (
                    <Card>
                      <Stack space="300">
                        {programs.map((program) => (
                          <Checkbox
                            key={program.id}
                            isSelected={
                              formData.programIds?.includes(program.id) || false
                            }
                            onChange={(isSelected) => {
                              const currentIds = formData.programIds || [];
                              const newIds = isSelected
                                ? [...currentIds, program.id]
                                : currentIds.filter((id) => id !== program.id);
                              setFormData({ ...formData, programIds: newIds });
                            }}
                          >
                            <Text variant="sm">{program.name}</Text>
                          </Checkbox>
                        ))}
                      </Stack>
                    </Card>
                  )}
                </Stack>
              </Stack>

              {/* Actions */}
              <InlineStack gap="300">
                <Button variant="primary" onPress={handleSubmit}>
                  {editingId ? 'Update Field' : 'Create Field'}
                </Button>
                <Button variant="secondary" onPress={resetForm}>
                  Cancel
                </Button>
              </InlineStack>
            </Stack>
          </Card>
        )}

        {/* Custom Fields List */}
        <Card>
          <Stack space="400">
            <Heading level={2}>
              Configured Fields ({customFields.length})
            </Heading>

            {customFields.length === 0 ? (
              <Text>
                No custom fields configured yet. Click &quot;Create Custom
                Field&quot; to get started.
              </Text>
            ) : (
              <Stack space="300">
                {customFields.map((field) => (
                  <Card key={field.id}>
                    <Stack space="300">
                      <InlineStack gap="300" verticalAlign="center">
                        <Stack space="100">
                          <Text weight="600">{field.label}</Text>
                          <Text variant="sm" color="subdued">
                            {field.name}
                          </Text>
                        </Stack>
                      </InlineStack>

                      <InlineStack gap="200">
                        <Text variant="sm" color="subdued">
                          Type: {FIELD_TYPE_LABELS[field.fieldType]}
                        </Text>
                        {field.required && (
                          <Text variant="sm" style={{ color: '#dc2626' }}>
                            Required
                          </Text>
                        )}
                        {field.hmisCompliant && (
                          <Text variant="sm" style={{ color: '#2563eb' }}>
                            HMIS
                          </Text>
                        )}
                        {field.visibleInIntake && (
                          <Text variant="sm" style={{ color: '#16a34a' }}>
                            Intake
                          </Text>
                        )}
                        {field.visibleInProfile && (
                          <Text variant="sm" style={{ color: '#7c3aed' }}>
                            Profile
                          </Text>
                        )}
                      </InlineStack>

                      <Text variant="sm" color="subdued">
                        {field.programSpecific
                          ? `${field.programIds?.length || 0} program(s)`
                          : 'All programs'}
                      </Text>

                      <InlineStack gap="200">
                        <Button
                          variant="secondary"
                          size="small"
                          onPress={() => handleEdit(field)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="small"
                          onPress={() => setShowDeleteConfirm(field.id)}
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
                Are you sure you want to delete this custom field? This action
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
