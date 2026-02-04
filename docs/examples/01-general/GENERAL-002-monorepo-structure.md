# GENERAL-002: Monorepo Structure for bonstart Template

## Context

bonstart serves as Bonterra's SST serverless template for AWS-hosted applications. Bonterra already has a separate [Next.js frontend template](https://github.com/bonterratech/nextjs-frontend-template) that uses a flat structure—perfect for simple web applications, marketing sites, and projects that don't need backend infrastructure. bonstart serves a different use case: teams building serverless applications on AWS that need Lambda functions, infrastructure-as-code, and backend services.

As teams adopt bonstart for serverless projects, they typically need to add standalone Lambda functions (cron jobs, event processors, async workers), shared code libraries (types, validation, utilities), and additional AWS resources beyond just the Next.js application. The question is whether bonstart should start with a monorepo structure or a flat structure like the frontend template.

**Constraints:**

- Must support SST's infrastructure-as-code patterns
- Should accommodate growth from simple to complex serverless applications
- Need to enable code sharing between frontend and backend Lambda functions
- Must work with npm workspaces for dependency management
- Cannot confuse users about when to use bonstart vs. frontend template

## Problem

What project structure should bonstart use to best support both initial simplicity and future growth into multi-service serverless applications?

## Options Considered

1. **Monorepo with packages/ directory**: npm workspaces with organized packages for Next.js app, functions, and shared code
2. Flat structure with single package.json: All code at root level, similar to create-next-app
3. Separate repositories: Each service (frontend, functions, shared) in its own repo
4. Monorepo with /apps and /packages separation: More complex structure distinguishing applications from libraries

## Reasoning

The monorepo structure with `packages/` is the standard that SST recommends for serverless projects and provides the natural growth path teams need. When teams start with bonstart, they typically begin with just the Next.js app in `packages/next`, but within weeks they need to add standalone Lambda functions for cron jobs, event processors, or async workers. The monorepo structure accommodates this growth without requiring refactoring.

Code sharing is critical for serverless applications. Teams need to share TypeScript types, validation schemas, and business logic between their frontend and Lambda functions. The `packages/` structure with npm workspaces makes this trivial—teams can create `packages/shared` and import it from both `packages/next` and `packages/functions` with proper type safety.

SST's official documentation and examples use this monorepo structure. The framework expects packages for core shared code, functions for Lambda handlers, and organized infrastructure definitions. Following this convention means teams can reference SST documentation and examples directly without translation.

Real-world validation: successful SST projects in the community consistently adopt this structure as they scale. The initial overhead of one extra directory level (`packages/next` vs `src`) is minimal compared to the refactoring cost of restructuring from flat to monorepo later.

*Flat structure with single package.json:* While simpler initially (and appropriate for the [frontend template](https://github.com/bonterratech/nextjs-frontend-template)), this creates significant friction when teams need their first standalone Lambda function. Where does it go? How do they share code without circular dependencies? Teams end up either cramming everything into the Next.js app (wrong architecture) or doing a painful refactoring to move shared code into a separate package. The simplicity is false economy for serverless projects. If a team wants flat structure, they should use the frontend template, not bonstart.

*Separate repositories:* This creates versioning hell and deployment complexity. When a team needs to update a shared type, they have to coordinate releases across multiple repos. CI/CD becomes fragmented. SST's strength is unified infrastructure-as-code, which works best in a monorepo.

*Monorepo with /apps and /packages separation:* This structure is better for organizations with many distinct applications. For a starter template, it adds unnecessary complexity. Teams using bonstart are building one primary application that might spawn additional services - they don't need the apps/packages distinction.

## Implications

- Template includes `packages/` directory with `packages/next` for Next.js app from day one
- Root `package.json` uses npm workspaces to manage packages
- Documentation must explain when/how to add `packages/functions` and `packages/shared`
- **Template selection guidance required**:
  - [Frontend template](https://github.com/bonterratech/nextjs-frontend-template): Simple Next.js sites, marketing pages, no backend infrastructure
  - bonstart: SST serverless projects needing Lambda functions, AWS resources, infrastructure-as-code
- README should include example growth path showing future packages structure
- Scripts in root package.json delegate to workspace packages (`npm run dev -w packages/next`)
- The one extra directory level (`packages/next` vs `src`) is the intentional cost of preparing for serverless growth

## References

- [SST Monorepo Documentation](https://sst.dev/docs/set-up-a-monorepo/)
- [SST Project Structure Guide](https://guide.sst.dev/archives/organizing-serverless-projects.html)
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- [Bonterra Next.js Frontend Template](https://github.com/bonterratech/nextjs-frontend-template) - For simple sites without serverless infrastructure
