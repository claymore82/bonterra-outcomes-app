'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  Heading,
  Text,
  Stack,
  Button,
  InlineStack,
} from '@bonterratech/stitch-extension';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { useEnrollmentStore } from '@/lib/stores/enrollmentStore';
import { useProgramStore } from '@/lib/stores/programStore';
import { useCaseWorkerStore } from '@/lib/stores/caseWorkerStore';
import { useUserStore } from '@/lib/stores/userStore';
import PageLayout from '../components/PageLayout';

interface ParsedParticipant {
  rowNumber: number;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  gender?: string;
  [key: string]: any;
}

export default function BulkImportPage() {
  const router = useRouter();
  const { createParticipant } = useParticipantStore();
  const { createEnrollment } = useEnrollmentStore();
  const { programs } = useProgramStore();
  const { caseWorkers } = useCaseWorkerStore();
  const { currentProgramId, currentSiteId, currentTenantId } = useUserStore();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedParticipant[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {},
  );
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'complete'>(
    'upload',
  );
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
  }>({ success: 0, failed: 0 });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        setFile(files[0]);
      }
    },
    [],
  );

  const parseCSV = useCallback((text: string): ParsedParticipant[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const data: ParsedParticipant[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
      const row: ParsedParticipant = { rowNumber: i };

      headers.forEach((header, index) => {
        if (values[index]) {
          row[header] = values[index];
        }
      });

      data.push(row);
    }

    return data;
  }, []);

  const handleProcessFile = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setParsedData(parsed);

      // Auto-detect column mapping
      const headers = Object.keys(parsed[0] || {}).filter(
        (k) => k !== 'rowNumber',
      );
      const mapping: Record<string, string> = {};

      headers.forEach((header) => {
        const lower = header.toLowerCase();
        if (lower.includes('first') && lower.includes('name'))
          mapping[header] = 'firstName';
        else if (lower.includes('last') && lower.includes('name'))
          mapping[header] = 'lastName';
        else if (lower.includes('dob') || lower.includes('birth'))
          mapping[header] = 'dateOfBirth';
        else if (lower.includes('email')) mapping[header] = 'email';
        else if (lower.includes('phone')) mapping[header] = 'phoneNumber';
        else if (lower.includes('address')) mapping[header] = 'address';
        else if (lower.includes('gender') || lower.includes('sex'))
          mapping[header] = 'gender';
      });

      setColumnMapping(mapping);
      setStep('map');
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Failed to parse file. Please ensure it is a valid CSV.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, parseCSV]);

  const handleImport = useCallback(async () => {
    if (!currentProgramId) {
      alert('Please select a program from the header dropdown');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      for (const row of parsedData) {
        try {
          const mappedData: any = {};

          Object.entries(columnMapping).forEach(([sourceCol, targetField]) => {
            if (row[sourceCol]) {
              mappedData[targetField] = row[sourceCol];
            }
          });

          // Validate required fields
          if (!mappedData.firstName || !mappedData.lastName) {
            failedCount++;
            continue;
          }

          // Parse date of birth
          let dob: Date;
          if (mappedData.dateOfBirth) {
            dob = new Date(mappedData.dateOfBirth);
          } else {
            dob = new Date(1970, 0, 1); // Default date
          }

          // Parse gender
          let genderCode: 0 | 1 | 2 | 3 | 4 | 5 | 99 = 99;
          if (mappedData.gender) {
            const genderLower = mappedData.gender.toLowerCase();
            if (genderLower.includes('f') || genderLower === 'woman')
              genderCode = 0;
            else if (genderLower.includes('m') || genderLower === 'man')
              genderCode = 1;
            else if (genderLower.includes('trans')) genderCode = 2;
            else if (genderLower.includes('non') || genderLower.includes('nb'))
              genderCode = 3;
          }

          // Create participant
          const participant = createParticipant({
            firstName: mappedData.firstName,
            lastName: mappedData.lastName,
            dateOfBirth: dob,
            gender: genderCode,
            dobDataQuality: mappedData.dateOfBirth ? 1 : 2,
            email: mappedData.email,
            phoneNumber: mappedData.phoneNumber,
            address: mappedData.address,
            customData: {},
          });

          // Create enrollment
          createEnrollment({
            participantId: participant.id,
            programId: currentProgramId,
            tenantId: currentTenantId || 'TENANT-001',
            siteId: currentSiteId,
            enrollmentDate: new Date(),
            status: 'active',
          });

          successCount++;
        } catch (error) {
          console.error('Error creating participant:', error);
          failedCount++;
        }
      }

      setImportResults({ success: successCount, failed: failedCount });
      setStep('complete');
    } catch (error) {
      console.error('Bulk import error:', error);
      alert('An error occurred during import');
    } finally {
      setIsProcessing(false);
    }
  }, [
    parsedData,
    columnMapping,
    currentProgramId,
    currentSiteId,
    currentTenantId,
    createParticipant,
    createEnrollment,
  ]);

  return (
    <PageLayout>
      <Stack space="600">
        {/* Header */}
        <Stack space="300">
          <Link href="/">
            <Text color="link">← Back to Home</Text>
          </Link>
          <Heading level={1}>Bulk Import</Heading>
          <Text>Import multiple participants from CSV or Excel files</Text>
        </Stack>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: step === 'upload' ? '#7c3aed' : '#10b981',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
              }}
            >
              1
            </div>
            <Text weight={step === 'upload' ? '600' : '400'}>Upload</Text>
          </div>

          <div
            style={{
              width: '40px',
              height: '2px',
              backgroundColor: step === 'upload' ? '#e5e7eb' : '#10b981',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor:
                  step === 'upload'
                    ? '#e5e7eb'
                    : step === 'map'
                      ? '#7c3aed'
                      : '#10b981',
                color: step === 'upload' ? '#9ca3af' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
              }}
            >
              2
            </div>
            <Text
              weight={step === 'map' ? '600' : '400'}
              color={step === 'upload' ? 'subdued' : 'default'}
            >
              Map Columns
            </Text>
          </div>

          <div
            style={{
              width: '40px',
              height: '2px',
              backgroundColor: ['preview', 'complete'].includes(step)
                ? '#10b981'
                : '#e5e7eb',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: ['upload', 'map'].includes(step)
                  ? '#e5e7eb'
                  : step === 'preview'
                    ? '#7c3aed'
                    : '#10b981',
                color: ['upload', 'map'].includes(step) ? '#9ca3af' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
              }}
            >
              3
            </div>
            <Text
              weight={step === 'preview' ? '600' : '400'}
              color={['upload', 'map'].includes(step) ? 'subdued' : 'default'}
            >
              Preview & Import
            </Text>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <Card>
            <Stack space="400">
              <Heading level={2}>Upload CSV or Excel File</Heading>

              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    padding: '48px 24px',
                    border: isDragging
                      ? '2px dashed #2563eb'
                      : '2px dashed #d1d5db',
                    borderRadius: '12px',
                    backgroundColor: isDragging ? '#eff6ff' : '#ffffff',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() =>
                    document.getElementById('bulk-upload')?.click()
                  }
                >
                  <input
                    type="file"
                    id="bulk-upload"
                    style={{ display: 'none' }}
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                  />

                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                    📊
                  </div>
                  <Text style={{ marginBottom: '8px' }}>
                    <span
                      style={{
                        color: '#2563eb',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Click to upload
                    </span>
                    <span style={{ color: '#6b7280' }}> or drag and drop</span>
                  </Text>
                  <Text variant="sm" color="subdued">
                    CSV or Excel file (max 5MB)
                  </Text>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <InlineStack gap="300" verticalAlign="center">
                      <div style={{ fontSize: '32px' }}>📄</div>
                      <div style={{ flex: 1 }}>
                        <Text weight="600">{file.name}</Text>
                        <Text variant="sm" color="subdued">
                          {(file.size / 1024).toFixed(2)} KB
                        </Text>
                      </div>
                      <Button
                        variant="secondary"
                        size="small"
                        onPress={() => setFile(null)}
                      >
                        Remove
                      </Button>
                    </InlineStack>
                  </div>

                  <InlineStack gap="300">
                    <Button
                      variant="primary"
                      onPress={handleProcessFile}
                      isDisabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Process File'}
                    </Button>
                  </InlineStack>
                </div>
              )}

              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                }}
              >
                <Text weight="600" style={{ marginBottom: '8px' }}>
                  Expected CSV Format:
                </Text>
                <Text
                  variant="sm"
                  color="subdued"
                  style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}
                >
                  First Name,Last Name,Date of Birth,Email,Phone,Address{'\n'}
                  John,Smith,1985-03-15,john@email.com,555-1234,123 Main St
                  {'\n'}
                  Jane,Doe,1990-07-22,jane@email.com,555-5678,456 Oak Ave
                </Text>
              </div>
            </Stack>
          </Card>
        )}

        {/* Step 2: Map Columns */}
        {step === 'map' && (
          <Card>
            <Stack space="400">
              <Heading level={2}>Map Columns</Heading>
              <Text>Match your CSV columns to participant fields</Text>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                }}
              >
                <Text weight="600">Your Column</Text>
                <Text weight="600">Maps To</Text>

                {Object.keys(parsedData[0] || {})
                  .filter((k) => k !== 'rowNumber')
                  .map((column) => (
                    <React.Fragment key={column}>
                      <Text>{column}</Text>
                      <select
                        value={columnMapping[column] || ''}
                        onChange={(e) =>
                          setColumnMapping({
                            ...columnMapping,
                            [column]: e.target.value,
                          })
                        }
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: 'white',
                        }}
                      >
                        <option value="">Skip this column</option>
                        <option value="firstName">First Name</option>
                        <option value="lastName">Last Name</option>
                        <option value="dateOfBirth">Date of Birth</option>
                        <option value="email">Email</option>
                        <option value="phoneNumber">Phone Number</option>
                        <option value="address">Address</option>
                        <option value="gender">Gender</option>
                      </select>
                    </React.Fragment>
                  ))}
              </div>

              <InlineStack gap="300">
                <Button variant="secondary" onPress={() => setStep('upload')}>
                  Back
                </Button>
                <Button variant="primary" onPress={() => setStep('preview')}>
                  Continue to Preview
                </Button>
              </InlineStack>
            </Stack>
          </Card>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <Card>
            <Stack space="400">
              <Heading level={2}>Preview Import</Heading>
              <Text>{parsedData.length} participants will be imported</Text>

              <div
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead
                    style={{
                      backgroundColor: '#f9fafb',
                      position: 'sticky',
                      top: 0,
                    }}
                  >
                    <tr>
                      <th
                        style={{
                          padding: '12px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <Text variant="sm" weight="600">
                          #
                        </Text>
                      </th>
                      <th
                        style={{
                          padding: '12px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <Text variant="sm" weight="600">
                          First Name
                        </Text>
                      </th>
                      <th
                        style={{
                          padding: '12px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <Text variant="sm" weight="600">
                          Last Name
                        </Text>
                      </th>
                      <th
                        style={{
                          padding: '12px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <Text variant="sm" weight="600">
                          Date of Birth
                        </Text>
                      </th>
                      <th
                        style={{
                          padding: '12px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <Text variant="sm" weight="600">
                          Email
                        </Text>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, idx) => {
                      const mappedData: any = {};
                      Object.entries(columnMapping).forEach(
                        ([sourceCol, targetField]) => {
                          if (row[sourceCol]) {
                            mappedData[targetField] = row[sourceCol];
                          }
                        },
                      );

                      return (
                        <tr key={idx}>
                          <td
                            style={{
                              padding: '12px',
                              borderBottom: '1px solid #e5e7eb',
                            }}
                          >
                            <Text variant="sm">{idx + 1}</Text>
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              borderBottom: '1px solid #e5e7eb',
                            }}
                          >
                            <Text variant="sm">
                              {mappedData.firstName || <em>-</em>}
                            </Text>
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              borderBottom: '1px solid #e5e7eb',
                            }}
                          >
                            <Text variant="sm">
                              {mappedData.lastName || <em>-</em>}
                            </Text>
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              borderBottom: '1px solid #e5e7eb',
                            }}
                          >
                            <Text variant="sm">
                              {mappedData.dateOfBirth || <em>-</em>}
                            </Text>
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              borderBottom: '1px solid #e5e7eb',
                            }}
                          >
                            <Text variant="sm">
                              {mappedData.email || <em>-</em>}
                            </Text>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24',
                }}
              >
                <Text variant="sm">
                  ⚠️ All participants will be enrolled in the currently selected
                  program:{' '}
                  <strong>
                    {programs.find((p) => p.id === currentProgramId)?.name ||
                      'None'}
                  </strong>
                </Text>
              </div>

              <InlineStack gap="300">
                <Button variant="secondary" onPress={() => setStep('map')}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onPress={handleImport}
                  isDisabled={isProcessing || !currentProgramId}
                  style={{ backgroundColor: '#10b981' }}
                >
                  {isProcessing
                    ? 'Importing...'
                    : `Import ${parsedData.length} Participants`}
                </Button>
              </InlineStack>
            </Stack>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <Card>
            <Stack space="400" align="center">
              <div style={{ fontSize: '64px' }}>✅</div>
              <Heading level={2}>Import Complete!</Heading>
              <Text>
                Successfully imported {importResults.success} participant(s)
                {importResults.failed > 0 &&
                  ` • ${importResults.failed} failed`}
              </Text>

              <InlineStack gap="300">
                <Button variant="secondary" onPress={() => router.push('/')}>
                  Go to Home
                </Button>
                <Button
                  variant="primary"
                  onPress={() => router.push('/individuals')}
                >
                  View Participants
                </Button>
              </InlineStack>
            </Stack>
          </Card>
        )}
      </Stack>
    </PageLayout>
  );
}
