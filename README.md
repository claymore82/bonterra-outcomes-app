# Bonstart v2

> Modern SST v3 + Next.js template for Bonterra projects

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

## 📦 What's Included

- **SST v3**: Modern infrastructure as code for AWS
- **Next.js 15**: React framework with App Router
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Full type safety
- **Node 22**: Latest LTS
- **ITD Documentation**: Architecture decision templates and examples
- **ESLint + Prettier**: Code quality and formatting

## 📚 Documentation

### Architecture Decisions

Document your technical decisions using the **ITD (Implementation/Technical Decision)** framework:

```bash
# See templates and examples
docs/
├── README.md                   # Documentation guidelines
├── templates/                  # ITD and data structure templates
├── examples/                   # Example ITD
├── 01-general/                 # System-wide decisions
├── 02-auth/                    # Authentication decisions
└── core-data-structures/       # Data models
```

**Quick Start:**
1. Copy a template from `docs/templates/`
2. Document your decision with context, alternatives, and reasoning
3. Name with category prefix (e.g., `GENERAL-001-your-decision.md`)
4. Create PR for team review

See [docs/README.md](docs/README.md) for full guidelines.

## 🤝 Contributing

This is a Bonterra internal template. Follow Bonterra development standards.

---

Built with ❤️ for Bonterra

