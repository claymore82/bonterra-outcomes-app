# Bonterra Outcomes - AI-Powered Case Management System

> Modern case management system with AI-powered intake, conversational case notes, and comprehensive outcomes tracking

[![Next.js](https://img.shields.io/badge/Next.js-15.1.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)](https://www.typescriptlang.org/)
[![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock-orange)](https://aws.amazon.com/bedrock/)

## 🎯 Overview

Bonterra Outcomes is a next-generation case management platform designed for social services organizations. Built with modern web technologies and AI capabilities, it streamlines participant intake, case management, service delivery, and outcomes tracking.

### Key Features

- **🤖 AI-Powered Intake** - Conversational participant enrollment with Claude Sonnet 4.5
- **📄 Document Extraction** - Extract demographics from driver's licenses, IDs, and documents
- **👨‍👩‍👧‍👦 Family Management** - Manage households and family-level enrollments
- **💼 Service Tracking** - Track services delivered with monetary values and program budgets
- **📊 Program Dashboards** - Real-time analytics and budget visualization
- **📝 Smart Case Notes** - AI extraction of goals, services, risks, and emotional state
- **📅 Check-In Scheduling** - Schedule and track upcoming participant appointments
- **📥 Bulk Import** - CSV import for participants and families with field mapping
- **🏢 Multi-Tenant** - Support for multiple organizations with program/site filtering

## 🚀 Quick Start

### Prerequisites

- Node.js 22+ and npm 10+
- AWS account with Bedrock access (for AI features)
- AWS credentials configured locally

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/bonterra-outcomes-app.git
cd bonterra-outcomes-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Setup

Create a `.env.local` file (optional - uses AWS default credentials if not provided):

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## 📚 Documentation

- **[CURRENT_SPEC.md](./CURRENT_SPEC.md)** - Comprehensive technical specification
- **[FEATURES.md](./FEATURES.md)** - Detailed feature documentation with screenshots
- **[DATA_MODEL.md](./DATA_MODEL.md)** - Data models and type definitions
- **[PATTERNS.md](./PATTERNS.md)** - Code patterns and best practices
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and updates

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 15.1.4 (App Router with Server & Client Components)
- React 19.0.0
- TypeScript 5.7.2
- Stitch Design System v0.2.9
- Zustand (State Management)
- Recharts & Highcharts (Data Visualization)

**AI/Backend:**
- AWS Bedrock (Claude Sonnet 4.5)
- Next.js API Routes
- Server-Sent Events (SSE) for streaming

**Infrastructure:**
- SST v3 (Serverless Stack)
- AWS Lambda + CloudFront (deployment ready)

### Project Structure

```
bonterra-outcomes-app/
├── packages/next/          # Main Next.js application
│   └── src/
│       ├── app/            # Next.js App Router pages
│       │   ├── api/        # API routes (AI endpoints)
│       │   ├── participants/  # Participant pages
│       │   ├── families/   # Family pages
│       │   ├── enrollments/   # Enrollment pages
│       │   ├── services/   # Service recording
│       │   ├── admin/      # Admin pages
│       │   └── components/ # Shared components
│       ├── lib/            # Business logic
│       │   ├── stores/     # Zustand state stores
│       │   └── mockData.ts # Sample data
│       └── types/          # TypeScript type definitions
│           └── poc.ts      # Core data models
├── data/                   # Sample data files
│   └── samples/            # Import templates
├── docs/                   # Documentation
├── e2e/                    # Playwright tests
└── sst.config.ts          # Infrastructure config
```

## 🎨 Core Features

### 1. AI-Powered Participant Intake

Create participant records through natural conversation. The AI extracts demographics, contact info, and program details.

**Key capabilities:**
- Conversational interface with streaming responses
- Document upload & extraction (driver's licenses, IDs)
- Duplicate detection with confidence scoring
- Multi-step workflow with progress tracking
- HMIS-compliant data collection

**Files:**
- `/app/participants/create-agent/page.tsx` - Main intake UI
- `/app/api/intake/chat/route.ts` - AI conversation endpoint
- `/app/api/intake/extract-document/route.ts` - Document extraction

### 2. Smart Case Notes

AI-powered case note recording with automatic extraction of:
- Goal progress tracking
- Services provided
- Emotional state assessment
- Risk flag identification
- Status changes (employment, housing, income)

**Files:**
- `/app/participants/[id]/add-case-note/page.tsx` - Case note form
- `/app/api/case-notes/extract/route.ts` - AI extraction endpoint
- `/lib/stores/touchpointStore.ts` - Case note state management

### 3. Check-In Scheduling

Schedule and track upcoming participant appointments:
- Set next check-in date when recording case notes
- Dashboard widget showing upcoming check-ins (7-day view)
- Color-coded urgency levels (overdue, today, upcoming)
- Quick actions: View profile, Add case note
- Filtered by logged-in case worker

**Files:**
- `/app/components/UpcomingCheckIns.tsx` - Dashboard widget
- `/app/participants/[id]/add-case-note/page.tsx` - Scheduling UI
- `/types/poc.ts` - `Enrollment.nextCheckIn` field

### 4. Service Tracking & Budget Management

Track services delivered with monetary values and program budget constraints:
- Service types with cost per unit
- Program budget allocation and tracking
- Real-time budget validation (prevent over-spending)
- Service history by participant
- Budget visualization on dashboard

**Features:**
- Program budget dashboard with spending vs. remaining
- Stacked bar charts showing fund distribution
- Drillable charts (click to select program)
- Per-participant fund distribution tracking
- Budget warnings when recording services

**Files:**
- `/app/services/record/page.tsx` - Service recording form
- `/lib/stores/serviceStore.ts` - Service & budget logic
- `/app/components/ProgramDashboard.tsx` - Budget charts
- `/app/admin/programs/page.tsx` - Program budget setup

### 5. Family & Household Management

Enroll and manage family units:
- Create families with multiple members
- Define head of household
- Family-level enrollments
- Relationship tracking

**Files:**
- `/app/families/page.tsx` - Family list
- `/app/families/[id]/page.tsx` - Family detail
- `/lib/stores/householdStore.ts` - Family state

### 6. Program Dashboard & Analytics

Real-time dashboard with:
- Active enrollments, participants, services
- Enrollment trends (6-month view)
- Case worker caseload distribution
- Budget utilization tracking
- Program filtering and drillable charts

**Files:**
- `/app/components/ProgramDashboard.tsx` - Main dashboard
- `/app/components/ClientOnlyCharts.tsx` - Chart components
- `/app/components/ProgramSelector.tsx` - Program filter

### 7. Bulk Import

Import participants and families from CSV:
- Field mapping interface
- Column preview
- Data validation
- Sample templates provided

**Files:**
- `/app/import/page.tsx` - Import UI
- `/data/samples/*.csv` - Import templates

## 🎯 User Roles

The system supports four user roles:

1. **Case Worker** - Manage participants, record case notes, track services
2. **Program Manager** - View program analytics, manage budgets, oversee enrollments
3. **Staff** - General access to participant and service data
4. **Super Admin** - Full system access, multi-tenant management

## 📊 Data Model

### Core Entities

- **Tenant** - Organization/client database
- **User** - Staff members with role-based access
- **Participant** - Individual enrolled in programs
- **Family/Household** - Group of related participants
- **Entity** - Organizations (schools, employers, partners)
- **Program** - Services offered (Emergency Shelter, Job Training, etc.)
- **Enrollment** - Participant/Family/Entity enrollment in a program
- **Touchpoint** - Case notes and interactions
- **ServiceTransaction** - Services delivered
- **Goal** - Participant outcomes and milestones

See [DATA_MODEL.md](./DATA_MODEL.md) for complete schema.

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript checks

# Testing
npm run test:e2e         # Run Playwright tests
npm run test:e2e:ui      # Playwright UI mode

# Infrastructure
npm run sst:dev          # Start SST local dev
npm run sst:deploy       # Deploy to AWS

# Documentation
npm run docs:lint        # Lint markdown docs
```

### Code Patterns

**Master Context Pattern:**
All data displays must respect the global program/site filters:
- `useUserStore()` - Access `currentProgramId` and `currentSiteId`
- Filter data before rendering
- See [PATTERNS.md](./PATTERNS.md) for details

**State Management:**
- Zustand stores in `/lib/stores/`
- Each entity has its own store (participantStore, enrollmentStore, etc.)
- Stores handle CRUD operations and queries

**AI Integration:**
- Server-Sent Events (SSE) for streaming responses
- Streaming pattern in `/app/api/intake/chat/route.ts`
- Error handling with abort controllers

## 🧪 Testing

### E2E Testing

Playwright tests in `/e2e/`:
- Intake flow tests
- Navigation tests
- Form submission tests

```bash
npm run test:e2e         # Headless mode
npm run test:e2e:headed  # Watch browser
npm run test:e2e:ui      # Interactive UI
```

## 🚢 Deployment

The application is ready to deploy to AWS using SST v3:

```bash
# Deploy to production
npm run sst:deploy

# Deploy to staging
npm run sst:deploy --stage staging
```

Infrastructure is defined in `sst.config.ts`.

## 📈 Roadmap

### Completed (v1.0-alpha)
- ✅ AI-powered participant intake
- ✅ Smart case notes with extraction
- ✅ Service tracking with budgets
- ✅ Check-in scheduling
- ✅ Family management
- ✅ Bulk import
- ✅ Program dashboards

### Planned (v1.1)
- [ ] Goal tracking workflow
- [ ] Assessment templates
- [ ] Document management
- [ ] Reporting engine
- [ ] Mobile responsiveness
- [ ] HMIS export
- [ ] Email notifications

### Future (v2.0)
- [ ] Custom form builder
- [ ] Advanced reporting
- [ ] API for integrations
- [ ] Mobile app
- [ ] Offline mode

## 🤝 Contributing

This is a Bonterra internal project. Follow Bonterra development standards:

1. Create a feature branch
2. Write tests for new features
3. Update documentation
4. Submit PR for review

## 📝 License

Copyright © 2026 Bonterra. All rights reserved.

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Stitch Design System](https://github.com/bonterratech/stitch) - Component library
- [AWS Bedrock](https://aws.amazon.com/bedrock/) - AI capabilities
- [Claude AI](https://www.anthropic.com/claude) - Language model

---

**Need Help?** See [docs/README.md](./docs/README.md) for detailed guides and examples.
