# Bonstart v2

> Production-ready SST v3 + Next.js starter template for Bonterra projects

## ⚠️ First-Time Setup Required

After creating a new project from this template, you **must** configure it:

```bash
# 1. Install dependencies
npm install

# 2. Configure your project (REQUIRED)
npm run bonstart:init

# 3. Start development
npm run dev

# 4. Deploy to AWS
npm run sst:deploy
```

The `bonstart:init` script will prompt you for:
- **Project name** (replaces "bonstart-template" everywhere)
- **AWS region** (default: us-east-1)
- **AWS profile** (optional, uses default if not specified)

## 🚀 What's Included

- **SST v3**: Modern serverless infrastructure for AWS
- **Next.js 15**: React framework with App Router and server components
- **TypeScript**: Full type safety across frontend and backend
- **Node 22**: Latest LTS with modern JavaScript features
- **ESLint + Prettier**: Automated code quality and formatting
- **ITD Documentation**: Architecture decision framework and templates

## 📚 Architecture Documentation

This template includes the **ITD (Implementation/Technical Decision)** framework for documenting technical decisions:

```bash
docs/
├── README.md                   # Documentation guidelines
├── templates/                  # ITD and data structure templates
├── examples/                   # Example ITDs
│   └── 01-general/
│       ├── GENERAL-001-framework-selection.md
│       └── GENERAL-002-monorepo-structure.md
├── 01-general/                 # System-wide decisions
├── 02-auth/                    # Authentication decisions
└── core-data-structures/       # Data models
```

**Example ITDs:**
- [Framework Selection (SST v3 + Next.js)](docs/examples/01-general/GENERAL-001-framework-selection.md)
- [Monorepo Structure](docs/examples/01-general/GENERAL-002-monorepo-structure.md)

**Quick Start:**
1. Copy a template from `docs/templates/`
2. Document your decision with context, alternatives, and reasoning
3. Name with category prefix (e.g., `GENERAL-001-your-decision.md`)
4. Save in the appropriate category folder (e.g., `docs/01-general/`)

See [docs/README.md](docs/README.md) for full guidelines.

## 🎨 Stitch Design System

This template includes the [Stitch Design System](https://github.com/bonterratech/stitch) - Bonterra's accessible React component library.

### Setup

1. **Configure npm registries** (required for private packages):
   ```bash
   # Copy the example file
   cp .npmrc.example .npmrc

   # Add your tokens:
   # - Font Awesome token: https://fontawesome.com/account
   # - GitHub token: https://github.com/settings/tokens (with read:packages scope)
   ```

2. **Use Stitch components**:
   ```tsx
   import { Button, Stack, Text } from '@bonterratech/stitch-extension';

   export default function MyPage() {
     return (
       <Stack space="400">
         <Text variant="lg">Hello World</Text>
         <Button variant="primary">Click me</Button>
       </Stack>
     );
   }
   ```

### Resources

- [Storybook](https://main.d2txqofa7g657p.amplifyapp.com/) - Component API & examples
- [Design Guidelines](https://zeroheight.com/635ad7a5d/p/0424a6-stitch-design-system)
- [GitHub Repo](https://github.com/bonterratech/stitch)
- [Slack Support](https://bonterra.enterprise.slack.com/archives/C070GH413L3) - #stitch channel


## 🤝 Contributing

This is a Bonterra internal template. Follow Bonterra development standards.

