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
import { useSiteStore } from '@/lib/stores/siteStore';
import { Site } from '@/types/poc';
import PageLayout from '../../components/PageLayout';

export default function SitesPage() {
  const { sites, addSite, updateSite, deleteSite } = useSiteStore();

  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );

  const activeSites = sites.filter((s) => s.active);

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteSite(id);
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
              <Heading level={1}>Sites</Heading>
              <Text>Manage physical locations and sites</Text>
            </Stack>
            <Button
              variant="primary"
              onPress={() => {
                setEditingSite(null);
                setShowModal(true);
              }}
            >
              + Create Site
            </Button>
          </InlineStack>
        </Stack>

        {/* Stats */}
        <InlineStack gap="400">
          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Total Sites
              </Text>
              <Heading level={2}>{sites.length}</Heading>
            </Stack>
          </Card>

          <Card>
            <Stack space="200">
              <Text variant="sm" color="subdued">
                Active
              </Text>
              <Heading level={2}>{activeSites.length}</Heading>
            </Stack>
          </Card>
        </InlineStack>

        {/* Sites List */}
        <Card>
          <Stack space="400">
            <Heading level={2}>All Sites</Heading>

            {sites.length === 0 ? (
              <Text>No sites yet. Click "Create Site" to get started.</Text>
            ) : (
              <Stack space="300">
                {sites.map((site) => (
                  <Card key={site.id}>
                    <Stack space="200">
                      <InlineStack gap="300">
                        <Text weight="600">{site.name}</Text>
                        {site.active && (
                          <Text variant="sm" color="success">
                            ✓ Active
                          </Text>
                        )}
                      </InlineStack>
                      {site.address && <Text variant="sm">{site.address}</Text>}
                      {site.phone && (
                        <Text variant="sm" color="subdued">
                          {site.phone}
                        </Text>
                      )}
                      <InlineStack gap="200">
                        <Button
                          variant="secondary"
                          size="small"
                          onPress={() => handleEdit(site)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="small"
                          onPress={() => setShowDeleteConfirm(site.id)}
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
        <SiteModal
          site={editingSite}
          onClose={() => {
            setShowModal(false);
            setEditingSite(null);
          }}
          onSave={(data) => {
            if (editingSite) {
              updateSite(editingSite.id, data);
            } else {
              addSite(data);
            }
            setShowModal(false);
            setEditingSite(null);
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
                Are you sure you want to delete this site? This action cannot be
                undone.
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

interface SiteModalProps {
  site: Site | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

function SiteModal({ site, onClose, onSave }: SiteModalProps) {
  const [name, setName] = useState(site?.name || '');
  const [address, setAddress] = useState(site?.address || '');
  const [city, setCity] = useState(site?.city || '');
  const [state, setState] = useState(site?.state || '');
  const [zip, setZip] = useState(site?.zip || '');
  const [phone, setPhone] = useState(site?.phone || '');
  const [active, setActive] = useState(site?.active !== false);

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a site name');
      return;
    }

    onSave({
      name: name.trim(),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zip: zip.trim() || undefined,
      phone: phone.trim() || undefined,
      active,
    });
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
            <Heading level={2}>{site ? 'Edit Site' : 'Create Site'}</Heading>

            <Stack space="400">
              {/* Name */}
              <TextField
                label="Site Name *"
                value={name}
                onChange={setName}
                placeholder="Downtown Office"
              />

              {/* Address */}
              <TextField
                label="Address"
                value={address}
                onChange={setAddress}
                placeholder="123 Main St"
              />

              {/* City, State, Zip */}
              <InlineStack gap="400">
                <TextField
                  label="City"
                  value={city}
                  onChange={setCity}
                  placeholder="Springfield"
                />
                <TextField
                  label="State"
                  value={state}
                  onChange={setState}
                  placeholder="IL"
                />
                <TextField
                  label="ZIP"
                  value={zip}
                  onChange={setZip}
                  placeholder="62701"
                />
              </InlineStack>

              {/* Phone */}
              <TextField
                label="Phone"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="555-1234"
              />

              {/* Status */}
              <Select
                label="Status"
                selectedKey={active ? 'active' : 'inactive'}
                onSelectionChange={(key) => setActive(key === 'active')}
              >
                <SelectItem id="active">Active</SelectItem>
                <SelectItem id="inactive">Inactive</SelectItem>
              </Select>
            </Stack>

            {/* Actions */}
            <InlineStack gap="300">
              <Button variant="secondary" onPress={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onPress={handleSubmit}>
                {site ? 'Save Changes' : 'Create Site'}
              </Button>
            </InlineStack>
          </Stack>
        </Card>
      </div>
    </div>
  );
}
