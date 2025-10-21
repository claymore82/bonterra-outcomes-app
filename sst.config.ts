/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST v3 configuration for bonstart-template-replace-me
 * This defines how the app is deployed to AWS using SST's Nextjs component
 */
export default $config({
  app(input) {
    const awsProvider: aws.ProviderArgs = {
      region: "us-east-1" as aws.Region,
    };

    const longLivedEnvs = ["prod", "staging", "develop"];

    return {
      // Resource naming: All AWS resources will be prefixed with this name + stage
      // e.g. "my-project-dev-Site" for dev stage, "my-project-prod-Site" for prod
      name: "bonstart-template-replace-me",
      removal: longLivedEnvs.includes(input?.stage) ? "retain" : "remove",
      protect: longLivedEnvs.includes(input?.stage),
      home: "aws",
      region: "us-east-1",
      providers: {
        aws: awsProvider,
      },
    };
  },
  async run() {
    const longLivedEnvs = ["prod", "staging", "develop"];
    
    // AWS managed CloudFront cache policy IDs
    // See: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html
    const AWS_MANAGED_CACHING_DISABLED_POLICY_ID = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad";

    // Stage-based configuration
    const config = {
      APP_BASE_URL_LOCAL: "http://localhost:3000",
    };

    // Deploy the Next.js app
    const site = new sst.aws.Nextjs("Site", {
      path: "packages/next",
      environment: {
        ...($dev && { APP_BASE_URL: config.APP_BASE_URL_LOCAL }),
      },
      // CloudFront cache policy strategy:
      // - Long-lived envs (prod/staging/develop): SST creates dedicated cache policies (3 total)
      // - Ephemeral branches: Use AWS managed "CachingDisabled" policy (doesn't count against quota, ensures streaming works)
      ...(!longLivedEnvs.includes($app.stage)
        ? { cachePolicy: AWS_MANAGED_CACHING_DISABLED_POLICY_ID }
        : {}),
    });

    // Return outputs
    return {
      url: site.url,
    };
  },
});

