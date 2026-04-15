# Features Documentation

Complete guide to all features in Bonterra Outcomes V1.

---

## Table of Contents

1. [Fund Management & Budget Tracking](#fund-management--budget-tracking)
2. [Check-In Scheduling System](#check-in-scheduling-system)
3. [Service History & Tracking](#service-history--tracking)
4. [Program Dashboard & Analytics](#program-dashboard--analytics)
5. [AI-Powered Intake](#ai-powered-intake)
6. [Smart Case Notes](#smart-case-notes)
7. [Family Management](#family-management)
8. [Bulk Import](#bulk-import)

---

## Fund Management & Budget Tracking

**Status:** ✅ Complete
**Date Added:** 2026-04-15

### Overview

Comprehensive budget management system that tracks program funding, service costs, and spending limits. Prevents services from being delivered when funds are insufficient.

### Features

#### 1. Program Budget Configuration

**Location:** `/admin/programs` → Edit Program

- Set annual budget for each program
- Budget field in program creation/edit form
- Optional field (programs can operate without budgets)

**Data Model:**
```typescript
interface Program {
  // ... other fields
  budget?: number; // Total funds allocated to this program
}
```

**Example:**
- Emergency Shelter: $250,000
- Rapid Rehousing: $420,000
- Job Training: $150,000

#### 2. Service Cost Tracking

**Location:** Service recording pages

- Each service type has a `costPerUnit` value
- Total cost calculated: `quantity × costPerUnit`
- Costs tracked per service transaction
- Historical spending viewable by participant

**Service Types with Costs:**
- Emergency Shelter: $45/night
- Rental Assistance: $1/dollar (direct pass-through)
- Case Management: $85/session
- Job Training: $250/week
- Mental Health Therapy: $120/session
- Transportation: $1/dollar

#### 3. Real-Time Budget Validation

**Location:** `/services/record/page.tsx`

When recording a service:
1. System calculates total service cost
2. Checks program's current spending vs. budget
3. Displays real-time validation:
   - ✅ **Funds Available** (green) - Service can be delivered
   - ❌ **Insufficient Funds** (red) - Service blocked

**Validation Logic:**
```typescript
const serviceCost = serviceType.costPerUnit * quantity;
const currentSpending = calculateProgramSpending(programId);
const remainingFunds = program.budget - currentSpending;
const hasSufficientFunds = serviceCost <= remainingFunds;
```

**Alert Example:**
```
❌ Insufficient Funds!

Program: Emergency Shelter
Budget: $250,000.00
Already Spent: $248,500.00
Remaining: $1,500.00
Service Cost: $2,250.00

This service cannot be delivered - insufficient program funds.
```

#### 4. Program Dashboard Budget Cards

**Location:** Main dashboard (when program selected)

Displays for each budgeted program:
- **Remaining Funds** (large display)
- **Spent vs. Budget** (detailed breakdown)
- **Utilization %** (progress bar)
- **Color-coded alerts:**
  - Green: < 75% utilized
  - Orange: 75-90% utilized
  - Red: > 90% utilized

**Example Card:**
```
Program Funds
$1.5k
$248.5k of $250k spent
[========================================>] 99% utilized
```

#### 5. Budget Visualization Charts

**Location:** Main dashboard

Two chart types:

**A. Single Program View**
- Stacked bar chart showing spent vs. available funds
- Displays when a specific program is selected
- Series:
  - Funds Disbursed (red)
  - Funds Available (green)

**B. All Programs View**
- Multi-program comparison chart
- Displays when "All Programs" is selected
- Shows budget status for all programs with budgets
- **Drillable:** Click bar to select that program

**Chart Interactivity:**
```typescript
onBarClick={(index) => {
  const clickedProgram = budgetedPrograms[index];
  setCurrentProgram(clickedProgram.id);
}}
```

#### 6. Participant-Level Fund Tracking

**Location:** `/participants/[id]` → Overview Tab

Displays total funds distributed to each participant:
- Sums all service costs across all enrollments
- Card display with formatted currency
- Only shown if participant has received funded services

**Example:**
```
Funds Distributed
$48,350
Total value of services provided across all enrollments
```

#### 7. Service History Tab

**Location:** `/participants/[id]` → Services Tab

Complete service history table showing:
- Date
- Service Type
- Program
- Quantity
- **Cost** (prominently displayed)
- Provided By
- Status

Sorted by date (most recent first).

### Implementation Files

**Core Logic:**
- `/lib/stores/serviceStore.ts` - `calculateProgramSpending()` method
- `/lib/stores/programStore.ts` - Program CRUD with budget field
- `/types/poc.ts` - `Program.budget` type definition

**UI Components:**
- `/app/services/record/page.tsx` - Budget validation on service form
- `/app/components/ProgramDashboard.tsx` - Budget cards and charts
- `/app/components/ClientOnlyCharts.tsx` - `ClientStackedBarChart` component
- `/app/admin/programs/page.tsx` - Budget field in program form
- `/app/participants/[id]/page.tsx` - Funds distributed card + services tab

**Mock Data:**
- `/lib/mockData.ts` - All programs updated with budget values

### Usage Notes

1. **Budget Validation is Non-Blocking for Reporting**
   - Warnings shown, but historical data recording is allowed
   - Real-time validation prevents new over-budget services

2. **Budget Optional**
   - Programs without budgets have no spending limits
   - Budget fields and warnings only appear when budget is set

3. **Spending Calculation**
   - Only counts completed service transactions
   - Does not include pending or cancelled services
   - Real-time recalculation on every service addition

---

## Check-In Scheduling System

**Status:** ✅ Complete
**Date Added:** 2026-04-15

### Overview

Comprehensive appointment scheduling system for case workers to track and manage upcoming participant check-ins. Includes scheduling interface, dashboard alerts, and urgency indicators.

### Features

#### 1. Schedule Next Check-In

**Location:** `/participants/[id]/add-case-note` - Case note form

When recording a case note, case worker can set the next check-in appointment:
- **Field:** "Next Check-In" (datetime-local input)
- **Location:** Touchpoint Details section
- **Saves to:** `Enrollment.nextCheckIn` field

**UI Layout:**
```
Touchpoint Details
┌─────────────────────────────────────────────┐
│ Touchpoint Type    Duration    Location     │
│ In-Person Meeting  30 min      Office       │
│                                              │
│ Next Check-In                                │
│ [2026-04-20 at 2:00 PM]                     │
└─────────────────────────────────────────────┘
```

**Form Validation:**
- Optional field (check-ins not required for all case notes)
- Saves when case note is submitted
- Updates the enrollment's `nextCheckIn` timestamp

#### 2. Dashboard Check-In Widget

**Location:** Main dashboard (`/`)

**Component:** `UpcomingCheckIns.tsx`

Shows upcoming check-ins for the next **7 days** for the current logged-in case worker.

**Features:**
- Filtered by `currentUser.id` (only shows logged-in case worker's check-ins)
- Active enrollments only
- Sorted by date (earliest first)
- Shows participant name, program, date/time
- Quick action buttons: "View Profile", "Add Note"

**Empty State:**
```
📅 Upcoming Check-Ins
No check-ins scheduled in the next 7 days
```

**With Check-Ins:**
```
📅 Upcoming Check-Ins

┌────────────────────────────────────────────────────┐
│ 🔴 Maria Garcia [OVERDUE]                          │
│ Educational Support                                 │
│ ⏰ Apr 14, 2026 at 9:00 AM                         │
│ [View Profile] [+ Add Note]                        │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ 🟠 Jane Doe [TODAY]                                │
│ Job Training                                        │
│ ⏰ Apr 15, 2026 at 10:30 AM (2 hours)              │
│ [View Profile] [+ Add Note]                        │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ 🟣 John Smith                                      │
│ Rapid Rehousing                                     │
│ ⏰ Apr 16, 2026 at 2:00 PM (1 day)                 │
│ [View Profile] [+ Add Note]                        │
└────────────────────────────────────────────────────┘
```

#### 3. Color-Coded Urgency Levels

Check-ins are color-coded by urgency:

| Status | Color | Badge | When |
|--------|-------|-------|------|
| **Overdue** | 🔴 Red | "OVERDUE" | Past scheduled time |
| **Today** | 🟠 Orange | "TODAY" | Same calendar day |
| **Upcoming** | 🟣 Purple | (none) | Within 7 days |

**Color applies to:**
- Text highlighting
- Calendar icon
- Card background (subtle tint)
- Badge label

#### 4. Participant Profile Display

**Location:** `/participants/[id]` → Enrollments Tab

Each active enrollment shows next check-in if scheduled:

```
Emergency Shelter                    [View →]
Started Jan 15, 2026 | Active

📅 Next check-in: Apr 16, 2026 at 2:00 PM
```

**Styling:**
- Red text for overdue check-ins
- Purple text for upcoming check-ins
- Calendar icon with matching color

#### 5. Enrollment Detail Page

**Location:** `/enrollments/[id]`

Shows next check-in in the Program Info card:

```
Program Info
┌──────────────────────────────────────────────┐
│ Program: Emergency Shelter                   │
│ Enrollment Date: Jan 15, 2026                │
│ End Date: Ongoing                            │
│ Next Check-In: 📅 Apr 16, 2026 at 2:00 PM   │
└──────────────────────────────────────────────┘
```

#### 6. Time-Until Display

For check-ins within 48 hours, shows countdown:
- "Less than 1 hour"
- "2 hours"
- "23 hours"

For check-ins beyond 48 hours, shows date only.

### Data Model

```typescript
interface Enrollment {
  // ... other fields
  nextCheckIn?: Date; // Scheduled next check-in/appointment date
  createdAt: Date;
  updatedAt: Date;
}
```

### Implementation Files

**Components:**
- `/app/components/UpcomingCheckIns.tsx` - Dashboard widget (new file)
- `/app/participants/[id]/add-case-note/page.tsx` - Scheduling UI
- `/app/participants/[id]/page.tsx` - Profile display
- `/app/enrollments/[id]/page.tsx` - Enrollment detail display

**Data:**
- `/types/poc.ts` - `Enrollment.nextCheckIn` field added
- `/lib/stores/enrollmentStore.ts` - Uses `updateEnrollment()` method
- `/lib/mockData.ts` - Sample check-ins added:
  - Tomorrow at 2pm (Sarah Johnson)
  - Today at 10:30am (Michael Chen)
  - Yesterday at 9am - overdue (Emily Rodriguez)
  - Next week Tuesday at 3:30pm (Sarah Johnson)

**State Management:**
- `/lib/stores/userStore.ts` - Changed default user to Sarah Johnson (case worker)

### Usage Flow

1. **Case Worker Records Case Note:**
   - Navigate to `/participants/[id]/add-case-note`
   - Fill out touchpoint details
   - Set "Next Check-In" date/time
   - Submit case note

2. **Next Check-In is Saved:**
   - Enrollment updated with `nextCheckIn` timestamp
   - Visible immediately on participant profile
   - Appears in dashboard widget if within 7 days

3. **Case Worker Sees Dashboard Alert:**
   - Dashboard shows upcoming check-ins
   - Color-coded by urgency
   - Quick access: "View Profile" or "Add Note"

4. **Case Worker Takes Action:**
   - Click "Add Note" to record check-in
   - Optionally set next check-in date
   - Cycle repeats

### Configuration

**Time Window:** Check-ins shown in dashboard widget for next **7 days**
- Change in `/app/components/UpcomingCheckIns.tsx`:
```typescript
const sevenDaysFromNow = new Date();
sevenDaysFromNow.setDate(now.getDate() + 7); // <-- Adjust this value
```

**User Filtering:**
- Widget filters by `caseWorkerId === currentUser.id`
- Only shows check-ins for the logged-in case worker
- To show all check-ins (admin view), remove the case worker filter

### Notes

1. **Optional Feature**
   - Check-ins are optional - case notes can be recorded without setting next check-in
   - Widget hidden if no check-ins scheduled

2. **No Notifications (Yet)**
   - System currently displays check-ins on dashboard
   - No email/SMS notifications in V1
   - Future enhancement: scheduled reminders

3. **Timezone Handling**
   - Uses browser's local timezone
   - Stored as ISO timestamp in data
   - Formatted for display in user's timezone

---

## Service History & Tracking

**Status:** ✅ Complete
**Date Added:** 2026-04-15

### Overview

Complete service delivery history for each participant, showing all services received across all program enrollments.

### Features

#### 1. Participant Services Tab

**Location:** `/participants/[id]` → Services Tab

**Features:**
- Full table view of all services
- Sorted by date (most recent first)
- Shows services across all enrollments
- Click "Record Service" to add new service

**Table Columns:**
- **Date** - Service delivery date
- **Service** - Service type name
- **Program** - Which program provided the service
- **Quantity** - Amount delivered (with units)
- **Cost** - Total cost of the service
- **Provided By** - Case worker or provider name
- **Status** - Service status (Completed, Scheduled, Cancelled)

#### 2. Empty State

When participant has no service history:
```
💼 No services recorded yet

Services provided to this individual will appear here.

[Record Service →]
```

#### 3. Service Recording

**Location:** `/participants/[id]/record-service` or `/services/record`

Quick access from:
- Participant services tab
- Main navigation
- Participant profile actions

### Implementation

**Files:**
- `/app/participants/[id]/page.tsx` - Services tab added
- `/lib/stores/serviceStore.ts` - Service queries
- Tab navigation updated to include Services count

**Tab List:**
```typescript
<TabList>
  <Tab id="overview">Overview</Tab>
  <Tab id="enrollments">Enrollments ({count})</Tab>
  <Tab id="services">Services ({count})</Tab>  {/* ← New */}
  <Tab id="case-notes">Case Notes ({count})</Tab>
  <Tab id="analytics">Analytics</Tab>
  <Tab id="activity">Activity</Tab>
</TabList>
```

---

## Program Dashboard & Analytics

**Status:** ✅ Complete
**Date Added:** 2026-04-03, Enhanced: 2026-04-15

### Overview

Real-time analytics dashboard showing program performance, enrollments, services, and budget tracking.

### Features

#### 1. Key Metrics Cards

**Metrics Displayed:**
- Active Enrollments (per program or across all)
- Active Participants (unique individuals)
- Families (household count + members)
- Services This Month (count)
- Goal Completion Rate (%)
- Program Funds (when budget set) - **New in v1.0**

#### 2. Enrollment Trend Chart

**Type:** Line chart
**Data:** Last 6 months of enrollment activity
**Filters:** Respects program and site selection

#### 3. Active Enrollments by Program

**Type:** Bar chart
**Data:** Current active enrollments per program
**View:**
- Single program: Shows just that program
- All programs: Shows all programs with data

#### 4. Case Worker Caseload

**Type:** Bar chart
**Data:** Number of active cases per case worker
**Purpose:** Load balancing and capacity planning

#### 5. Budget Overview Charts

**Type:** Stacked bar chart
**Data:** Funds disbursed vs. funds available
**Views:**
- **Single Program:** When program selected, shows just that program's budget
- **All Programs:** Shows budget breakdown for all programs with budgets

**Interactivity:**
- **Drillable:** Click any bar to select that program
- Hint shown: "(Click bar to drill down)"

### Program Selector

**Location:** Top navigation bar

Dropdown showing:
- "All Programs" (default)
- List of available programs
- Each program shows active enrollment count

When program selected, all dashboard data filters to that program.

### Implementation

**Files:**
- `/app/components/ProgramDashboard.tsx` - Main dashboard component
- `/app/components/ClientOnlyCharts.tsx` - Recharts components
- `/app/components/ProgramSelector.tsx` - Program dropdown
- `/lib/stores/userStore.ts` - `currentProgramId` state

---

## AI-Powered Intake

**Status:** ✅ Complete
**Date Added:** 2026-04-03

### Overview

Conversational AI-powered participant intake using Claude Sonnet 4.5 via AWS Bedrock.

### Features

#### 1. Conversational Interface

**Location:** `/participants/create-agent`

**Flow:**
1. User initiates conversation
2. AI asks for participant information naturally
3. User can type responses or upload documents
4. AI extracts structured data in real-time
5. Shows progress and extracted data in sidebar
6. Reviews data before creating record
7. Duplicate detection with confidence scoring

#### 2. Document Extraction

**Supported Documents:**
- Driver's licenses
- State IDs
- Birth certificates
- Other identity documents

**Extraction Fields:**
- Name (first/last)
- Date of birth
- Gender
- Address
- Document type and number
- Photo (if present)

**Confidence Scoring:**
- Each field has confidence score (0-1)
- Visual indicators for low-confidence fields
- User can override extracted values

#### 3. Duplicate Detection

**Smart Matching:**
- Checks for existing participants with similar:
  - Name (fuzzy matching)
  - Date of birth
  - Phone/email
  - Address

**Confidence Levels:**
- **High:** Likely duplicate (>80% match)
- **Medium:** Possible duplicate (50-80% match)
- **Low:** Unlikely duplicate (<50% match)

**User Actions:**
- Link to existing record
- Create new record anyway
- Review potential duplicate

### Implementation

**AI Configuration:**
- Model: Claude Sonnet 4.5 (`us.anthropic.claude-sonnet-4-5-20250929-v1:0`)
- Region: us-east-1
- Streaming: Server-Sent Events (SSE)
- Context: Maintains conversation history

**Files:**
- `/app/participants/create-agent/page.tsx` - Main UI
- `/app/api/intake/chat/route.ts` - Conversation endpoint
- `/app/api/intake/extract-document/route.ts` - Document extraction
- `/config/bedrock.ts` - AI configuration

---

## Smart Case Notes

**Status:** ✅ Complete
**Date Added:** 2026-04-03

### Overview

AI-powered case note recording with automatic extraction of structured data from free-text notes.

### Features

#### 1. Free-Text Entry

Case worker types natural language notes, e.g.:
```
Met with Maria today for 45 minutes at her apartment. She's
making good progress on her job search - had two interviews
this week and feels confident. She's a bit anxious about the
upcoming GED exam but studying regularly. Provided $50 bus
passes for transportation to interviews.
```

#### 2. Real-Time AI Extraction

**Extracts:**
- **Goal Progress:** Identifies goals and status (positive/negative/neutral)
- **Services Provided:** Detects services mentioned with quantities
- **Emotional State:** Assesses participant's emotional state
- **Risk Flags:** Identifies housing, health, safety, financial, or legal risks
- **Status Changes:** Tracks employment, housing, income changes
- **Action Items:** Lists follow-up tasks with due dates

#### 3. Extracted Data Display

**Sidebar shows:**
- Color-coded goal progress cards
- Checkboxes for services (auto-selected)
- Risk flags with severity levels
- Emotional state badge
- Action items list

#### 4. Service Transaction Creation

**Feature:** Auto-create service transactions from case notes

When services are mentioned:
1. AI detects service type and quantity
2. Creates checkbox for each service
3. User confirms which services to record
4. Service transactions created with touchpoint

**Benefit:** Eliminates double-entry of service data

### Implementation

**Files:**
- `/app/participants/[id]/add-case-note/page.tsx` - Case note form
- `/app/api/case-notes/extract/route.ts` - AI extraction endpoint
- `/lib/stores/touchpointStore.ts` - Touchpoint/case note storage

**Extraction Pattern:**
- Debounced (1 second delay after typing stops)
- Streaming responses via SSE
- Abort controller for cancellation
- Min 20 characters before extraction starts

---

## Family Management

**Status:** ✅ Complete
**Date Added:** 2026-04-03

### Overview

Manage family units (households) with multiple members and family-level enrollments.

### Features

#### 1. Create Family

**Location:** `/families` → Add Family

**Fields:**
- Family name (optional, e.g., "Smith Family")
- Head of household (required)
- Additional members
- Relationships between members

#### 2. Family Detail Page

**Location:** `/families/[id]`

**Shows:**
- All family members with demographics
- Head of household indicator
- Family enrollments
- Combined service history
- Family-level outcomes

#### 3. Family Enrollments

**Capability:** Enroll entire family in a program

**Example Use Cases:**
- Family housing program
- Family counseling
- Educational support for family unit

**Data Model:**
```typescript
interface Enrollment {
  enrolleeType: 'family'; // Can be 'participant', 'family', or 'entity'
  enrolleeId: string;     // Family ID
  programId: string;
  // ... other fields
}
```

### Implementation

**Files:**
- `/app/families/page.tsx` - Family list
- `/app/families/[id]/page.tsx` - Family detail
- `/lib/stores/householdStore.ts` - Family state management
- `/types/poc.ts` - Family/Household types

---

## Bulk Import

**Status:** ✅ Complete
**Date Added:** 2026-04-03

### Overview

Import participants and families from CSV files with field mapping.

### Features

#### 1. Import Wizard

**Location:** `/import`

**Steps:**
1. **Select File:** Choose CSV file
2. **Map Fields:** Match CSV columns to system fields
3. **Preview:** Review data before import
4. **Import:** Process records with validation
5. **Results:** Summary of imported records

#### 2. Field Mapping

**Features:**
- Auto-detection of common field names
- Dropdown for each CSV column
- Preview of sample data
- Required field validation

**Supported Fields:**
- First Name, Last Name
- Date of Birth
- Gender (HMIS codes)
- Phone, Email
- Address components
- Custom fields (program-specific)

#### 3. Sample Templates

**Location:** `/data/samples/`

**Files:**
- `sample-participants-import.csv` - Participant import template
- `sample-families-import.csv` - Family import template

**Usage:**
- Download template
- Fill in data
- Upload for import

#### 4. Validation

**Import validates:**
- Required fields present
- Date formats valid
- HMIS codes valid (gender, DOB quality, etc.)
- Duplicate detection
- Data type correctness

**Error Handling:**
- Shows validation errors with row numbers
- Allows fixing and re-importing
- Partial imports (skip invalid rows)

### Implementation

**Files:**
- `/app/import/page.tsx` - Import wizard UI
- `/lib/stores/participantStore.ts` - Import logic
- `/data/samples/*.csv` - Import templates

---

## Technical Notes

### State Management

All features use Zustand stores for state management:
- `useParticipantStore()` - Participants
- `useEnrollmentStore()` - Enrollments
- `useProgramStore()` - Programs
- `useServiceStore()` - Services & budgets
- `useTouchpointStore()` - Case notes
- `useHouseholdStore()` - Families
- `useUserStore()` - Current user & context

### Master Context Pattern

All data displays must respect:
- `currentProgramId` - Selected program filter
- `currentSiteId` - Selected site filter

See [PATTERNS.md](./PATTERNS.md) for implementation details.

### AI Configuration

AI features use AWS Bedrock:
- Model: Claude Sonnet 4.5
- Region: us-east-1
- Streaming: Server-Sent Events (SSE)
- Config: `/config/bedrock.ts`

### Data Models

All types defined in `/types/poc.ts`:
- TypeScript interfaces
- HMIS compliance
- Multi-tenant structure
- Polymorphic enrollments

---

**Last Updated:** 2026-04-15
**Version:** v1.0-alpha
