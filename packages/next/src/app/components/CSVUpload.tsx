'use client';

import { useState, useCallback } from 'react';
import { Stack, Text, Button, InlineStack } from '@bonterratech/stitch-extension';

interface CSVUploadProps {
  onExtract: (data: { headers: string[]; rows: any[]; autoMapping: Record<string, string>; isFamilyCSV?: boolean }) => void;
  disabled?: boolean;
  enrolleeType?: 'participant' | 'family' | 'entity';
}

export default function CSVUpload({ onExtract, disabled, enrolleeType = 'participant' }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const parseCSV = useCallback((text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
    const rows: any[] = [];
    const autoMapping: Record<string, string> = {};
    const warnings: string[] = [];

    // Detect if this is a family CSV
    const hasFamilyName = headers.some(h => h.toLowerCase().includes('family') && h.toLowerCase().includes('name'));
    const hasRelationship = headers.some(h => h.toLowerCase().includes('relationship'));
    const isFamilyCSV = hasFamilyName && hasRelationship;

    // Validate: Check if we have required columns
    const hasFirstName = headers.some(h => h.toLowerCase().includes('first') && h.toLowerCase().includes('name'));
    const hasLastName = headers.some(h => h.toLowerCase().includes('last') && h.toLowerCase().includes('name'));

    if (!hasFirstName || !hasLastName) {
      warnings.push('⚠️ CSV should have "First Name" and "Last Name" columns');
    }

    if (isFamilyCSV && !hasFamilyName) {
      warnings.push('⚠️ Family CSV should have "Family Name" column');
    }

    if (isFamilyCSV && !hasRelationship) {
      warnings.push('⚠️ Family CSV should have "Relationship" column');
    }

    // Auto-detect column mapping
    headers.forEach((header) => {
      const lower = header.toLowerCase();

      if (lower.includes('family') && lower.includes('name')) {
        autoMapping[header] = 'familyName';
      } else if (lower.includes('relationship')) {
        autoMapping[header] = 'relationship';
      } else if (lower.includes('first') && lower.includes('name')) {
        autoMapping[header] = 'firstName';
      } else if (lower.includes('last') && lower.includes('name')) {
        autoMapping[header] = 'lastName';
      } else if (lower.includes('dob') || lower.includes('birth')) {
        autoMapping[header] = 'dateOfBirth';
      } else if (lower.includes('email')) {
        autoMapping[header] = 'email';
      } else if (lower.includes('phone')) {
        autoMapping[header] = 'phoneNumber';
      } else if (lower.includes('address')) {
        autoMapping[header] = 'address';
      } else if (lower.includes('gender') || lower.includes('sex')) {
        autoMapping[header] = 'gender';
      }
    });

    // Parse rows and check for formatting issues
    const expectedColumnCount = headers.length;
    let rowsWithIssues = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, ''));

      // Check if column count matches
      if (values.length !== expectedColumnCount) {
        rowsWithIssues++;
        if (rowsWithIssues <= 3) { // Only report first 3 issues
          warnings.push(`⚠️ Row ${i + 1}: Expected ${expectedColumnCount} columns, found ${values.length}. Check for unquoted commas.`);
        }
        continue; // Skip malformed rows
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      rows.push(row);
    }

    if (rowsWithIssues > 3) {
      warnings.push(`⚠️ ${rowsWithIssues - 3} more rows have formatting issues`);
    }

    if (warnings.length > 0) {
      throw new Error(`CSV Format Issues:\n${warnings.join('\n')}\n\nTip: Wrap fields containing commas in quotes (e.g., "123 Main St, City, State")`);
    }

    if (rows.length === 0) {
      throw new Error('No valid data rows found after parsing. Please check your CSV format.');
    }

    return { headers, rows, autoMapping, isFamilyCSV };
  }, []);

  const processFile = useCallback(async (selectedFile: File) => {
    setError(null);

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);

      if (data.rows.length === 0) {
        throw new Error('No data rows found in CSV');
      }

      onExtract(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [parseCSV, onExtract]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        await processFile(files[0]);
      }
    },
    [processFile]
  );

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: '48px 24px',
          border: isDragging ? '2px dashed #2563eb' : '2px dashed #d1d5db',
          borderRadius: '12px',
          backgroundColor: isDragging ? '#eff6ff' : '#ffffff',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
        onClick={() => !disabled && document.getElementById('csv-upload-intake')?.click()}
      >
        <input
          type="file"
          id="csv-upload-intake"
          style={{ display: 'none' }}
          accept=".csv,text/csv,application/vnd.ms-excel"
          onChange={handleFileSelect}
          disabled={disabled}
        />

        {/* Upload Icon */}
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>

        {/* Upload Text */}
        <Text style={{ marginBottom: '8px' }}>
          <span style={{ color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}>Click to upload</span>
          <span style={{ color: '#6b7280' }}> or drag and drop</span>
        </Text>

        {/* File Info */}
        <Text variant="sm" color="subdued" style={{ marginBottom: '4px' }}>
          CSV file with participant data
        </Text>

        {/* File Types */}
        <Text variant="sm" color="subdued">
          CSV (max 5MB)
        </Text>

        {/* File Selected */}
        {file && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '6px',
          }}>
            <Text variant="sm" weight="600">{file.name}</Text>
            <Text variant="xs" color="subdued">
              {(file.size / 1024).toFixed(2)} KB
            </Text>
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <div style={{ marginTop: '16px' }}>
            <Text variant="sm">Processing CSV...</Text>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#fef2f2',
              border: '2px solid #fecaca',
              borderRadius: '8px',
            }}
          >
            <Stack space="200">
              <Text weight="600" style={{ color: '#dc2626' }}>❌ CSV Format Error</Text>
              <Text variant="sm" style={{ color: '#991b1b', whiteSpace: 'pre-wrap' }}>
                {error}
              </Text>
              <div style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: '#fffbeb',
                borderRadius: '6px',
                border: '1px solid #fcd34d',
              }}>
                <Text variant="sm" weight="600" style={{ color: '#92400e', marginBottom: '4px' }}>
                  How to fix:
                </Text>
                <Text variant="sm" style={{ color: '#92400e' }}>
                  • Make sure fields with commas are wrapped in quotes<br />
                  • Example: "123 Main St, Baltimore MD 21201"<br />
                  • Ensure all rows have the same number of columns<br />
                  • Include "First Name" and "Last Name" columns
                </Text>
              </div>
            </Stack>
          </div>
        )}
      </div>

      {/* Example Format */}
      <div style={{
        marginTop: '16px',
        padding: '16px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #bfdbfe',
      }}>
        <Text weight="600" style={{ marginBottom: '8px', fontSize: '14px' }}>Expected CSV Format:</Text>
        <Text variant="sm" color="subdued" style={{ fontFamily: 'monospace', whiteSpace: 'pre', fontSize: '12px' }}>
          {`First Name,Last Name,Date of Birth,Email,Phone,Address
John,Smith,1985-03-15,john@email.com,555-1234,123 Main St
Jane,Doe,1990-07-22,jane@email.com,555-5678,456 Oak Ave`}
        </Text>
      </div>
    </div>
  );
}
