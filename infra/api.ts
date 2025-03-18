import { bucket } from "./storage";

export const api = new sst.aws.ApiGatewayV2("Api");

api.route("GET /", {
  link: [bucket],
  handler: "packages/functions/src/api.handler",
});

// Add a route for resources
api.route("GET /resources", {
  handler: "packages/functions/src/resources.handler",
});