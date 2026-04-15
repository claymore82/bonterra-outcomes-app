# Repository Summary

This repository contains **Bonterra Outcomes** - a modern, AI-powered case management system for social services organizations.

## 📁 What's in This Repo

- **Full-stack Next.js 15 application** with App Router
- **AI-powered features** using AWS Bedrock (Claude Sonnet 4.5)
- **Stitch Design System** components
- **Complete case management workflow** from intake to outcomes tracking
- **Program budget management** with real-time spending tracking
- **Smart scheduling system** for case worker appointments

## 🎯 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[PROJECT_README.md](./PROJECT_README.md)** | Complete project overview, features, architecture |
| **[FEATURES.md](./FEATURES.md)** | Detailed feature documentation with usage guides |
| **[CURRENT_SPEC.md](./CURRENT_SPEC.md)** | Technical specification (1,072 lines) |
| **[CHANGELOG.md](./CHANGELOG.md)** | Version history and updates |
| **[DATA_MODEL.md](./DATA_MODEL.md)** | Database schema and type definitions |
| **[PATTERNS.md](./PATTERNS.md)** | Code patterns and best practices |

## 🚀 Key Features

### 1. Fund Management & Budget Tracking
- Set annual budgets for programs
- Track service costs in real-time
- Prevent over-budget service delivery
- Budget visualization with drillable charts
- Per-participant fund distribution tracking

### 2. Check-In Scheduling
- Schedule participant appointments when recording case notes
- Dashboard widget showing upcoming check-ins (7-day view)
- Color-coded urgency levels (overdue, today, upcoming)
- Quick actions: View profile, Add case note

### 3. AI-Powered Intake
- Conversational participant enrollment
- Document extraction (IDs, driver's licenses)
- Duplicate detection with confidence scoring
- Real-time streaming responses

### 4. Smart Case Notes
- AI extraction of goals, services, risks from free-text notes
- Automatic service transaction creation
- Emotional state assessment
- Action item tracking

### 5. Service Tracking
- Record services delivered with monetary values
- Complete service history by participant
- Budget warnings during service recording
- Service types: Emergency shelter, case management, job training, etc.

### 6. Program Dashboard
- Real-time metrics: enrollments, participants, services, goals
- Enrollment trends (6-month chart)
- Case worker caseload distribution
- Budget utilization tracking
- Drillable budget charts

### 7. Family Management
- Create and manage family units
- Family-level enrollments
- Household relationship tracking

### 8. Bulk Import
- Import participants and families from CSV
- Field mapping interface
- Data validation
- Sample templates provided

## 🏗️ Tech Stack

**Frontend:**
- Next.js 15.1.4 (App Router)
- React 19.0.0
- TypeScript 5.7.2
- Stitch Design System v0.2.9
- Zustand (state management)
- Recharts & Highcharts (charts)

**AI/Backend:**
- AWS Bedrock (Claude Sonnet 4.5)
- Next.js API Routes
- Server-Sent Events (SSE) streaming

**Infrastructure:**
- SST v3 (Serverless Stack)
- AWS Lambda + CloudFront (deployment ready)

## 📂 Project Structure

```
bonterra-outcomes-app/
├── packages/next/          # Main Next.js application
│   └── src/
│       ├── app/            # App Router pages & API routes
│       │   ├── api/        # AI endpoints (intake, case notes)
│       │   ├── participants/  # Participant management
│       │   ├── families/   # Family management
│       │   ├── enrollments/   # Enrollment tracking
│       │   ├── services/   # Service recording
│       │   ├── admin/      # Program/user management
│       │   └── components/ # Shared UI components
│       ├── lib/            # Business logic
│       │   ├── stores/     # Zustand state stores
│       │   └── mockData.ts # Sample data
│       └── types/          # TypeScript definitions
│           └── poc.ts      # Core data models
├── data/                   # Sample CSV import templates
├── docs/                   # ITD architecture documentation
├── e2e/                    # Playwright tests
└── sst.config.ts          # Infrastructure as code
```

## 🎨 Key Components

| Component | Purpose |
|-----------|---------|
| `ProgramDashboard.tsx` | Main dashboard with analytics & budget charts |
| `UpcomingCheckIns.tsx` | Check-in scheduling widget |
| `ClientOnlyCharts.tsx` | Recharts components (line, bar, stacked bar) |
| `ProgramSelector.tsx` | Program filter dropdown |
| `DocumentUpload.tsx` | AI-powered document extraction |

## 📊 Data Models

Core entities (see `types/poc.ts`):
- **Tenant** - Organization/client database
- **User** - Staff members (case workers, managers, admins)
- **Participant** - Individuals enrolled in programs
- **Family/Household** - Groups of related participants
- **Entity** - Organizations (schools, employers, partners)
- **Program** - Services offered with optional budgets
- **Enrollment** - Participant/Family/Entity enrollment in programs
- **Touchpoint** - Case notes with AI extraction
- **ServiceTransaction** - Services delivered with costs
- **Goal** - Participant outcomes and milestones

## 🧪 Testing

```bash
# E2E tests with Playwright
npm run test:e2e         # Headless
npm run test:e2e:ui      # Interactive UI
npm run test:e2e:headed  # Watch browser
```

## 🚢 Deployment

Ready to deploy to AWS with SST v3:

```bash
npm run sst:deploy
```

Infrastructure defined in `sst.config.ts`.

## 📈 Current Status

**Version:** v1.0-alpha
**Last Updated:** April 15, 2026
**Status:** Active development, ready for internal testing

### Completed Features ✅
- AI-powered participant intake
- Smart case notes with extraction
- Service tracking with budget management
- Check-in scheduling system
- Family & household management
- Bulk CSV import
- Program dashboards with analytics
- Multi-tenant architecture
- Program/site filtering

### Planned (v1.1) 🚧
- Goal tracking workflow
- Assessment templates
- Document management
- Reporting engine
- Mobile responsiveness
- HMIS export
- Email notifications

## 🔐 Environment Setup

Create `.env.local` (optional - uses AWS default credentials if not provided):

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## 🤝 Contributing

This is a Bonterra internal project. See documentation for development standards.

## 📝 License

Copyright © 2026 Bonterra. All rights reserved.

---

**Questions?** Check [PROJECT_README.md](./PROJECT_README.md) or [FEATURES.md](./FEATURES.md) for detailed guides.
