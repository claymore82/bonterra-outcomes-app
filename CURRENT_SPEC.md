# Bonterra Outcomes V1 - Current Implementation Spec

**Date:** 2026-04-03
**Status:** Active Development
**Version:** v1.0-alpha

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Data Models](#data-models)
5. [Core Features](#core-features)
6. [Critical Patterns](#critical-patterns)
7. [API Endpoints](#api-endpoints)
8. [Components](#components)
9. [User Flows](#user-flows)
10. [Current State & Next Steps](#current-state--next-steps)

---

## Overview

Bonterra Outcomes is a modern, AI-powered case management system designed to replace ETO, Apricot, and Penelope. This specification documents the current V1 implementation built with Next.js 15, React 19, Stitch design system, and AWS Bedrock AI.

**Key Capabilities:**
- Conversational AI intake for participants, families, and entities
- Multi-tenant architecture with program/site filtering
- Polymorphic enrollments (participant/family/entity → program)
- Document extraction using Claude Sonnet 4.5
- Program-specific custom demographics
- Smart case notes with AI extraction
- Real-time streaming AI responses

---

## Technology Stack

### Frontend
- **Framework:** Next.js 15.1.4 (App Router)
- **React:** 19.0.0
- **Design System:** Stitch v0.2.9 (`@bonterratech/stitch-extension`)
- **Styling:** StyleX + Stitch components (no Tailwind)
- **State Management:** Zustand (in-memory stores)
- **Icons:** Font Awesome via Stitch Icon component

### Backend / AI
- **Runtime:** Node.js (Next.js API routes)
- **AI Model:** Claude Sonnet 4.5 (`us.anthropic.claude-sonnet-4-5-20250929-v1:0`)
- **AI Service:** AWS Bedrock (BedrockRuntimeClient)
- **Region:** us-east-1
- **API Pattern:** Server-Sent Events (SSE) for streaming

### Configuration
- **Global AI Config:** `/packages/next/src/config/bedrock.ts`
  - `BEDROCK_MODEL_ID` - Claude Sonnet 4.5
  - `AWS_REGION` - us-east-1

### Infrastructure
- **Current:** Local development only (no deployment yet)
- **Future:** SST v3 + AWS Lambda + CloudFront (via bonstart template)

---

## Architecture

### Multi-Tenant Structure

```
Organization (Tenant)
  ├── Sites (optional geographic/physical locations)
  ├── Programs (services offered)
  │   ├── Custom Fields (program-specific demographics)
  │   └── Enrollments
  ├── Participants (individuals)
  ├── Families/Households (groups of participants)
  ├── Entities (organizations: schools, employers, etc.)
  ├── Case Workers (staff managing enrollments)
  └── Services & Touchpoints
```

### Master Context Pattern

**CRITICAL:** Every page that displays data MUST respect the master context selectors:
- `currentProgramId` - Selected program filter
- `currentSiteId` - Selected site filter
- Both stored in `useUserStore()`

**Documentation:**
- Pattern details: `/PATTERNS.md`
- Memory: `~/.claude/projects/-Users-sean-morris/memory/feedback_master_context.md`

---

## Data Models

### Core Entities

#### Participant
```typescript
{
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  approximateAge?: number;
  dobDataQuality: 1 | 2 | 8 | 9 | 99; // HMIS standard
  gender: 0 | 1 | 2 | 3 | 4 | 5 | 99; // HMIS codes
  phoneNumber?: string;
  email?: string;
  address?: string;
  customData: Record<string, any>; // Program-specific demographics
  createdAt: Date;
  updatedAt: Date;
}
```

#### Household (Family)
```typescript
{
  id: string;
  tenantId: string;
  name: string;
  members: Array<{
    id: string; // Participant ID
    relationshipToHoH: 'self' | 'spouse' | 'partner' | 'child' | 'parent' | 'sibling' | 'guardian' | 'grandparent' | 'grandchild' | 'other';
  }>;
  headOfHouseholdId: string; // Member with relationshipToHoH: "self"
  primaryAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Entity
```typescript
{
  id: string;
  tenantId: string;
  name: string;
  entityType: 'school' | 'employer' | 'healthcare_provider' | 'government_agency' | 'nonprofit_partner' | 'religious_organization' | 'housing_authority' | 'other';
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactPerson?: string;
  contactTitle?: string;
  partnershipStatus: 'active' | 'inactive' | 'pending';
  customData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Program
```typescript
{
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  programType: 'emergency_shelter' | 'transitional_housing' | 'rapid_rehousing' | 'permanent_supportive_housing' | 'homeless_prevention' | 'job_training' | 'mental_health' | 'substance_abuse' | 'other';
  status: 'active' | 'inactive' | 'planned';
  siteIds: string[]; // Programs can operate at multiple sites
  capacity?: number;
  currentEnrollment: number;
  startDate?: Date;
  endDate?: Date;
  fundingSource?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Enrollment (Polymorphic)
```typescript
{
  id: string;
  tenantId: string;

  // Polymorphic enrollee (one of these must be set)
  participantId?: string;
  householdId?: string;
  entityId?: string;

  programId: string;
  siteId?: string;
  caseWorkerId: string;

  enrollmentDate: Date;
  exitDate?: Date;
  status: 'active' | 'completed' | 'dismissed' | 'transferred';

  outcomeGoals?: string[];
  outcomes?: Outcome[];
  servicesReceived?: ServiceReceived[];

  createdAt: Date;
  updatedAt: Date;
}
```

#### Custom Field (Program Demographics)
```typescript
{
  id: string;
  tenantId: string;
  name: string; // Field key (e.g., "veteranStatus")
  label: string; // Display label (e.g., "Veteran Status")
  fieldType: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'textarea';
  appliesTo: 'individual' | 'family' | 'entity' | 'all';
  programSpecific: boolean;
  programIds?: string[]; // If programSpecific=true
  globalField: boolean; // Available to all programs
  required: boolean;
  visibleInIntake: boolean;
  options?: string[]; // For dropdown/checkbox
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Core Features

### 1. Intake Agent (Conversational Enrollment)

**Route:** `/intake`

**Features:**
- Three enrollee types: Individual (Participant), Family, Organization (Entity)
- AI-powered conversational data collection
- Streaming responses via SSE
- Document upload with OCR extraction
- Confidence indicators for AI-extracted data
- Manual editing capability
- Program-specific custom demographics
- Progress tracking (X of Y required fields)

**Flow:**
1. User selects enrollee type (👤 / 👨‍👩‍👧‍👦 / 🏢)
2. AI asks about program selection
3. AI collects demographics/info based on enrollee type
4. User can upload documents (driver's license, etc.) for auto-extraction
5. User can manually edit any extracted data
6. AI assigns case worker
7. Single click creates enrollee + enrollment

**API Endpoint:** `/api/intake/extract`
- Accepts: `enrolleeType`, `messages`, `availablePrograms`, `availableCaseWorkers`, `customFields`
- Returns: SSE stream with tokens and extracted data
- Uses different prompts based on enrollee type

**Document Upload:**
- Component: `/app/components/DocumentUpload.tsx`
- API: `/api/extract-document`
- Supports: JPG, PNG (max 10MB)
- Extracts: firstName, lastName, dateOfBirth, address
- Shows modal during extraction
- Auto-fills collected information panel

### 2. Enroll Existing

**Route:** `/enroll`

**Features:**
- Enroll existing participants, families, or entities
- Two modes:
  - Create NEW enrollee (then enroll)
  - Select EXISTING enrollee (then enroll)
- Pre-selection via URL parameter: `/enroll?participantId=123`
- Master context filtering
- Multi-step form with program/case worker selection

### 3. Participant Management

**Routes:**
- `/participants` - List all participants (with master context filtering)
- `/participants/create` - Manual participant creation form
- `/participants/create-agent` - AI-powered participant creation (DEPRECATED - replaced by `/intake`)
- `/participants/[id]` - Participant detail page

**Features:**
- Search by name/email/phone
- Filter by status (active/inactive)
- Filter by program (master context)
- Create new participants (manual or AI)
- Enroll button on each participant card
- Stats: Total, Active, Inactive counts

### 4. Family Management

**Routes:**
- `/families` - List all families (with master context filtering)
- `/families/create-agent` - AI-powered family creation
- `/families/[id]` - Family detail page
- `/families/[id]/enroll` - Enroll family in program

**Features:**
- Two creation modes:
  - AI creation: Creates new participants + family
  - Existing selection: Forms family from existing participants
- Searchable participant list with checkboxes
- Head of household selection
- Custom family name
- Manual editing of family members
- Relationship tracking

**API Endpoint:** `/api/families/extract`
- Conversational family member collection
- Extracts: familyName, familyMembers[], headOfHouseholdId
- Two-pass extraction: streaming conversation + structured data extraction

### 5. Case Notes & Touchpoints

**Route:** `/case-notes` (POC - not yet migrated)

**Features:**
- AI extraction of:
  - Services provided (with quantities/amounts)
  - Goal progress tracking
  - Outcome achievements
  - Status changes (employment, housing, income, health)
  - Emotional state
  - Risk flags
  - Action items
- Smart field suggestions (program-specific touchpoint fields)
- Service transaction creation
- Outcome tracking

**API Endpoint:** `/api/case-notes/extract`
- Accepts: participantId, noteText, participantContext, touchpointFields
- Returns: SSE stream with extracted insights
- Two-stage extraction: main insights + custom touchpoint fields

### 6. Custom Demographics Configuration

**Route:** `/admin/custom-fields`

**Features:**
- Create program-specific demographic fields
- Field types: text, number, date, dropdown, checkbox, textarea
- Applies to: individual, family, entity, or all
- Program-specific vs global fields
- Required/optional toggle
- Visible in intake toggle
- Options configuration (for dropdown/checkbox)
- Validation rules (min/max, pattern)

**Usage:**
- Fields are loaded dynamically in intake agent based on selected program
- Stored in participant/family/entity `customData` object
- AI extracts custom field values during conversation

### 7. Admin Features

**Routes:**
- `/admin/settings` - General settings
- `/admin/case-workers` - Case worker management
- `/admin/programs` - Program management
- `/admin/sites` - Site management
- `/admin/sites/create-agent` - AI-powered site creation
- `/admin/services` - Service types configuration
- `/admin/custom-fields` - Custom demographics configuration
- `/admin/touchpoint-fields` - Smart field configuration

**Features:**
- CRUD operations for all entities
- Program capacity tracking
- Case worker caseload tracking
- Site creation with AI agent
- Service type library

---

## Critical Patterns

### Master Context Filtering

**REQUIRED ON ALL LIST PAGES**

Every page that displays programs, sites, participants, families, enrollments, or entities MUST filter by:
- `currentProgramId` - from `useUserStore()`
- `currentSiteId` - from `useUserStore()`

**Implementation:**
```typescript
import { useUserStore } from '@/lib/stores/userStore';

const { currentProgramId, currentSiteId } = useUserStore();

// Filter programs
const filteredPrograms = programs.filter((p) => {
  if (p.status !== 'active') return false;

  if (currentProgramId && currentProgramId !== '') {
    return p.id === currentProgramId;
  }

  if (currentSiteId && currentSiteId !== '') {
    return p.siteIds.length === 0 || p.siteIds.includes(currentSiteId);
  }

  return true;
});

// Filter participants by enrollment
const filteredParticipants = participants.filter((participant) => {
  const activeEnrollments = getActiveEnrollments();
  const participantEnrollments = activeEnrollments.filter(e => e.participantId === participant.id);

  if (participantEnrollments.length === 0 && (currentProgramId || currentSiteId)) {
    return false;
  }

  if (currentProgramId && currentProgramId !== '') {
    return participantEnrollments.some(e => e.programId === currentProgramId);
  }

  if (currentSiteId && currentSiteId !== '') {
    return participantEnrollments.some(e => e.siteId === currentSiteId);
  }

  return true;
});
```

**Documentation:** `/PATTERNS.md`

### Polymorphic Enrollments

Enrollments can link to three different enrollee types:
- `participantId` - Individual enrollment
- `householdId` - Family enrollment (all members enrolled together)
- `entityId` - Organization enrollment

**Only ONE of these fields should be set per enrollment.**

### HMIS Compliance

**Gender Codes:**
- 0 = Female/Woman
- 1 = Male/Man
- 2 = Transgender
- 3 = Non-Binary
- 4 = Culturally Specific Identity
- 5 = Different Identity
- 99 = Data Not Collected

**DOB Data Quality:**
- 1 = Full DOB reported
- 2 = Approximate or partial DOB reported
- 8 = Client doesn't know
- 9 = Client prefers not to answer
- 99 = Data not collected

---

## API Endpoints

### AI Extraction Endpoints

All AI endpoints use Claude Sonnet 4.5 via AWS Bedrock with streaming responses (SSE).

#### POST `/api/intake/extract`
**Purpose:** Extract participant/family/entity info + enrollment details

**Request:**
```json
{
  "enrolleeType": "participant" | "family" | "entity",
  "messages": [
    { "role": "user" | "assistant", "content": "string" }
  ],
  "availablePrograms": [
    { "id": "string", "name": "string" }
  ],
  "availableCaseWorkers": [
    { "id": "string", "name": "string" }
  ],
  "customFields": [
    {
      "name": "string",
      "label": "string",
      "fieldType": "text" | "dropdown" | etc,
      "options": ["string"],
      "required": boolean
    }
  ]
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"type": "token", "content": "Hello"}
data: {"type": "extraction", "data": {...}}
data: {"type": "done"}
data: {"type": "error", "error": "message"}
```

**Extraction Data Format:**

For **participant**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "approximateAge": number,
  "gender": 0-5 | 99,
  "email": "string",
  "phoneNumber": "string",
  "address": "string",
  "customFields": { "fieldName": "value" },
  "program": "string",
  "programId": "string",
  "caseWorker": "string",
  "caseWorkerId": "string",
  "enrollmentDate": "YYYY-MM-DD"
}
```

For **family**:
```json
{
  "familyName": "string",
  "familyMembers": [
    {
      "tempId": "temp-1",
      "firstName": "string",
      "lastName": "string",
      "dateOfBirth": "YYYY-MM-DD",
      "approximateAge": number,
      "gender": 0-5 | 99,
      "phoneNumber": "string",
      "email": "string",
      "relationshipToHoH": "self" | "spouse" | "child" | etc
    }
  ],
  "headOfHouseholdId": "temp-1",
  "address": "string",
  "program": "string",
  "programId": "string",
  "caseWorker": "string",
  "caseWorkerId": "string"
}
```

For **entity**:
```json
{
  "entityName": "string",
  "entityType": "school" | "employer" | etc,
  "entityDescription": "string",
  "entityAddress": "string",
  "entityCity": "string",
  "entityState": "XX",
  "entityZipCode": "string",
  "entityPhone": "string",
  "entityEmail": "string",
  "entityWebsite": "string",
  "contactPerson": "string",
  "contactTitle": "string",
  "program": "string",
  "programId": "string",
  "caseWorker": "string",
  "caseWorkerId": "string"
}
```

#### POST `/api/extract-document`
**Purpose:** Extract data from ID documents using Claude Sonnet 4.5 vision

**Request:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "firstName": { "value": "string", "confidence": 0.98 },
  "lastName": { "value": "string", "confidence": 0.98 },
  "dateOfBirth": { "value": "YYYY-MM-DD", "confidence": 0.92 },
  "address": { "value": "string", "confidence": 0.90 },
  "documentType": { "value": "Driver's License", "confidence": 0.95 },
  "documentNumber": { "value": "string", "confidence": 0.95 }
}
```

**Supported Documents:**
- Driver's License
- State ID
- Passport
- Birth Certificate

#### POST `/api/families/extract`
**Purpose:** Extract family member data (conversational)

**Request:**
```json
{
  "messages": [
    { "role": "user" | "assistant", "content": "string" }
  ],
  "existingParticipants": []
}
```

**Response:** SSE stream (same format as `/api/intake/extract`)

#### POST `/api/case-notes/extract`
**Purpose:** Extract insights from case notes

**Request:**
```json
{
  "participantId": "string",
  "noteText": "string",
  "participantContext": {
    "name": "string",
    "program": "string",
    "outcomeGoal": "string"
  },
  "touchpointFields": [
    {
      "id": "string",
      "name": "string",
      "fieldType": "string",
      "trigger": { "keywords": ["string"] }
    }
  ]
}
```

**Response:** SSE stream
```
data: {"type": "extraction", "data": {...}}
data: {"type": "customFields", "data": {...}}
data: {"type": "done"}
```

---

## Components

### Core UI Components (Stitch)

All components from `@bonterratech/stitch-extension`:
- `Button` - Primary, secondary, tertiary variants
- `TextField` - Text input with label
- `Select` / `SelectItem` - Dropdown selection
- `Stack` - Vertical layout with spacing
- `InlineStack` - Horizontal layout
- `Columns` - Multi-column grid layout
- `Heading` - H1-H6 headings
- `Text` - Body text with variants
- `Card` - Container with padding/border
- `Icon` - Font Awesome icons
- `Divider` - Horizontal line separator

### Custom Components

#### PageLayout (`/app/components/PageLayout.tsx`)
Wraps all pages with header navigation and master context selectors.

**Props:**
- `pageTitle: string` - Page title for header

**Usage:**
```tsx
<PageLayout pageTitle="Participants">
  <Stack space="400">
    {/* Page content */}
  </Stack>
</PageLayout>
```

#### Header (`/app/components/Header.tsx`)
Purple banner with logo, site selector, program selector, and user menu.

**Features:**
- Site dropdown (filters by currentSiteId)
- Program dropdown (filters by currentProgramId)
- User profile menu
- Logo + app name

#### SideNav (`/app/components/SideNav.tsx`)
Left navigation with app sections and admin.

**Navigation Items:**
- Home (/)
- Participants (/participants)
- Families (/families)
- Intake Agent (/intake) ⭐
- Enroll Existing (/enroll)
- Record Service (/services/record)
- Administration (/admin/settings) - Admin only

#### DocumentUpload (`/app/components/DocumentUpload.tsx`)
Large drag-and-drop area for document upload with AI extraction.

**Props:**
- `onExtract: (data: any) => void` - Callback with extracted data
- `disabled?: boolean` - Disable upload
- `isVisible?: boolean` - Show/hide upload area
- `onToggleVisibility?: () => void` - Toggle visibility callback

**Features:**
- Drag-and-drop
- File picker (click to upload)
- Validation (JPG/PNG, max 10MB)
- Modal with extraction progress
- Auto-extraction using `/api/extract-document`

**Usage:**
```tsx
<DocumentUpload
  onExtract={handleDocumentExtract}
  disabled={isTyping}
  isVisible={showUpload}
  onToggleVisibility={() => setShowUpload(!showUpload)}
/>
```

#### SimpleBadge (`/app/components/SimpleBadge.tsx`)
Status badges (Active/Inactive, High/Low confidence, etc.)

**Props:**
- `tone: 'positive' | 'neutral' | 'negative'`
- `children: React.ReactNode`

---

## User Flows

### Flow 1: Enroll New Participant via Intake Agent

1. Navigate to `/intake`
2. Select "Individual" enrollee type
3. AI asks: "Which program is this participant enrolling in?"
4. User responds: "Job Training"
5. **OPTIONAL:** Click "Upload Document", upload driver's license
   - AI extracts name, DOB, address
   - Data appears in Collected Information panel
6. AI asks about missing demographics (if needed)
7. User provides info conversationally
8. AI extracts and displays:
   - Program ✅ High confidence
   - First Name ✅ High confidence
   - Last Name ✅ High confidence
   - Date of Birth ✅ High confidence
   - Program-specific demographics
9. AI asks about case worker assignment
10. User responds: "Sarah Johnson"
11. Progress bar shows: "5 of 5 required fields" ✅
12. Click "Complete Intake & Enroll"
13. System creates participant + enrollment
14. Redirects to `/participants/{id}`

### Flow 2: Enroll New Family via Intake Agent

1. Navigate to `/intake`
2. Select "Family" enrollee type
3. AI asks: "Which program is this family enrolling in?"
4. User responds: "Emergency Shelter"
5. AI asks: "Tell me about the family members"
6. User describes each member:
   - "Maria Garcia, age 35, head of household"
   - "Carlos Garcia, age 8, her son"
   - "Sofia Garcia, age 5, her daughter"
7. AI extracts:
   - familyMembers: [Maria (self), Carlos (child), Sofia (child)]
   - headOfHouseholdId: Maria's tempId
8. AI asks about case worker
9. User responds: "Tom Wilson"
10. Click "Complete Intake & Enroll"
11. System creates:
    - 3 participants (Maria, Carlos, Sofia)
    - 1 household
    - 1 enrollment (linked to household)
12. Redirects to `/families/{id}`

### Flow 3: Enroll Existing Participant

1. Navigate to `/participants`
2. Find participant "John Doe"
3. Click "Enroll" button on participant card
4. Redirects to `/enroll?participantId=123`
5. Page pre-selects:
   - Enrollee Type: Participant
   - Action Type: Existing
   - Selected Enrollee: John Doe
6. Select program from dropdown
7. Select case worker from dropdown
8. Click "Enroll"
9. System creates enrollment
10. Redirects to `/participants/123`

### Flow 4: Create Family from Existing Participants

1. Navigate to `/families/create-agent`
2. Select "Existing" mode
3. Search for participants: "Garcia"
4. Check boxes for:
   - Maria Garcia
   - Carlos Garcia
   - Sofia Garcia
5. Select "Maria Garcia" as head of household
6. Enter family name: "Garcia Family"
7. Click "Create Family from Selected Participants"
8. System creates household linking existing participants
9. Redirects to `/families/{id}`

---

## Current State & Next Steps

### ✅ Completed Features

- [x] Multi-tenant architecture with master context
- [x] Intake Agent with 3 enrollee types (participant/family/entity)
- [x] Document upload with AI extraction (Claude vision)
- [x] Program-specific custom demographics
- [x] Polymorphic enrollments
- [x] Participant management (CRUD)
- [x] Family management (AI + manual creation)
- [x] Case worker management
- [x] Program management
- [x] Site management (with AI agent)
- [x] Services configuration
- [x] Custom fields configuration
- [x] Touchpoint fields configuration
- [x] Master context filtering on all list pages
- [x] Confidence indicators for AI-extracted data
- [x] Manual editing of AI-extracted data
- [x] Progress tracking (X of Y required fields)
- [x] Enroll existing flow with URL parameter support
- [x] Stitch design system integration
- [x] Global Bedrock config (`/config/bedrock.ts`)

### 🚧 In Progress

- [ ] Touchpoint detail page migration to Stitch (started)
- [ ] Case notes page migration to Stitch
- [ ] Entity detail pages
- [ ] Enrollment detail pages

### 📋 Todo

**High Priority:**
- [ ] Add persistence layer (replace in-memory Zustand with DynamoDB or RDS)
- [ ] Authentication (Auth0 or Cognito)
- [ ] Authorization (role-based access control)
- [ ] Multi-environment deployment (dev/staging/prod)
- [ ] Reporting & analytics
- [ ] Audit logging
- [ ] Data export (CSV, Excel)

**Medium Priority:**
- [ ] Voice input & transcription
- [ ] Proactive insights & risk detection
- [ ] Conversational reporting
- [ ] Document management (upload/view/search)
- [ ] Email notifications
- [ ] Calendar/scheduling
- [ ] Search across all entities

**Low Priority:**
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Real-time collaboration
- [ ] Data visualization dashboards

### Known Issues

1. **No Persistence:** All data is in-memory (Zustand). Page refresh loses all data.
2. **No Auth:** Anyone can access any page. No user roles/permissions.
3. **No Validation:** Limited form validation. Need comprehensive validation rules.
4. **No Error Handling:** API errors are basic alerts. Need proper error boundaries.
5. **No Loading States:** Some operations don't show loading indicators.
6. **No Tests:** Zero test coverage. Need unit/integration/e2e tests.

### Migration Path to Production

**Option A: Add to Current App (In-Place)**
- Add DynamoDB/RDS persistence
- Add Auth0/Cognito authentication
- Deploy to Lambda + CloudFront manually
- Build CI/CD pipeline from scratch

**Option B: Migrate to Bonstart Template**
- Port current code to bonstart starter template
- Get SST v3 + CI/CD + Stitch out-of-box
- Production-ready infrastructure
- Bonterra standard patterns
- Estimated: 2-3 weeks

**Recommendation:** Option B (bonstart) for faster production readiness

---

## File Structure

```
bonterra-outcomes-app/
├── packages/
│   └── next/
│       ├── src/
│       │   ├── app/
│       │   │   ├── admin/
│       │   │   │   ├── case-workers/page.tsx
│       │   │   │   ├── custom-fields/page.tsx
│       │   │   │   ├── programs/page.tsx
│       │   │   │   ├── services/page.tsx
│       │   │   │   ├── sites/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── create-agent/page.tsx
│       │   │   │   ├── settings/page.tsx
│       │   │   │   └── touchpoint-fields/page.tsx
│       │   │   ├── api/
│       │   │   │   ├── case-notes/extract/route.ts
│       │   │   │   ├── extract-document/route.ts
│       │   │   │   ├── families/extract/route.ts
│       │   │   │   ├── intake/extract/route.ts ⭐
│       │   │   │   └── participants/extract/route.ts
│       │   │   ├── components/
│       │   │   │   ├── DocumentUpload.tsx ⭐
│       │   │   │   ├── Header.tsx
│       │   │   │   ├── PageLayout.tsx
│       │   │   │   ├── SideNav.tsx
│       │   │   │   └── SimpleBadge.tsx
│       │   │   ├── enroll/page.tsx
│       │   │   ├── families/
│       │   │   │   ├── page.tsx
│       │   │   │   ├── create-agent/page.tsx
│       │   │   │   └── [id]/
│       │   │   │       ├── page.tsx
│       │   │   │       └── enroll/page.tsx
│       │   │   ├── intake/page.tsx ⭐ NEW
│       │   │   ├── participants/
│       │   │   │   ├── page.tsx
│       │   │   │   ├── create/page.tsx
│       │   │   │   ├── create-agent/page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   ├── touchpoints/[id]/page.tsx
│       │   │   └── layout.tsx
│       │   ├── config/
│       │   │   └── bedrock.ts ⭐ Global AI config
│       │   ├── lib/
│       │   │   └── stores/
│       │   │       ├── caseWorkerStore.ts
│       │   │       ├── customFieldStore.ts
│       │   │       ├── enrollmentStore.ts
│       │   │       ├── entityStore.ts
│       │   │       ├── householdStore.ts
│       │   │       ├── participantStore.ts
│       │   │       ├── programStore.ts
│       │   │       ├── siteStore.ts
│       │   │       ├── touchpointFieldStore.ts
│       │   │       └── userStore.ts
│       │   └── types/
│       │       ├── household.ts
│       │       └── poc.ts
│       └── package.json
├── CURRENT_SPEC.md ⭐ This file
├── PATTERNS.md ⭐ Critical patterns
└── README.md
```

---

## Important Files Reference

### Configuration
- `/config/bedrock.ts` - Global AI model config (Claude Sonnet 4.5)

### Documentation
- `/CURRENT_SPEC.md` - This specification
- `/PATTERNS.md` - Master context pattern documentation
- `~/.claude/projects/-Users-sean-morris/memory/feedback_master_context.md` - Memory file to prevent forgetting master context

### Core Pages
- `/intake/page.tsx` - **Primary enrollment flow** (participant/family/entity)
- `/enroll/page.tsx` - Enroll existing enrollees
- `/participants/page.tsx` - Participant list
- `/families/page.tsx` - Family list

### API Routes
- `/api/intake/extract/route.ts` - **Primary AI extraction** (all enrollee types)
- `/api/extract-document/route.ts` - Document OCR extraction

### Components
- `/components/DocumentUpload.tsx` - Document upload with AI extraction
- `/components/PageLayout.tsx` - Page wrapper with header
- `/components/Header.tsx` - Purple banner with master context selectors

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

**Dev Server:** http://localhost:3000

---

## Environment Variables

```bash
# AWS Bedrock (Required)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Bedrock Model (Optional - defaults to Claude Sonnet 4.5)
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-5-20250929-v1:0

# GitHub Packages (Required for Stitch)
GITHUB_TOKEN=your-github-token
```

---

## Conclusion

This specification documents the current state of Bonterra Outcomes V1 as of April 3, 2026. The application successfully implements:

✅ **Modern AI-powered intake** with conversational data collection
✅ **Multi-tenant architecture** with program/site filtering
✅ **Polymorphic enrollments** supporting participants, families, and entities
✅ **Document extraction** using Claude Sonnet 4.5 vision
✅ **Program-specific demographics** with custom fields
✅ **Stitch design system** for consistent UI

**Next major milestone:** Add persistence layer and authentication to prepare for production deployment.

---

---

## Recent Updates (April 15, 2026)

### Fund Management & Budget Tracking

**Status:** ✅ Complete

**Overview:** Comprehensive budget management system that tracks program funding, service costs, and spending limits.

**Key Components:**

1. **Program Budgets**
   - `Program.budget` field added to data model
   - Set annual budget in program edit form
   - Optional field (programs can operate without budgets)

2. **Service Cost Tracking**
   - `ServiceType.costPerUnit` for all service types
   - Automatic cost calculation: `quantity × costPerUnit`
   - Historical spending tracked per transaction

3. **Real-Time Budget Validation**
   - Live validation when recording services
   - Blocks over-budget service delivery
   - Visual indicators: ✓ Funds Available / ❌ Insufficient Funds
   - Shows current spending, remaining funds, service cost

4. **Budget Visualization**
   - Dashboard budget card with spending breakdown
   - Utilization % with color-coded progress bar (green/orange/red)
   - Stacked bar chart: Funds Disbursed vs. Available
   - Multi-program comparison chart (drillable)
   - Click any bar to drill down to that program

5. **Participant-Level Tracking**
   - "Funds Distributed" card on participant profile
   - Shows total value of services received
   - Sums across all enrollments

6. **Service History Tab**
   - New "Services" tab on participant profile
   - Complete table: Date, Service, Program, Quantity, **Cost**, Provider, Status
   - Sorted by most recent first

**Implementation:**
- `/lib/stores/serviceStore.ts` - `calculateProgramSpending()` method
- `/app/services/record/page.tsx` - Budget validation logic
- `/app/components/ProgramDashboard.tsx` - Budget cards & charts
- `/app/components/ClientOnlyCharts.tsx` - `ClientStackedBarChart` component
- `/app/admin/programs/page.tsx` - Budget field in program form

---

### Check-In Scheduling System

**Status:** ✅ Complete

**Overview:** Appointment scheduling system for case workers to track and manage upcoming participant check-ins.

**Key Components:**

1. **Schedule Next Check-In**
   - "Next Check-In" datetime field on case note form
   - Saves to `Enrollment.nextCheckIn` field
   - Optional - not required for all case notes
   - Updates when case note submitted

2. **Dashboard Check-In Widget**
   - `UpcomingCheckIns.tsx` component on main dashboard
   - Shows check-ins for next 7 days
   - Filtered by logged-in case worker
   - Active enrollments only
   - Sorted by date (earliest first)

3. **Color-Coded Urgency Levels**
   - 🔴 **Red (Overdue):** Past scheduled time + "OVERDUE" badge
   - 🟠 **Orange (Today):** Same calendar day + "TODAY" badge
   - 🟣 **Purple (Upcoming):** Within 7 days

4. **Time-Until Display**
   - Countdown for check-ins within 48 hours
   - "Less than 1 hour", "2 hours", etc.
   - Date-only for check-ins beyond 48 hours

5. **Integration Points**
   - Participant profile Enrollments tab
   - Enrollment detail page (Program Info card)
   - Calendar icon with urgency color
   - Formatted date/time display

6. **Quick Actions**
   - "View Profile" button - navigate to participant
   - "Add Note" button - directly to case note form
   - One-click access from dashboard widget

**Implementation:**
- `/app/components/UpcomingCheckIns.tsx` - NEW dashboard widget
- `/app/participants/[id]/add-case-note/page.tsx` - Scheduling UI
- `/app/participants/[id]/page.tsx` - Profile display
- `/app/enrollments/[id]/page.tsx` - Enrollment detail
- `/types/poc.ts` - `Enrollment.nextCheckIn` field
- `/lib/stores/enrollmentStore.ts` - Uses `updateEnrollment()`

---

### Technical Improvements

**Chart Interactivity:**
- Fixed budget chart drillability with proper data indexing
- Added click handlers to stacked bar charts
- Charts now properly select clicked program

**UI Layout:**
- Fixed TileLayout columns error (4 columns + separate card)
- Restructured participant profile layout
- Budget cards display correctly without layout errors

**Navigation:**
- Added back links from enrollment detail to participant profile
- Consistent navigation patterns across all pages

**Default User:**
- Changed default user from Program Manager to Case Worker (Sarah Johnson)
- Allows testing of case worker-specific features like check-in scheduling

**Mock Data:**
- All programs updated with annual budgets ($75k-$420k range)
- Service types updated with cost per unit values
- Sample check-ins added (overdue, today, upcoming)
- Case worker IDs updated to use USER-XXX format

---

**Last Updated:** 2026-04-15
**Maintained By:** Development Team
**Version:** v1.0-alpha
