# Bonterra Outcomes Data Model

## Entity Relationship Diagram

```mermaid
erDiagram
    TENANT ||--o{ USER : "has"
    TENANT ||--o{ SITE : "operates"
    TENANT ||--o{ PROGRAM : "offers"
    TENANT ||--o{ PARTICIPANT : "serves"
    TENANT ||--o{ FAMILY : "serves"
    TENANT ||--o{ ENTITY : "partners-with"
    TENANT ||--o{ ENROLLMENT : "manages"

    USER ||--o{ ENROLLMENT : "case-manages"
    USER }o--o{ PROGRAM : "works-in"
    USER }o--o{ SITE : "works-at"

    PROGRAM ||--o{ ENROLLMENT : "enrolls"
    PROGRAM }o--o{ SITE : "operates-at"

    SITE ||--o{ ENROLLMENT : "location-of"

    PARTICIPANT ||--o{ ENROLLMENT : "enrolled-in"
    PARTICIPANT }o--|| FAMILY : "member-of"
    PARTICIPANT ||--o{ TOUCHPOINT : "receives"
    PARTICIPANT ||--o{ CASE_NOTE : "about"

    FAMILY ||--o{ ENROLLMENT : "enrolled-in"
    ENTITY ||--o{ ENROLLMENT : "partner-enrollment"

    ENROLLMENT ||--o{ TOUCHPOINT : "service-delivery"
    ENROLLMENT ||--o{ SERVICE_TRANSACTION : "receives"
    ENROLLMENT ||--o{ GOAL : "tracks"

    TENANT {
        string id PK
        string name
        string slug
        string status
        string subscriptionTier
        json settings
        datetime createdAt
        datetime updatedAt
    }

    USER {
        string id PK
        string tenantId FK
        string bonterraAuthId
        string firstName
        string lastName
        string email
        string role
        string status
        array programIds
        array siteIds
        json caseWorkerProfile
        datetime createdAt
        datetime updatedAt
    }

    SITE {
        string id PK
        string tenantId FK
        string name
        string address
        string city
        string state
        string zipCode
        boolean active
        string status
        number capacity
        datetime createdAt
        datetime updatedAt
    }

    PROGRAM {
        string id PK
        string tenantId FK
        string name
        string programType
        string description
        array siteIds
        boolean active
        string status
        boolean requiresCaseWorker
        datetime createdAt
        datetime updatedAt
    }

    PARTICIPANT {
        string id PK
        string tenantId FK
        string firstName
        string lastName
        date dateOfBirth
        number gender
        string phoneNumber
        string email
        json customData
        datetime createdAt
        datetime lastSeenAt
    }

    FAMILY {
        string id PK
        string tenantId FK
        string householdName
        array members
        string primaryContactId
        string address
        datetime createdAt
        datetime updatedAt
    }

    ENTITY {
        string id PK
        string tenantId FK
        string name
        string entityType
        string description
        string address
        string contactPerson
        string partnershipStatus
        json customData
        datetime createdAt
        datetime updatedAt
    }

    ENROLLMENT {
        string id PK
        string tenantId FK
        string enrolleeType
        string enrolleeId
        string programId FK
        string siteId FK
        string caseWorkerId FK
        string status
        date startDate
        date endDate
        array outcomes
        array outcomeGoals
        datetime createdAt
        datetime updatedAt
    }

    TOUCHPOINT {
        string id PK
        string tenantId FK
        string enrollmentId FK
        string participantId FK
        string type
        string location
        number duration
        string notes
        json extraction
        datetime date
        datetime createdAt
    }

    SERVICE_TRANSACTION {
        string id PK
        string tenantId FK
        string enrollmentId FK
        string serviceTypeId FK
        string participantId FK
        date serviceDate
        number quantity
        string unit
        string outcome
        string providedBy
        datetime createdAt
    }

    CASE_NOTE {
        string id PK
        string tenantId FK
        string participantId FK
        string enrollmentId FK
        string caseWorker
        date date
        string rawNotes
        json extraction
        datetime createdAt
    }

    GOAL {
        string id PK
        string tenantId FK
        string enrollmentId FK
        string description
        string status
        date targetDate
        number percentComplete
        datetime createdAt
        datetime updatedAt
    }
```

## Key Concepts

### Multi-Tenancy
All data is scoped to a **Tenant** (organization). Each tenant is a completely isolated database instance representing a single client organization (e.g., "Seattle Housing Coalition").

### Generic Enrollments
Enrollments are **polymorphic** and can enroll three types of entities:

