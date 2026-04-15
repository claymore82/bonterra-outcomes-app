// Multi-Participant / Household Types

export type RelationshipType =
  | 'self' // Head of Household
  | 'spouse'
  | 'partner'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'guardian'
  | 'grandparent'
  | 'grandchild'
  | 'other';

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  self: 'Head of Household',
  spouse: 'Spouse',
  partner: 'Partner',
  child: 'Child',
  parent: 'Parent',
  sibling: 'Sibling',
  guardian: 'Guardian',
  grandparent: 'Grandparent',
  grandchild: 'Grandchild',
  other: 'Other Relation',
};

export interface HouseholdMember {
  id: string;
  tempId?: string; // Temporary ID during intake
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  approximateAge?: number;
  dobDataQuality?: 1 | 2 | 8 | 9 | 99;
  gender?: 0 | 1 | 2 | 3 | 4 | 5 | 99;
  phoneNumber?: string;
  email?: string;
  relationshipToHoH: RelationshipType;
  confidence: {
    firstName?: number;
    lastName?: number;
    dateOfBirth?: number;
    gender?: number;
    phoneNumber?: number;
    email?: number;
    relationshipToHoH?: number;
  };
}

export interface Household {
  id: string;
  headOfHouseholdId: string;
  members: HouseholdMember[];
  demographics?: Record<string, any>; // Household-level custom demographics (income, family type, etc.)
  createdAt: Date;
}
