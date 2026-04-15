'use client';

import Link from 'next/link';
import { Card, Heading, Text, Stack } from '@bonterratech/stitch-extension';
import { useCustomFieldStore } from '@/lib/stores/customFieldStore';
import PageLayout from '../../components/PageLayout';

export default function DemographicsPage() {
  const { customFields } = useCustomFieldStore();

  const demographicFields = customFields.filter(
    (field) =>
      field.profiles?.includes('hmis') ||
      field.profiles?.includes('general') ||
      field.hmisCompliant,
  );

  return (
    <PageLayout>
      <Stack space="600">
        {/* Header */}
        <Stack space="300">
          <Link href="/admin/settings">
            <Text color="link">← Back to Settings</Text>
          </Link>
          <Heading level={1}>Demographic Fields</Heading>
          <Text>Configure demographics and map to government standards</Text>
        </Stack>

        {/* Demographic Fields */}
        <Card>
          <Stack space="400">
            <Heading level={2}>
              Configured Fields ({demographicFields.length})
            </Heading>

            {demographicFields.length === 0 ? (
              <Text>No demographic fields configured yet.</Text>
            ) : (
              <Stack space="300">
                {demographicFields.map((field) => (
                  <Card key={field.id}>
                    <Stack space="200">
                      <Text weight="600">{field.label}</Text>
                      <Text variant="sm" color="subdued">
                        {field.name}
                      </Text>
                      <Text variant="sm">Type: {field.fieldType}</Text>
                      {field.hmisCompliant && (
                        <Text variant="sm" color="success">
                          ✓ HMIS Compliant
                        </Text>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>

        <Card>
          <Stack space="300">
            <Text variant="sm" color="subdued">
              💡 This is a simplified view. The full demographics page with HMIS
              mapping will be ported in a later phase.
            </Text>
          </Stack>
        </Card>
      </Stack>
    </PageLayout>
  );
}
