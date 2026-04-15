# Changelog

All notable changes to Bonterra Outcomes will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Nothing yet

### Changed
- Nothing yet

### Fixed
- Nothing yet

---

## [1.0.0-alpha] - 2026-04-15

### Added - Fund Management & Budget Tracking

#### Program Budget Configuration
- Added `budget` field to Program interface (`/types/poc.ts`)
- Budget input field in program creation/edit form (`/admin/programs/page.tsx`)
- Mock data updated with budget values for all programs ($75k-$420k range)

#### Service Cost Tracking
- `costPerUnit` field added to ServiceType model
- Total cost calculation: `quantity × costPerUnit`
- All service types configured with realistic cost values
- Historical service costs tracked per transaction

#### Real-Time Budget Validation
- Service recording form now validates against program budget
- Live budget status display: "✓ Funds Available" or "❌ Insufficient Funds"
- Alert dialog prevents over-budget service delivery
- Shows current spending, remaining funds, and service cost
- Implemented in `/app/services/record/page.tsx`

#### Budget Visualization
- Program budget card on dashboard showing:
  - Remaining funds (large display)
  - Spent vs. budget breakdown
  - Utilization percentage with progress bar
  - Color-coded alerts (green < 75%, orange 75-90%, red > 90%)
- Stacked bar chart for single program view (spent vs. available)
- Multi-program budget comparison chart for "All Programs" view
- Drillable charts - click bar to select program
- Implemented in `/app/components/ProgramDashboard.tsx`

#### Participant-Level Fund Tracking
- "Funds Distributed" card added to participant profile
- Shows total value of all services received
- Sums costs across all enrollments
- Implemented in `/app/participants/[id]/page.tsx`

#### Service History Tab
- New "Services" tab on participant profile
- Complete table view of all services received
- Columns: Date, Service, Program, Quantity, **Cost**, Provided By, Status
- Sorted by date (most recent first)
- Quick access to record new service

#### Budget Calculation Logic
- New `calculateProgramSpending()` method in serviceStore
- Filters service transactions by program
- Sums total costs across all transactions
- Real-time recalculation on service addition

**Files Added/Modified:**
- `/types/poc.ts` - Program.budget field
- `/lib/stores/serviceStore.ts` - calculateProgramSpending()
- `/lib/stores/programStore.ts` - Budget CRUD operations
- `/app/services/record/page.tsx` - Validation logic
- `/app/components/ProgramDashboard.tsx` - Budget cards & charts
- `/app/components/ClientOnlyCharts.tsx` - ClientStackedBarChart component
- `/app/admin/programs/page.tsx` - Budget field in form
- `/app/participants/[id]/page.tsx` - Funds card & services tab
- `/lib/mockData.ts` - Program budgets and service costs

---

### Added - Check-In Scheduling System

#### Schedule Next Check-In
- New "Next Check-In" datetime field on case note form
- Saves to `Enrollment.nextCheckIn` field
- Optional field - check-ins not required for all case notes
- Updates enrollment when case note submitted
- Implemented in `/app/participants/[id]/add-case-note/page.tsx`

#### Dashboard Check-In Widget
- New `UpcomingCheckIns.tsx` component on main dashboard
- Shows upcoming check-ins for next 7 days
- Filtered by logged-in case worker
- Active enrollments only
- Sorted by date (earliest first)

#### Color-Coded Urgency Levels
- **Red (Overdue):** Past scheduled time with "OVERDUE" badge
- **Orange (Today):** Same calendar day with "TODAY" badge
- **Purple (Upcoming):** Within 7 days, no special badge
- Color applies to text, icons, card backgrounds, and badges

#### Time-Until Display
- Shows countdown for check-ins within 48 hours
  - "Less than 1 hour"
  - "2 hours", "23 hours", etc.
- Date-only display for check-ins beyond 48 hours

#### Participant Profile Integration
- Next check-in displayed on each enrollment in Enrollments tab
- Calendar icon with color-coded urgency
- Date and time formatted for readability
- Only shown for active enrollments with scheduled check-ins

#### Enrollment Detail Integration
- Next check-in shown in Program Info card
- Same color coding and formatting as profile
- Calendar icon with urgency indicator

#### Quick Actions
- "View Profile" button - navigate to participant
- "Add Note" button - directly to case note form
- One-click access from dashboard widget

#### Mock Data
- Added 4 sample check-ins with different urgency levels:
  - Tomorrow at 2pm (upcoming)
  - Today at 10:30am (today)
  - Yesterday at 9am (overdue)
  - Next week Tuesday at 3:30pm (upcoming)

#### Default User Change
- Changed default logged-in user from Program Manager to Case Worker (Sarah Johnson)
- Allows testing of check-in scheduling features
- Updated in `/lib/stores/userStore.ts`

