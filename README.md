# Bonstart v2

> Production-ready SST v3 + Next.js starter template for Bonterra projects

## ⚠️ First-Time Setup Required

After creating a new project from this template, you **must** configure it:

```bash
# 1. Install dependencies
npm install

# 2. Configure your project (REQUIRED)
npm run bonstart:init

# 3. Set up CI/CD (optional, but recommended)
npm run bonstart:init-ci

# 4. Start development
npm run dev

# 5. Deploy to AWS
npm run sst:deploy
```

### Setup Scripts

**`bonstart:init`** - Project initialization (merged setup):
- **Project name** (replaces "bonstart" everywhere)
- **GitHub org/repo** (auto-detected from git remote)
- Updates CI/CD workflows and CloudFormation templates
- Removes setup warnings and template files
- See [.github/bootstrap-cloudformation/README.md](.github/bootstrap-cloudformation/README.md) for AWS setup

## 🚀 What's Included

- **SST v3**: Modern serverless infrastructure for AWS
- **Next.js 15**: React framework with App Router and server components
- **TypeScript**: Full type safety across frontend and backend
- **Node 22**: Latest LTS with modern JavaScript features
- **ESLint + Prettier**: Automated code quality and formatting
- **ITD Documentation**: Architecture decision framework and templates

## 📚 Architecture Documentation

This template includes the **ITD (Implementation/Technical Decision)** framework for documenting technical decisions.

**👉 See [docs/README.md](docs/README.md) for templates, examples, and guidelines.**

**Example ITDs:**
- [Framework Selection (SST v3 + Next.js)](docs/examples/01-general/GENERAL-001-framework-selection.md)
- [Monorepo Structure](docs/examples/01-general/GENERAL-002-monorepo-structure.md)

## 🎨 Stitch Design System

This template includes the [Stitch Design System](https://github.com/bonterratech/stitch) - Bonterra's accessible React component library.

### ⚠️ Setup Required

Stitch requires authentication tokens for private package access.

**👉 See [docs/guides/stitch-setup.md](docs/guides/stitch-setup.md) for setup instructions.**

### Resources

- [Storybook](https://main.d2txqofa7g657p.amplifyapp.com/) - Component API & examples
- [Design Guidelines](https://zeroheight.com/635ad7a5d/p/0424a6-stitch-design-system)
- [Slack Support](https://bonterra.enterprise.slack.com/archives/C070GH413L3) - #stitch channel


## 🤝 Contributing

This is a Bonterra internal template. Follow Bonterra development standards.

