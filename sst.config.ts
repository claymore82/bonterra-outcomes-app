/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST v3 configuration for {{APP_NAME}}
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
      name: "{{APP_NAME}}",
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
    });

    // Return outputs
    return {
      url: site.url,
    };
  },
});