**Files Added/Modified:**
- `/types/poc.ts` - Enrollment.nextCheckIn field
- `/app/components/UpcomingCheckIns.tsx` - NEW dashboard widget
- `/app/participants/[id]/add-case-note/page.tsx` - Scheduling UI
- `/app/participants/[id]/page.tsx` - Profile display
- `/app/enrollments/[id]/page.tsx` - Enrollment detail display
- `/app/page.tsx` - Dashboard integration
- `/lib/stores/enrollmentStore.ts` - updateEnrollment() usage
- `/lib/stores/userStore.ts` - Default user changed to case worker
- `/lib/mockData.ts` - Sample check-ins, case worker IDs updated

---

### Added - Service History Tab

#### Participant Services Tab
- New "Services" tab on participant profile
- Shows all services received across all enrollments
- Complete table with all service details
- Empty state with quick action to record service
- Service count badge in tab label

#### Table Features
- Sortable by date (most recent first)
- Shows: Date, Service Type, Program, Quantity, Cost, Provider, Status
- Full-width table with horizontal scroll on mobile
- Formatted currency display for costs
- Case worker name display for providers

**Files Modified:**
- `/app/participants/[id]/page.tsx` - Services tab added

---

### Fixed

#### Chart Interactivity
- Fixed budget chart drillability with proper data indexing
- Added IIFE to maintain correct program reference in onClick handler
- Chart now properly selects clicked program

#### UI Layout
- Fixed TileLayout columns error (changed from 5 to 4 columns + separate card)
- Restructured participant profile to avoid component limitations
- Funds Distributed card now displays correctly without layout errors

#### Navigation
- Added back link from enrollment detail to participant profile
- Consistent navigation patterns across all pages

#### Form Validation
- Budget validation shows real-time warnings during service recording
- Prevents over-budget service delivery with clear error messages

---

### Changed

#### Program Dashboard
- Restructured key metrics to support 6 cards (including budget)
- TileLayout now uses 4 columns with budget card separate when needed
- Budget charts only display for programs with budgets set
- Drillable multi-program chart added for "All Programs" view

#### Participant Profile
- Reorganized stats cards to 4-column layout
- Funds Distributed card now standalone (not in TileLayout)
- Services tab added to tab navigation
- Tab counts dynamically update based on data

#### Mock Data
- All programs updated with annual budget allocations
- Service types updated with cost per unit values
- Enrollments updated with case worker user IDs (USER-001, etc.)
- Sample check-ins added for testing scheduling features

#### User Store
- Default user changed from Program Manager to Case Worker
- Allows testing of case worker-specific features

---

### Technical Details

#### State Management
- `calculateProgramSpending()` method added to serviceStore
- Real-time budget calculation across all service transactions
- Enrollment updates use existing `updateEnrollment()` method

#### Components
- New `ClientStackedBarChart` component with click handling
- `UpcomingCheckIns` component with urgency logic
- Budget validation logic in service recording form

#### Data Model Updates
- `Program.budget` - Optional number field for annual budget
- `Enrollment.nextCheckIn` - Optional Date field for scheduled appointments
- Service transactions include `totalCost` calculated field

#### Performance
- Budget calculations cached per render
- Service queries filtered at store level
- Dashboard charts use memoized data

---

## [0.9.0-alpha] - 2026-04-03

### Added - Initial Release

#### Core Features
- AI-powered participant intake with conversational interface
- Document extraction using Claude Sonnet 4.5
- Smart case notes with AI extraction
- Program and enrollment management
- Family/household management
- Service recording and tracking
- Goal tracking with milestones
- Assessment templates
- Bulk import from CSV
- Multi-tenant architecture
- Program/site filtering (Master Context Pattern)

#### Dashboard & Analytics
- Program dashboard with real-time metrics
- Enrollment trends (6-month line chart)
- Active enrollments by program (bar chart)
- Case worker caseload distribution (bar chart)
- Key metric cards (enrollments, participants, services, goals)

#### AI Features
- Conversational intake with streaming responses
- Document upload and extraction (IDs, licenses)
- Duplicate detection with confidence scoring
- Case note extraction (goals, services, risks)
- Real-time AI streaming via Server-Sent Events

#### Technology Stack
- Next.js 15.1.4 with App Router
- React 19.0.0
- Stitch Design System v0.2.9
- Zustand for state management
- AWS Bedrock (Claude Sonnet 4.5)
- Recharts & Highcharts for data visualization

---

## Development Notes

### Version Numbering
- **1.0.0-alpha:** Pre-release alpha version
- **1.0.0:** First stable release (pending)
- **1.x.x:** Feature additions
- **2.x.x:** Major architectural changes

### Breaking Changes
Breaking changes will be clearly marked in the changelog with **BREAKING CHANGE** prefix.

### Unreleased Changes
Changes in the `[Unreleased]` section are pending the next version release.

---

**Maintained by:** Bonterra Development Team
**Last Updated:** 2026-04-15
