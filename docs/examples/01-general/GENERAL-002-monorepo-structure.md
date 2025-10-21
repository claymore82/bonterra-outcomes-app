# GENERAL-002: Monorepo Structure for bonstart Template

## Context

bonstart is positioned as Bonterra's SST serverless template for AWS-hosted applications. Bonterra already has Brian's frontend template for simple Next.js projects with a flat structure. As teams adopt bonstart for serverless projects, they typically need to add Lambda functions, shared code libraries, and additional services beyond just the initial Next.js application.

**Constraints:**
- Must support SST's infrastructure-as-code patterns
- Should accommodate growth from simple to complex applications
- Need to enable code sharing between frontend and backend
- Must work with npm workspaces for dependency management

## Problem

What project structure should bonstart use to best support both initial simplicity and future growth into multi-service serverless applications?

## Options Considered

- **Monorepo with packages/ directory**: npm workspaces with organized packages for core app, functions, and shared code
- Flat structure with single package.json: All code at root level, similar to create-next-app
- Separate repositories: Each service (frontend, functions, shared) in its own repo
- Monorepo with /apps and /packages separation: More complex structure distinguishing applications from libraries

## Reasoning

The monorepo structure with `packages/` is the standard recommended by SST for serverless projects and provides the natural growth path teams need. When teams start with bonstart, they typically begin with just the Next.js app in `packages/core`, but within weeks they need to add standalone Lambda functions for cron jobs, event processors, or async workers. The monorepo structure accommodates this growth without requiring refactoring.

Code sharing is critical for serverless applications. Teams need to share TypeScript types, validation schemas, and business logic between their frontend and Lambda functions. The `packages/` structure with npm workspaces makes this trivial - teams can create `packages/shared` and import it from both `packages/core` and `packages/functions` with proper type safety.

SST's official documentation and examples use this monorepo structure. The framework expects packages for core shared code, functions for Lambda handlers, and organized infrastructure definitions. Following this convention means teams can reference SST documentation and examples directly without translation.

Real-world validation: successful SST projects in the community consistently adopt this structure as they scale. The initial overhead of one extra directory level (`packages/core` vs `src`) is minimal compared to the refactoring cost of restructuring from flat to monorepo later.

*Flat structure with single package.json:* While simpler initially, this creates significant friction when teams need their first standalone Lambda function. Where does it go? How do they share code without circular dependencies? Teams end up either cramming everything into the Next.js app (wrong architecture) or doing a painful refactoring to extract shared code. The simplicity is false economy.

*Separate repositories:* This creates versioning hell and deployment complexity. When a team needs to update a shared type, they have to coordinate releases across multiple repos. CI/CD becomes fragmented. SST's strength is unified infrastructure-as-code, which works best in a monorepo.

*Monorepo with /apps and /packages separation:* This structure is better for organizations with many distinct applications. For a starter template, it adds unnecessary complexity. Teams using bonstart are building one primary application that might spawn additional services - they don't need the apps/packages distinction.

## Implications

- Template includes `packages/` directory with `packages/core` for Next.js app from day one
- Root `package.json` uses npm workspaces to manage packages
- Documentation must explain when/how to add `packages/functions` and `packages/shared`
- Clear differentiation needed: Brian's frontend template for simple sites, bonstart for serverless projects
- README should include example growth path showing future packages structure
- Scripts in root package.json delegate to workspace packages (`npm run dev -w packages/core`)

## References

- [SST Monorepo Documentation](https://sst.dev/docs/set-up-a-monorepo/)
- [SST Project Structure Guide](https://guide.sst.dev/archives/organizing-serverless-projects.html)
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- Brian's frontend template - Alternative for non-serverless projects

