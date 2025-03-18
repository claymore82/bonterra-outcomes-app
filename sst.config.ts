/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "bonstart",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile: process.env.AWS_PROFILE || "investingio"
        }
      },
    };
  },
  async run() {
    const storage = await import("./infra/storage");
    const api = await import("./infra/api");
    const frontend = await import("./infra/frontend");

    return {
      MyBucket: storage.bucket.name,
      api: api.api.url,
      frontendUrl: frontend.site.url,
    };
  },
});
