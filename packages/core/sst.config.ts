/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST v3 configuration for bonstart-template
 * This defines how the app is deployed to AWS using SST's Nextjs component
 */
export default $config({
  app(input) {
    const awsProvider: aws.ProviderArgs = {
      region: "us-east-1" as aws.Region,
    };

    const longLivedEnvs = ["prod", "staging", "develop"];

    return {
      name: "bonstart-template",
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
      path: ".",
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

