'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import PageLayout from '../../components/PageLayout';
import { useParticipantStore } from '@/lib/stores/participantStore';
import { HMIS_GENDER_CODES } from '@/types/poc';

export default function CreateParticipantPage() {
  const router = useRouter();
  const { createParticipant } = useParticipantStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<0 | 1 | 2 | 3 | 4 | 5 | 99>(99);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter first and last name');
      return;
    }
    if (!dateOfBirth) {
      alert('Please enter date of birth');
      return;
    }

    setIsSubmitting(true);

    try {
      const participant = createParticipant({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: new Date(dateOfBirth),
        email: email.trim() || undefined,
        phoneNumber: phone.trim() || undefined,
        address: address.trim() || undefined,
        gender,
        dobDataQuality: 1,
        customData: {},
      });

      alert(
        `Successfully created participant ${participant.firstName} ${participant.lastName}`,
      );
      router.push(`/participants/${participant.id}`);
    } catch (error) {
      console.error('Error creating participant:', error);
      alert('Error creating participant. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/participants');
  };

  return (
    <PageLayout pageTitle="Create Participant">
      <Stack space="600">
        {/* Header */}
        <Stack space="300">
          <Link href="/participants">
            <Text color="link">← Back to Participants</Text>
          </Link>
          <Heading level={1}>Create New Participant</Heading>
          <Text color="subdued">Add a new participant to the system</Text>
        </Stack>

        {/* Form */}
        <Card>
          <Stack space="500">
            <Heading level={2}>Participant Information</Heading>

            {/* Name Fields */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <TextField
                label="First Name"
                value={firstName}
                onChange={setFirstName}
                isRequired
                placeholder="Enter first name"
              />
              <TextField
                label="Last Name"
                value={lastName}
                onChange={setLastName}
                isRequired
                placeholder="Enter last name"
              />
            </div>

            {/* Date of Birth and Gender */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px',
                  }}
                >
                  Date of Birth <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <Select
                label="Gender"
                selectedKey={gender.toString()}
                onSelectionChange={(key) =>
                  setGender(parseInt(key as string) as typeof gender)
                }
              >
                <SelectItem id="99">Data Not Collected</SelectItem>
                <SelectItem id="0">Female</SelectItem>
                <SelectItem id="1">Male</SelectItem>
                <SelectItem id="2">Transgender</SelectItem>
                <SelectItem id="3">Non-Binary</SelectItem>
                <SelectItem id="4">Culturally Specific Identity</SelectItem>
                <SelectItem id="5">Different Identity</SelectItem>
              </Select>
            </div>

            {/* Contact Information */}
            <Heading level={3}>Contact Information</Heading>

            <TextField
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="email@example.com"
            />

            <TextField
              label="Phone Number"
              value={phone}
              onChange={setPhone}
              placeholder="(555) 555-5555"
            />

            <TextField
              label="Address"
              value={address}
              onChange={setAddress}
              placeholder="123 Main St, City, State ZIP"
            />

            {/* Action Buttons */}
            <InlineStack gap="300" distribute="end">
              <Button
                variant="secondary"
                onPress={handleCancel}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmit}
                isDisabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Participant'}
              </Button>
            </InlineStack>
          </Stack>
        </Card>
      </Stack>
    </PageLayout>
  );
}
