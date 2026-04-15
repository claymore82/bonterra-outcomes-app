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
} from '@bonterratech/stitch-extension';
import { useTouchpointFieldStore } from '@/lib/stores/touchpointFieldStore';
import { TouchpointFieldCategory } from '@/types/touchpointFields';
import PageLayout from '../../components/PageLayout';

export default function TouchpointFieldsPage() {
  const { fields, toggleFieldActive } = useTouchpointFieldStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate stats
  const totalFields = fields.length;
  const activeFields = fields.filter(f => f.isActive).length;
  const categories = new Set(fields.map(f => f.category)).size;
  const autoPopulateFields = fields.filter(f => f.trigger.autoPopulate).length;

  // Get category counts
  const categoryCounts: Record<string, number> = {};
  fields.forEach(field => {
    categoryCounts[field.category] = (categoryCounts[field.category] || 0) + 1;
  });

  // Filter fields by category
  const filteredFields = selectedCategory === 'all'
    ? fields
    : fields.filter(f => f.category === selectedCategory);

  const categoryLabels: Record<TouchpointFieldCategory, string> = {
    housing: 'Housing',
    employment: 'Employment',
    health: 'Health',
    education: 'Education',
    financial: 'Financial',
    safety: 'Safety',
    legal: 'Legal',
    family: 'Family',
    general: 'General',
  };

  const fieldTypeLabels: Record<string, string> = {
    text: 'Text',
    number: 'Number',
    date: 'Date',
    dropdown: 'Dropdown',
    'multi-select': 'Multi-Select',
    checkbox: 'Checkbox',
    scale: 'Scale',
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
              <Heading level={1}>Touchpoint Custom Fields</Heading>
              <Text>Manage AI-assisted custom fields that trigger automatically in touchpoint notes</Text>
            </Stack>
            <Button variant="primary" onPress={() => alert('Create field coming soon')}>
              + Create Field
            </Button>
          </InlineStack>
        </Stack>

        {/* What are Smart Fields? Info Box */}
        <div style={{
          padding: '20px',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe',
        }}>
          <InlineStack gap="300">
            <div style={{
              fontSize: '28px',
              lineHeight: '1',
            }}>💡</div>
            <Stack space="200">
              <div>
                <Text weight="600" style={{ marginRight: '8px' }}>What are Smart Fields?</Text>
                <Text color="link" style={{ cursor: 'pointer' }}>Learn more</Text>
              </div>
              <Text variant="sm" color="subdued">
                Smart Fields eliminate tedious form-filling by automatically detecting and populating custom fields based on what case workers write in their touchpoint notes. Instead of facing 50+ empty form fields, workers just write naturally and AI suggests only the 2-3 relevant fields with pre-filled values.
              </Text>
            </Stack>
          </InlineStack>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Total Fields</Text>
              <Text style={{ fontSize: '32px', fontWeight: '600' }}>{totalFields}</Text>
            </Stack>
          </Card>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Active Fields</Text>
              <Text style={{ fontSize: '32px', fontWeight: '600', color: '#10b981' }}>{activeFields}</Text>
            </Stack>
          </Card>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Categories</Text>
              <Text style={{ fontSize: '32px', fontWeight: '600' }}>{categories}</Text>
            </Stack>
          </Card>
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">Auto-Populate</Text>
              <Text style={{ fontSize: '32px', fontWeight: '600', color: '#3b82f6' }}>{autoPopulateFields}</Text>
            </Stack>
          </Card>
        </div>

        {/* Category Filter Pills */}
        <div>
          <Text variant="sm" style={{ marginBottom: '12px', fontWeight: 500 }}>Filter by category:</Text>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedCategory === 'all' ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: selectedCategory === 'all' ? '#3b82f6' : 'white',
                color: selectedCategory === 'all' ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              All ({totalFields})
            </button>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: selectedCategory === key ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                  backgroundColor: selectedCategory === key ? '#3b82f6' : 'white',
                  color: selectedCategory === key ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {label} ({categoryCounts[key] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Field Cards */}
        <Stack space="300">
          {filteredFields.map((field) => (
            <Card key={field.id}>
              <Stack space="400">
                {/* Field Name and Badges */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: '18px', fontWeight: '600' }}>{field.name}</Text>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    backgroundColor: field.isActive ? '#dcfce7' : '#fee2e2',
                    color: field.isActive ? '#166534' : '#991b1b',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}>
                    {field.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}>
                    {categoryLabels[field.category]}
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}>
                    {fieldTypeLabels[field.fieldType]}
                  </span>
                </div>

                {/* Description */}
                {field.description && (
                  <Text variant="sm" color="subdued">{field.description}</Text>
                )}

                {/* Trigger Keywords */}
                <div>
                  <Text variant="sm" weight="500" style={{ marginBottom: '8px' }}>Trigger Keywords:</Text>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {field.trigger.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Options */}
                {field.options && field.options.length > 0 && (
                  <div>
                    <Text variant="sm" weight="500" style={{ marginBottom: '4px' }}>Options:</Text>
                    <Text variant="sm" color="subdued">{field.options.join(', ')}</Text>
                  </div>
                )}

                {/* Checkmarks */}
                <InlineStack gap="400">
                  {field.trigger.required && (
                    <Text variant="sm" style={{ color: '#dc2626' }}>✓ Required when triggered</Text>
                  )}
                  {field.trigger.autoPopulate && (
                    <Text variant="sm" style={{ color: '#16a34a' }}>✓ AI Auto-populate</Text>
                  )}
                </InlineStack>

                {/* Actions */}
                <InlineStack gap="200">
                  <Button
                    variant="secondary"
                    size="small"
                    onPress={() => toggleFieldActive(field.id)}
                  >
                    {field.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onPress={() => alert('Edit field coming soon')}
                  >
                    Edit
                  </Button>
                </InlineStack>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </PageLayout>
  );
}
