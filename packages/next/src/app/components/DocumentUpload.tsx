'use client';

import { useState, useCallback } from 'react';
import { Stack, Text, Button } from '@bonterratech/stitch-extension';

interface DocumentUploadProps {
  onExtract: (data: any) => void;
  disabled?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

interface ExtractedField {
  value: string;
  confidence: number;
}

interface DocumentExtractionResult {
  firstName?: ExtractedField;
  lastName?: ExtractedField;
  dateOfBirth?: ExtractedField;
  address?: ExtractedField;
  documentType?: ExtractedField;
  documentNumber?: ExtractedField;
}

export default function DocumentUpload({ onExtract, disabled, isVisible = true, onToggleVisibility }: DocumentUploadProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    setError(null);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG or PNG file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadedImage(base64);
      setShowModal(true);

      // Auto-extract
      await extractDocument(base64);
    } catch (err) {
      setError('Failed to read file');
      console.error(err);
    }
  }, []);

  const extractDocument = useCallback(async (imageData: string) => {
    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch('/api/extract-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract data');
      }

      const result: DocumentExtractionResult = await response.json();

      console.log('Document extraction result:', result);

      // Convert to intake data format
      const extracted: any = {
        confidence: {},
      };

      if (result.firstName) {
        extracted.firstName = result.firstName.value;
        extracted.confidence.firstName = result.firstName.confidence;
      }

      if (result.lastName) {
        extracted.lastName = result.lastName.value;
        extracted.confidence.lastName = result.lastName.confidence;
      }

      if (result.dateOfBirth) {
        extracted.dateOfBirth = result.dateOfBirth.value;
        extracted.confidence.dateOfBirth = result.dateOfBirth.confidence;
      }

      if (result.address) {
        extracted.address = result.address.value;
        extracted.confidence.address = result.address.confidence;
      }

      console.log('Extracted data to pass:', extracted);

      onExtract(extracted);
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract document data');
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  }, [onExtract]);

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
    <>
      {/* Large Upload Area */}
      {isVisible && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            margin: '16px 24px',
            padding: '48px 24px',
            border: isDragging ? '2px dashed #2563eb' : '2px dashed #d1d5db',
            borderRadius: '12px',
            backgroundColor: isDragging ? '#eff6ff' : '#ffffff',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
          onClick={() => !disabled && document.getElementById('document-upload-intake')?.click()}
        >
          <input
            type="file"
            id="document-upload-intake"
            style={{ display: 'none' }}
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            disabled={disabled}
          />

          {/* Upload Icon */}
          <svg
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              color: '#9ca3af',
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            />
          </svg>

          {/* Upload Text */}
          <Text style={{ marginBottom: '8px' }}>
            <span style={{ color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}>Click to upload</span>
            <span style={{ color: '#6b7280' }}> or drag and drop</span>
          </Text>

          {/* Document Types */}
          <Text variant="sm" color="subdued" style={{ marginBottom: '4px' }}>
            Driver's License, State ID, Birth Certificate, Social Security Card
          </Text>

          {/* File Types */}
          <Text variant="sm" color="subdued">
            JPG, PNG or PDF (max 10MB)
          </Text>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
              }}
            >
              <Text variant="sm">{error}</Text>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for programmatic access */}
      {!isVisible && (
        <input
          type="file"
          id="document-upload-intake"
          style={{ display: 'none' }}
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          disabled={disabled}
        />
      )}

      {/* Modal */}
      {showModal && (
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
          }}
          onClick={() => !isExtracting && setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Stack space="400">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text weight="600" style={{ fontSize: '18px' }}>
                  Document Upload
                </Text>
                {!isExtracting && (
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <svg
                      style={{ width: '24px', height: '24px', color: '#6b7280' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Image Preview */}
              {uploadedImage && (
                <div>
                  <img
                    src={uploadedImage}
                    alt="Uploaded document"
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                </div>
              )}

              {/* Status */}
              {isExtracting && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      width: '40px',
                      height: '40px',
                      border: '4px solid #e5e7eb',
                      borderTopColor: '#7c3aed',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <Text style={{ marginTop: '16px' }}>Extracting data with AI...</Text>
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '6px',
                  }}
                >
                  <Text variant="sm">{error}</Text>
                </div>
              )}
            </Stack>
          </div>
        </div>
      )}

      {/* Add CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
