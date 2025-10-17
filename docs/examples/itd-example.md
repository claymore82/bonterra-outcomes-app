# GENERAL-001: SST v3 + Next.js Framework Selection

*Author: Engineering Team | Reviewers: Architecture | Status: approved*

## Context

Building a new project template for Bonterra teams that need to quickly spin up AWS-hosted web applications. Teams currently struggle with initial infrastructure setup, taking 1-2 weeks to configure CI/CD, authentication, and AWS resources. Need a modern, maintainable starting point that follows Bonterra standards.

**Constraints:**
- Must deploy to AWS (company standard)
- Node 22 LTS requirement (security policy)
- TypeScript for type safety
- Support multiple stages (dev, staging, prod)

## Problem

What framework stack should we use for the bonstart v2 template to provide the best developer experience while maintaining infrastructure-as-code best practices?

## Decision

**We will use SST v3 for infrastructure and Next.js 15 (App Router) for the application framework**

This combination provides:
- Modern React framework with built-in routing and API routes
- Infrastructure-as-code that's easy to understand and modify
- Excellent local development experience with `sst dev`
- Automatic AWS resource provisioning

## Reasoning

**SST v3 Advantages:**
- Declarative infrastructure that developers can understand (vs raw CloudFormation)
- Built-in local development with `sst dev` command
- Type-safe resource references across infrastructure and application code
- Automatic CloudFront + Lambda setup for Next.js
- Per-developer staging environments out of the box

**Next.js 15 Advantages:**
- Industry-standard React framework with strong ecosystem
- App Router provides modern routing with server components
- Built-in API routes eliminate need for separate backend
- Excellent TypeScript support
- Tailwind CSS integration is straightforward

**Real-world validation:**
- Bongentic project uses similar stack successfully
- Local development works reliably with `sst dev`
- Deployment time: ~5-8 minutes (acceptable for CI/CD)

### Alternatives Considered

- **AWS CDK + separate Next.js setup**: Rejected because CDK is more complex for teams unfamiliar with AWS constructs. SST provides better abstractions.

- **Serverless Framework + Next.js**: Rejected because Serverless Framework configuration is more fragmented. SST provides better integration with AWS services.

- **Amplify**: Rejected because it's more opinionated and harder to customize. Teams need flexibility for complex Bonterra integrations.

- **Remix + SST**: Rejected because Next.js has larger ecosystem and more team familiarity. Remix is excellent but would require more learning curve.

## Implications

- All new projects using this template will deploy to AWS Lambda + CloudFront
- Teams need to learn SST CLI commands (`sst dev`, `sst deploy`)
- Infrastructure changes happen in `sst.config.ts` (single source of truth)
- Must use Next.js patterns for API routes (no separate Express server)
- Cold start latency: ~500ms-1s (acceptable for most use cases)
- Cost: ~$5-20/month for low-traffic applications
- Documentation needed: SST concepts, stage management, environment variables

## References

- [SST v3 Documentation](https://sst.dev/)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Bongentic project](https://github.com/bonterratech/bongentic) - Reference implementation
- [SST Next.js Component](https://sst.dev/docs/component/aws/nextjs)

