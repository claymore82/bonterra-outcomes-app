'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heading,
  Text,
  Button,
  Stack,
  InlineStack,
  TextField,
  Select,
  SelectItem,
  Checkbox,
} from '@bonterratech/stitch-extension';
import { useCustomFieldStore } from '@/lib/stores/customFieldStore';
import { useProgramStore } from '@/lib/stores/programStore';
import {
  CustomField,
  FIELD_TYPE_LABELS,
  FieldType,
} from '@/types/customFields';
import {
  STANDARD_SOURCES,
  StandardDemographicField,
} from '@/lib/standardDemographics';
import PageLayout from '../../components/PageLayout';

export default function DemographicsPage() {
  const { customFields, addCustomField, updateCustomField, deleteCustomField } =
    useCustomFieldStore();
  const { programs } = useProgramStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedFieldsForImport, setSelectedFieldsForImport] = useState<
    Set<string>
  >(new Set());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    fieldType: 'text' as FieldType,
    required: false,
    visibleInIntake: true,
    visibleInProfile: true,
    programSpecific: false,
    programIds: [] as string[],
    hmisCompliant: false,
    helpText: '',
    options: [] as string[],
    appliesTo: 'individual' as 'individual' | 'household' | 'entity' | 'all',
    profiles: [] as string[],
  });

  const [optionsText, setOptionsText] = useState('');

  const demographicFields = customFields.filter(
    (field) =>
      field.profiles?.includes('hmis') ||
      field.profiles?.includes('general') ||
      field.hmisCompliant,
  );

  const getProgramCount = (field: CustomField) => {
    if (!field.programSpecific) return 'All programs';
    return `${field.programIds?.length || 0} program(s)`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      fieldType: 'text',
      required: false,
      visibleInIntake: true,
      visibleInProfile: true,
      programSpecific: false,
      programIds: [],
      hmisCompliant: false,
      helpText: '',
      options: [],
      appliesTo: 'individual',
      profiles: [],
    });
    setOptionsText('');
    setEditingField(null);
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      label: field.label,
      fieldType: field.fieldType,
      required: field.required,
      visibleInIntake: field.visibleInIntake,
      visibleInProfile: field.visibleInProfile,
      programSpecific: field.programSpecific,
      programIds: field.programIds || [],
      hmisCompliant: field.hmisCompliant,
      helpText: field.helpText || '',
      options: field.options || [],
      appliesTo: field.appliesTo || 'individual',
      profiles: field.profiles || [],
    });
    setOptionsText((field.options || []).join('\n'));
    setShowCreateModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.label) {
      alert('Please fill in name and label');
      return;
    }

    // Generate name from label if empty
    const fieldName =
      formData.name || formData.label.toLowerCase().replace(/\s+/g, '_');

    // Parse options from textarea
    const options =
      formData.fieldType === 'dropdown' || formData.fieldType === 'multi-select'
        ? optionsText
            .split('\n')
            .filter((o) => o.trim())
            .map((o) => o.trim())
        : [];

    const fieldData = {
      name: fieldName,
      label: formData.label,
      fieldType: formData.fieldType,
      required: formData.required,
      visibleInIntake: formData.visibleInIntake,
      visibleInProfile: formData.visibleInProfile,
      programSpecific: formData.programSpecific,
      programIds: formData.programSpecific ? formData.programIds : [],
      hmisCompliant: formData.hmisCompliant,
      helpText: formData.helpText,
      options,
      appliesTo: formData.appliesTo as const,
      profiles:
        formData.profiles.length > 0
          ? (formData.profiles as any)
          : ['general' as const],
    };

    if (editingField) {
      updateCustomField(editingField.id, fieldData);
    } else {
      addCustomField(fieldData);
    }

    setShowCreateModal(false);
    resetForm();
  };

  const handleDelete = (field: CustomField) => {
    if (confirm(`Delete "${field.label}"? This action cannot be undone.`)) {
      deleteCustomField(field.id);
    }
  };

  const toggleProgramSelection = (programId: string) => {
    const newProgramIds = formData.programIds.includes(programId)
      ? formData.programIds.filter((id) => id !== programId)
      : [...formData.programIds, programId];
    setFormData({ ...formData, programIds: newProgramIds });
  };

  const toggleProfile = (profile: string) => {
    const newProfiles = formData.profiles.includes(profile)
      ? formData.profiles.filter((p) => p !== profile)
      : [...formData.profiles, profile];
    setFormData({ ...formData, profiles: newProfiles });
  };

  const toggleFieldForImport = (fieldName: string) => {
    const newSelected = new Set(selectedFieldsForImport);
    if (newSelected.has(fieldName)) {
      newSelected.delete(fieldName);
    } else {
      newSelected.add(fieldName);
    }
    setSelectedFieldsForImport(newSelected);
  };

  const handleImportFields = () => {
    if (!selectedSource) return;

    const source = STANDARD_SOURCES.find((s) => s.id === selectedSource);
    if (!source) return;

    const fieldsToImport = source.fields.filter((f) =>
      selectedFieldsForImport.has(f.name),
    );
    let importedCount = 0;
    let skippedCount = 0;

    fieldsToImport.forEach((field) => {
      // Check if field already exists
      const exists = customFields.some((cf) => cf.name === field.name);
      if (exists) {
        skippedCount++;
        return;
      }

      // Import the field
      addCustomField({
        name: field.name,
        label: field.label,
        fieldType: field.fieldType,
        required: field.required,
        options: field.options || [],
        helpText: field.helpText,
        visibleInIntake: true,
        visibleInProfile: true,
        programSpecific: false,
        programIds: [],
        hmisCompliant: field.hmisCompliant || false,
        appliesTo: field.appliesTo,
        profiles: field.profiles as any,
      });
      importedCount++;
    });

    alert(
      `Imported ${importedCount} field(s). ${skippedCount > 0 ? `Skipped ${skippedCount} duplicate(s).` : ''}`,
    );
    setShowImportModal(false);
    setSelectedSource(null);
    setSelectedFieldsForImport(new Set());
  };

  return (
    <PageLayout pageTitle="Demographic Fields">
      <Stack space="600">
        {/* Header */}
        <div>
          <div style={{ marginBottom: '8px' }}>
            <Link href="/admin/settings">
              <Text color="link">← Back to Home</Text>
            </Link>
          </div>
          <Heading level={1} style={{ marginBottom: '8px' }}>
            Demographic Fields
          </Heading>
          <Text color="subdued">
            Configure demographics and map to government standards
          </Text>
        </div>

        {/* Action Buttons */}
        <InlineStack space="200">
          <Button
            variant="primary"
            onPress={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            Create Custom Field
          </Button>
          <Button
            variant="secondary"
            onPress={() => setShowImportModal(true)}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
            }}
          >
            📋 Import from Standards (HMIS, OMB, HHS)
          </Button>
        </InlineStack>

        {/* Table */}
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}
          >
            <Heading level={3} style={{ fontSize: '16px', fontWeight: 600 }}>
              Configured Fields ({demographicFields.length})
            </Heading>
          </div>

          {demographicFields.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <Text color="subdued">No demographic fields configured yet.</Text>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th
                      style={{
                        padding: '12px 24px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      LABEL
                    </th>
                    <th
                      style={{
                        padding: '12px 24px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      TYPE
                    </th>
                    <th
                      style={{
                        padding: '12px 24px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      PROPERTIES
                    </th>
                    <th
                      style={{
                        padding: '12px 24px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      PROGRAMS
                    </th>
                    <th
                      style={{
                        padding: '12px 24px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {demographicFields.map((field, index) => (
                    <tr
                      key={field.id}
                      style={{
                        borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div
                          style={{
                            fontWeight: 500,
                            color: '#111827',
                            marginBottom: '2px',
                          }}
                        >
                          {field.label}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {field.name}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          fontSize: '14px',
                          color: '#374151',
                        }}
                      >
                        {FIELD_TYPE_LABELS[field.fieldType]}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                          }}
                        >
                          {field.required && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 500,
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                              }}
                            >
                              Required
                            </span>
                          )}
                          {field.hmisCompliant && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 500,
                                backgroundColor: '#dbeafe',
                                color: '#1e40af',
                              }}
                            >
                              HMIS
                            </span>
                          )}
                          {field.visibleInIntake && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 500,
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                              }}
                            >
                              Intake
                            </span>
                          )}
                          {field.visibleInProfile && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 500,
                                backgroundColor: '#e9d5ff',
                                color: '#6b21a8',
                              }}
                            >
                              Profile
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          fontSize: '14px',
                          color: '#374151',
                        }}
                      >
                        {getProgramCount(field)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '12px',
                            fontSize: '14px',
                          }}
                        >
                          <button
                            onClick={() =>
                              alert('Map functionality coming soon')
                            }
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: '#7c3aed',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#6d28d9';
                              e.currentTarget.style.textDecoration =
                                'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#7c3aed';
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            Map
                          </button>
                          <button
                            onClick={() => handleEdit(field)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: '#7c3aed',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#6d28d9';
                              e.currentTarget.style.textDecoration =
                                'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#7c3aed';
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(field)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: '#dc2626',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#b91c1c';
                              e.currentTarget.style.textDecoration =
                                'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#dc2626';
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
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
              zIndex: 9999,
              padding: '24px',
            }}
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Stack space="400">
                <Heading level={3}>
                  {editingField ? 'Edit' : 'Create'} Custom Field
                </Heading>

                <TextField
                  label="Label"
                  value={formData.label}
                  onChange={(value) =>
                    setFormData({ ...formData, label: value })
                  }
                  placeholder="e.g., Veteran Status"
                />

                <TextField
                  label="Field Name (internal)"
                  value={formData.name}
                  onChange={(value) =>
                    setFormData({ ...formData, name: value })
                  }
                  placeholder="e.g., veteran_status"
                  helpText="Lowercase, use underscores. Auto-generated from label if left empty."
                />

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                    }}
                  >
                    Field Type
                  </label>
                  <select
                    value={formData.fieldType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fieldType: e.target.value as FieldType,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {(formData.fieldType === 'dropdown' ||
                  formData.fieldType === 'multi-select') && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        marginBottom: '8px',
                      }}
                    >
                      Options (one per line)
                    </label>
                    <textarea
                      value={optionsText}
                      onChange={(e) => setOptionsText(e.target.value)}
                      placeholder="Yes&#10;No&#10;Prefer not to answer"
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                )}

                <TextField
                  label="Help Text (optional)"
                  value={formData.helpText}
                  onChange={(value) =>
                    setFormData({ ...formData, helpText: value })
                  }
                  placeholder="Additional guidance for this field"
                />

                {/* Applies To */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                    }}
                  >
                    Applies To *
                  </label>
                  <select
                    value={formData.appliesTo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appliesTo: e.target.value as any,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="individual">
                      Individual (person-level)
                    </option>
                    <option value="household">
                      Household (family attributes)
                    </option>
                    <option value="entity">
                      Entity (organization attributes)
                    </option>
                    <option value="all">All (applies to everyone)</option>
                  </select>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '4px',
                    }}
                  >
                    Who does this field describe? Individual = person
                    attributes, Household = family attributes
                  </div>
                </div>

                {/* Profile/Standards */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                    }}
                  >
                    Profile/Standards (Optional)
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {[
                      { value: 'hmis', label: 'HMIS' },
                      { value: 'workforce', label: 'Workforce Development' },
                      { value: 'healthcare', label: 'Healthcare/HIPAA' },
                      { value: 'general', label: 'General Nonprofit' },
                      { value: 'custom', label: 'Custom' },
                    ].map((profile) => (
                      <label
                        key={profile.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.profiles.includes(profile.value)}
                          onChange={() => toggleProfile(profile.value)}
                          style={{ marginRight: '8px' }}
                        />
                        <span style={{ fontSize: '14px' }}>
                          {profile.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '8px',
                    }}
                  >
                    Select which standards this field follows (e.g., HMIS has
                    specific gender codes)
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.required}
                      onChange={(e) =>
                        setFormData({ ...formData, required: e.target.checked })
                      }
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '14px' }}>Required field</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.hmisCompliant}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hmisCompliant: e.target.checked,
                        })
                      }
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '14px' }}>HMIS compliant</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.visibleInIntake}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          visibleInIntake: e.target.checked,
                        })
                      }
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '14px' }}>Visible in intake</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.visibleInProfile}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          visibleInProfile: e.target.checked,
                        })
                      }
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '14px' }}>Visible in profile</span>
                  </label>
                </div>

                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      marginBottom: '12px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.programSpecific}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          programSpecific: e.target.checked,
                          programIds: [],
                        })
                      }
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>
                      Program-specific field
                    </span>
                  </label>

                  {formData.programSpecific && (
                    <div
                      style={{
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: '#f9fafb',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          marginBottom: '8px',
                        }}
                      >
                        Select Programs:
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        {programs
                          .filter((p) => p.status === 'active')
                          .map((program) => (
                            <label
                              key={program.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.programIds.includes(
                                  program.id,
                                )}
                                onChange={() =>
                                  toggleProgramSelection(program.id)
                                }
                                style={{ marginRight: '8px' }}
                              />
                              <span style={{ fontSize: '14px' }}>
                                {program.name}
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview */}
                {formData.label && (
                  <div
                    style={{
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        marginBottom: '12px',
                      }}
                    >
                      Preview
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 500,
                          marginBottom: '8px',
                        }}
                      >
                        {formData.label}
                        {formData.profiles.includes('hmis') && (
                          <span
                            style={{
                              marginLeft: '8px',
                              padding: '2px 6px',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              fontSize: '11px',
                              borderRadius: '4px',
                              fontWeight: 500,
                            }}
                          >
                            HMIS
                          </span>
                        )}
                      </label>
                      {formData.fieldType === 'dropdown' && (
                        <select
                          disabled
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                          }}
                        >
                          <option>-- Select {formData.label} --</option>
                          {optionsText
                            .split('\n')
                            .filter((o) => o.trim())
                            .map((opt, idx) => (
                              <option key={idx}>{opt.trim()}</option>
                            ))}
                        </select>
                      )}
                      {formData.fieldType === 'multi-select' && (
                        <select
                          multiple
                          disabled
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                            minHeight: '100px',
                          }}
                        >
                          {optionsText
                            .split('\n')
                            .filter((o) => o.trim())
                            .map((opt, idx) => (
                              <option key={idx}>{opt.trim()}</option>
                            ))}
                        </select>
                      )}
                      {formData.fieldType === 'text' && (
                        <input
                          type="text"
                          disabled
                          placeholder={
                            formData.helpText ||
                            `Enter ${formData.label.toLowerCase()}`
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                          }}
                        />
                      )}
                      {formData.fieldType === 'textarea' && (
                        <textarea
                          disabled
                          placeholder={
                            formData.helpText ||
                            `Enter ${formData.label.toLowerCase()}`
                          }
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                            fontFamily: 'inherit',
                          }}
                        />
                      )}
                      {formData.fieldType === 'date' && (
                        <input
                          type="date"
                          disabled
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                          }}
                        />
                      )}
                      {formData.fieldType === 'number' && (
                        <input
                          type="number"
                          disabled
                          placeholder={
                            formData.helpText ||
                            `Enter ${formData.label.toLowerCase()}`
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                          }}
                        />
                      )}
                      {formData.fieldType === 'checkbox' && (
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'not-allowed',
                          }}
                        >
                          <input
                            type="checkbox"
                            disabled
                            style={{ marginRight: '8px' }}
                          />
                          <span style={{ fontSize: '14px' }}>
                            {formData.label}
                          </span>
                        </label>
                      )}
                      {formData.helpText && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            marginTop: '4px',
                          }}
                        >
                          {formData.helpText}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <InlineStack space="200">
                  <Button variant="primary" onPress={handleSave}>
                    {editingField ? 'Update' : 'Create'} Field
                  </Button>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </InlineStack>
              </Stack>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
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
              zIndex: 9999,
              padding: '24px',
            }}
            onClick={() => {
              setShowImportModal(false);
              setSelectedSource(null);
              setSelectedFieldsForImport(new Set());
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Stack space="400">
                <div>
                  <Heading level={3}>Import from Government Standards</Heading>
                  <Text color="subdued">
                    Select a standard source and choose fields to import
                  </Text>
                </div>

                {!selectedSource ? (
                  // Source selection
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                    }}
                  >
                    {STANDARD_SOURCES.map((source) => (
                      <button
                        key={source.id}
                        onClick={() => setSelectedSource(source.id)}
                        style={{
                          padding: '24px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#7c3aed';
                          e.currentTarget.style.backgroundColor = '#f5f3ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <Stack space="200">
                          <div style={{ fontSize: '32px' }}>{source.icon}</div>
                          <Heading level={4}>{source.name}</Heading>
                          <Text variant="sm" color="subdued">
                            {source.description}
                          </Text>
                          <Text
                            variant="sm"
                            weight="500"
                            style={{ color: '#7c3aed' }}
                          >
                            {source.fields.length} fields available →
                          </Text>
                        </Stack>
                      </button>
                    ))}
                  </div>
                ) : (
                  // Field selection
                  <div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() => {
                        setSelectedSource(null);
                        setSelectedFieldsForImport(new Set());
                      }}
                      style={{ marginBottom: '16px' }}
                    >
                      ← Back to Sources
                    </Button>

                    {(() => {
                      const source = STANDARD_SOURCES.find(
                        (s) => s.id === selectedSource,
                      );
                      if (!source) return null;

                      return (
                        <Stack space="400">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            <div style={{ fontSize: '32px' }}>
                              {source.icon}
                            </div>
                            <div>
                              <Heading level={4}>{source.name}</Heading>
                              <Text variant="sm" color="subdued">
                                {source.description}
                              </Text>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text weight="500">
                              {selectedFieldsForImport.size} of{' '}
                              {source.fields.length} fields selected
                            </Text>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button
                                variant="secondary"
                                size="sm"
                                onPress={() => {
                                  const allFieldNames = new Set(
                                    source.fields.map((f) => f.name),
                                  );
                                  setSelectedFieldsForImport(allFieldNames);
                                }}
                              >
                                Select All
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onPress={() =>
                                  setSelectedFieldsForImport(new Set())
                                }
                              >
                                Clear All
                              </Button>
                            </div>
                          </div>

                          <div
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              maxHeight: '400px',
                              overflowY: 'auto',
                            }}
                          >
                            {source.fields.map((field, idx) => {
                              const exists = customFields.some(
                                (cf) => cf.name === field.name,
                              );
                              const isSelected = selectedFieldsForImport.has(
                                field.name,
                              );

                              return (
                                <div
                                  key={field.name}
                                  style={{
                                    padding: '16px',
                                    borderBottom:
                                      idx < source.fields.length - 1
                                        ? '1px solid #e5e7eb'
                                        : 'none',
                                    backgroundColor: exists
                                      ? '#fef3c7'
                                      : isSelected
                                        ? '#f5f3ff'
                                        : 'white',
                                    opacity: exists ? 0.6 : 1,
                                  }}
                                >
                                  <label
                                    style={{
                                      display: 'flex',
                                      cursor: exists
                                        ? 'not-allowed'
                                        : 'pointer',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={exists}
                                      onChange={() =>
                                        !exists &&
                                        toggleFieldForImport(field.name)
                                      }
                                      style={{
                                        marginRight: '12px',
                                        marginTop: '2px',
                                      }}
                                    />
                                    <div style={{ flex: 1 }}>
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          marginBottom: '4px',
                                        }}
                                      >
                                        <Text weight="500">{field.label}</Text>
                                        <span
                                          style={{
                                            padding: '2px 6px',
                                            backgroundColor: '#e5e7eb',
                                            color: '#374151',
                                            fontSize: '11px',
                                            borderRadius: '4px',
                                            fontWeight: 500,
                                          }}
                                        >
                                          {FIELD_TYPE_LABELS[field.fieldType]}
                                        </span>
                                        {field.required && (
                                          <span
                                            style={{
                                              padding: '2px 6px',
                                              backgroundColor: '#fee2e2',
                                              color: '#991b1b',
                                              fontSize: '11px',
                                              borderRadius: '4px',
                                              fontWeight: 500,
                                            }}
                                          >
                                            Required
                                          </span>
                                        )}
                                        {field.hmisCompliant && (
                                          <span
                                            style={{
                                              padding: '2px 6px',
                                              backgroundColor: '#dbeafe',
                                              color: '#1e40af',
                                              fontSize: '11px',
                                              borderRadius: '4px',
                                              fontWeight: 500,
                                            }}
                                          >
                                            HMIS
                                          </span>
                                        )}
                                        {exists && (
                                          <span
                                            style={{
                                              padding: '2px 6px',
                                              backgroundColor: '#fbbf24',
                                              color: '#78350f',
                                              fontSize: '11px',
                                              borderRadius: '4px',
                                              fontWeight: 500,
                                            }}
                                          >
                                            Already exists
                                          </span>
                                        )}
                                      </div>
                                      <Text
                                        variant="sm"
                                        color="subdued"
                                        style={{ marginBottom: '4px' }}
                                      >
                                        {field.helpText}
                                      </Text>
                                      <Text variant="xs" color="subdued">
                                        Field name: {field.name}
                                      </Text>
                                    </div>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </Stack>
                      );
                    })()}
                  </div>
                )}

                <InlineStack space="200" distribute="end">
                  <Button
                    variant="secondary"
                    onPress={() => {
                      setShowImportModal(false);
                      setSelectedSource(null);
                      setSelectedFieldsForImport(new Set());
                    }}
                  >
                    Cancel
                  </Button>
                  {selectedSource && (
                    <Button
                      variant="primary"
                      onPress={handleImportFields}
                      isDisabled={selectedFieldsForImport.size === 0}
                    >
                      Import {selectedFieldsForImport.size} Field
                      {selectedFieldsForImport.size !== 1 ? 's' : ''}
                    </Button>
                  )}
                </InlineStack>
              </Stack>
            </div>
          </div>
        )}
      </Stack>
    </PageLayout>
  );
}
