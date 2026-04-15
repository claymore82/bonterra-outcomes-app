import { create } from 'zustand';
import { Entity, EntityType } from '@/types/poc';

// Mock entities for POC
const mockEntities: Entity[] = [
  {
    id: 'ENTITY-001',
    tenantId: 'TENANT-001',
    name: 'Seattle Public Schools',
    entityType: 'school',
    description:
      'Partner school district providing educational support services',
    address: '2445 3rd Avenue South',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98134',
    phone: '(206) 252-0000',
    email: 'partnerships@seattleschools.org',
    website: 'https://www.seattleschools.org',
    contactPerson: 'Maria Santos',
    contactTitle: 'Community Partnerships Director',
    partnershipStatus: 'active',
    customData: {},
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2023-09-01'),
  },
  {
    id: 'ENTITY-002',
    tenantId: 'TENANT-001',
    name: 'Harborview Medical Center',
    entityType: 'healthcare_provider',
    description:
      'Healthcare partner providing medical and mental health services',
    address: '325 9th Avenue',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98104',
    phone: '(206) 744-3000',
    email: 'community@harborview.org',
    website: 'https://www.harborview.org',
    contactPerson: 'Dr. James Chen',
    contactTitle: 'Community Health Director',
    partnershipStatus: 'active',
    customData: {},
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2023-06-15'),
  },
  {
    id: 'ENTITY-003',
    tenantId: 'TENANT-001',
    name: 'Seattle Housing Authority',
    entityType: 'housing_authority',
    description: 'Government partner providing housing vouchers and support',
    address: '190 Queen Anne Avenue North',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98109',
    phone: '(206) 615-3300',
    email: 'info@seattlehousing.org',
    website: 'https://www.seattlehousing.org',
    contactPerson: 'Lisa Anderson',
    contactTitle: 'Program Coordinator',
    partnershipStatus: 'active',
    customData: {},
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
  },
  {
    id: 'ENTITY-004',
    tenantId: 'TENANT-001',
    name: 'Microsoft',
    entityType: 'employer',
    description: 'Employment partner offering job training and placement',
    address: '1 Microsoft Way',
    city: 'Redmond',
    state: 'WA',
    zipCode: '98052',
    phone: '(425) 882-8080',
    email: 'community@microsoft.com',
    website: 'https://www.microsoft.com',
    contactPerson: 'Robert Wilson',
    contactTitle: 'Community Engagement Manager',
    partnershipStatus: 'active',
    customData: {},
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'ENTITY-005',
    tenantId: 'TENANT-001',
    name: 'Sacred Heart Church',
    entityType: 'religious_organization',
    description:
      'Faith-based partner providing food bank and community support',
    address: '550 19th Avenue East',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98112',
    phone: '(206) 324-2573',
    email: 'outreach@sacredheart.org',
    contactPerson: "Father Michael O'Brien",
    contactTitle: 'Pastor',
    partnershipStatus: 'active',
    customData: {},
    createdAt: new Date('2023-11-05'),
    updatedAt: new Date('2023-11-05'),
  },
];

interface EntityStore {
  entities: Entity[];

  // Read operations
  getEntity: (id: string) => Entity | undefined;
  getEntitiesByType: (entityType: EntityType) => Entity[];
  getEntitiesByTenant: (tenantId: string) => Entity[];
  getActiveEntities: () => Entity[];
  searchEntities: (query: string) => Entity[];

  // Write operations
  createEntity: (
    entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Entity;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
}

export const useEntityStore = create<EntityStore>((set, get) => ({
  entities: mockEntities,

  getEntity: (id: string) => {
    return get().entities.find((e) => e.id === id);
  },

  getEntitiesByType: (entityType: EntityType) => {
    return get().entities.filter((e) => e.entityType === entityType);
  },

  getEntitiesByTenant: (tenantId: string) => {
    return get().entities.filter((e) => e.tenantId === tenantId);
  },

  getActiveEntities: () => {
    return get().entities.filter((e) => e.partnershipStatus === 'active');
  },

  searchEntities: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return get().entities.filter(
      (e) =>
        e.name.toLowerCase().includes(lowerQuery) ||
        e.entityType.toLowerCase().includes(lowerQuery) ||
        e.description?.toLowerCase().includes(lowerQuery),
    );
  },

  createEntity: (entityData) => {
    const newEntity: Entity = {
      ...entityData,
      id: `ENTITY-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      entities: [...state.entities, newEntity],
    }));

    return newEntity;
  },

  updateEntity: (id, updates) => {
    set((state) => ({
      entities: state.entities.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e,
      ),
    }));
  },

  deleteEntity: (id) => {
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
    }));
  },
}));
