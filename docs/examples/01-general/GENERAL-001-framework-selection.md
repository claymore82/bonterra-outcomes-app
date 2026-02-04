# GENERAL-001: SST v3 + Next.js Framework Selection

## Context

Building a new project template for Bonterra teams that need to quickly spin up AWS-hosted web applications. Teams currently struggle with initial infrastructure setup, taking 1-2 weeks to configure CI/CD, authentication, and AWS resources. Need a modern, maintainable starting point that follows Bonterra standards.

**Constraints:**

- Must deploy to AWS (company standard)
- Node 22 LTS requirement (security policy)
- TypeScript for type safety
- Support multiple stages (dev, staging, prod)

## Problem

What framework stack should we use for the bonstart v2 template to provide the best developer experience while maintaining infrastructure-as-code best practices?

## Options Considered

1. **SST v3 + Next.js 15**: Infrastructure-as-code framework specifically designed for serverless apps on AWS, paired with modern React framework
2. AWS CDK + Next.js: Lower-level infrastructure framework with more control but higher complexity
3. Serverless Framework + Next.js: Popular serverless deployment tool with plugin ecosystem
4. AWS Amplify: Fully-managed AWS service for deploying web applications
5. SST v3 + Remix: SST paired with alternative React framework focused on web standards

## Reasoning

SST v3 provides the right level of abstraction for infrastructure-as-code. Unlike raw CloudFormation or CDK, developers can understand and modify the infrastructure without deep AWS expertise. The `sst dev` command creates an excellent local development experience, and the framework handles per-developer staging environments automatically. Type-safe resource references across infrastructure and application code prevent common configuration errors.

Next.js 15 is the industry-standard React framework with a strong ecosystem and excellent TypeScript support. The App Router provides modern routing with server components, and built-in API routes remove the need for a separate backend. The framework integrates naturally with SST's deployment model.

Real-world validation from the Bongentic project shows this stack works reliably in production with acceptable deployment times (~5-8 minutes for CI/CD).

*AWS CDK + Next.js:* CDK requires deeper AWS knowledge and familiarity with CloudFormation constructs. Teams unfamiliar with AWS would face a steeper learning curve. SST provides better abstractions while still allowing customization when needed.

*Serverless Framework + Next.js:* Configuration is more fragmented across multiple plugins and providers. Integration with AWS services requires more manual setup compared to SST's built-in components. The development experience is less streamlined.

*AWS Amplify:* Too opinionated and harder to customize for complex Bonterra integrations. Teams need flexibility to integrate with existing systems, authentication providers, and custom AWS resources. Amplify's abstraction layer can become a limitation.

*SST v3 + Remix:* While Remix is an excellent framework focused on web standards, Next.js has a larger ecosystem and more team familiarity within Bonterra. The learning curve for Remix would delay adoption without providing significant advantages for our use cases.

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