1. **Participant** (individual) - `enrolleeType: 'participant'`
2. **Family** (household) - `enrolleeType: 'family'`
3. **Entity** (institution) - `enrolleeType: 'entity'`

This allows for:
- Individual case management
- Family-level services (coordinated household support)
- Institutional partnerships (schools, employers, healthcare providers)

### Program-Site Relationship
Programs can operate across **multiple sites**:
- `Program.siteIds[]` defines which sites offer this program
- Empty array = program available at all sites
- Enrollments record the specific `siteId` where services are delivered

### User Access Control
Users have granular access control:
- `User.programIds[]` - which programs they can access (empty = all)
- `User.siteIds[]` - which sites they can access (empty = all)
- Super admins have `tenantId: 'SYSTEM'` and can access all tenants

## Enrollment Types

```mermaid
graph TD
    A[Enrollment] --> B[Participant Enrollment]
    A --> C[Family Enrollment]
    A --> D[Entity Enrollment]

    B --> B1[Individual receives services]
    B --> B2[Track personal outcomes]
    B --> B3[Case management]

    C --> C1[Entire household enrolled]
    C --> C2[Family-level coordination]
    C --> C3[Shared goals & services]

    D --> D1[Institutional partnership]
    D --> D2[Referral pathways]
    D --> D3[Training & coordination]
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant System
    participant Tenant
    participant Program
    participant Site
    participant Enrollment

    User->>System: Login
    System->>Tenant: Identify tenant context
    System->>User: Load accessible programs/sites

    User->>System: Select Program + Site
    System->>Program: Validate program at site

    User->>System: Create Enrollment
    Note over System: enrolleeType + enrolleeId
    System->>Enrollment: Create with tenant context

    User->>System: Record service
    System->>Enrollment: Add service transaction
    Note over System: Linked to current program/site

    User->>System: Add case note
    System->>Enrollment: Attach to enrollment
```

## Hierarchy

```mermaid
graph TB
    T[Tenant] --> U[Users]
    T --> S[Sites]
    T --> P[Programs]
    T --> PA[Participants]
    T --> F[Families]
    T --> E[Entities]

    P -.operates at.-> S
    U -.works at.-> S
    U -.works in.-> P

    PA -.member of.-> F

    EN[Enrollment] -.enrollee.-> PA
    EN -.enrollee.-> F
    EN -.enrollee.-> E

    EN --> P
    EN --> S
    EN --> U

    EN --> SVC[Services]
    EN --> TP[Touchpoints]
    EN --> G[Goals]
    EN --> CN[Case Notes]
```

## Entity Types

### Participants
Individual people receiving services. Core demographic data with flexible `customData` for tenant-specific fields.

### Families (Households)
Groups of participants living together. Enables:
- Family-level enrollments
- Coordinated case management
- Household relationship tracking

### Entities (Institutions)
Organizations that partner with programs:
- **Schools** - Educational partnerships
- **Employers** - Job placement partners
- **Healthcare Providers** - Medical/mental health coordination
- **Housing Authorities** - Housing voucher coordination
- **Government Agencies** - Social services coordination
- **Nonprofits** - Community partnerships

### Programs
Service programs with defined outcomes and eligibility. Can operate at multiple sites.

### Sites
Physical locations where services are delivered. Multiple programs can operate at one site.

## Polymorphic Enrollment Examples

### 1. Individual Participant
```json
{
  "enrolleeType": "participant",
  "enrolleeId": "P-001",
  "programId": "PROG-002",
  "siteId": "SITE-001"
}
```

### 2. Family Enrollment
```json
{
  "enrolleeType": "family",
  "enrolleeId": "HH-001",
  "programId": "PROG-002",
  "siteId": "SITE-004"
}
```

### 3. Entity Partnership
```json
{
  "enrolleeType": "entity",
  "enrolleeId": "ENTITY-001",
  "programId": "PROG-005",
  "siteId": "SITE-002"
}
```

## Context Tracking

The system maintains **session context** for data recording:

- `currentTenantId` - Active organization
- `currentSiteId` - Selected site (null = all sites)
- `currentProgramId` - Selected program (null = all programs)

When recording data (enrollments, services, case notes), the system automatically:
1. Uses current `tenantId` for data isolation
2. Records `siteId` where service was delivered
3. Associates with appropriate `programId`

This ensures all data is properly scoped and auditable.

## Legacy Compatibility

The enrollment system maintains backward compatibility:
- `participantId` field still exists alongside `enrolleeId`
- `householdId` field still exists for family enrollments
- Queries support both old and new field patterns

This allows gradual migration while supporting existing code.
