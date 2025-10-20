# Bonstart v2

> Modern SST v3 + Next.js template for Bonterra projects

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

**`bonstart:init`** - Initial project configuration:
- **Project name** (replaces "bonstart-template" everywhere)
- Removes setup warnings and template files

**`bonstart:init-ci`** - CI/CD configuration:
- **GitHub organization/username** (for GitHub Actions)
- **Repository name** (defaults to project name)
- **AWS Account IDs** (optional, for CloudFormation templates)
- Configures GitHub Actions workflows and CloudFormation templates

## 📦 What's Included

- **SST v3**: Modern infrastructure as code for AWS
- **Next.js 15**: React framework with App Router
- **Tailwind CSS**: Utility-first styling
- **Stitch Design System**: Bonterra's design system (Step 2)
- **Auth0 Integration**: Authentication boilerplate (Step 4)
- **TypeScript**: Full type safety
- **Node 22**: Latest LTS

## 🛠️ Development Status

This is **Step 1** of the bonstart v2 template.

### ✅ Completed
- Basic SST + Next.js structure
- Tailwind CSS setup
- Development scripts
- Placeholder system

### 🚧 Coming Soon
- Stitch design system integration
- Auth0 boilerplate
- Setup script (bonstart:init)
- Comprehensive documentation

## 📚 Documentation

Full documentation coming in Step 8.

## 🤝 Contributing

This is a Bonterra internal template. Follow Bonterra development standards.

---

Built with ❤️ for Bonterra

