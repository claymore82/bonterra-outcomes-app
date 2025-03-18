import { bucket } from "./storage";

export const api = new sst.aws.ApiGatewayV2("Api");

api.route("GET /", {
  link: [bucket],
  handler: "packages/functions/src/api.handler",
});

// Add a route for resources
api.route("GET /api/v1/resources", {
  handler: "packages/functions/src/resources.handler",
});

// Recurring Donations API
// List all recurring donations
api.route("GET /api/v1/recurring-donations", {
  handler: "packages/functions/src/recurring-donations/list.handler",
});

// Get a recurring donation by ID
api.route("GET /api/v1/recurring-donations/{id}", {
  handler: "packages/functions/src/recurring-donations/get.handler",
});

// Create a new recurring donation
api.route("POST /api/v1/recurring-donations", {
  handler: "packages/functions/src/recurring-donations/create.handler",
});

// Update a recurring donation
api.route("PUT /api/v1/recurring-donations/{id}", {
  handler: "packages/functions/src/recurring-donations/update.handler",
});

// Delete (cancel) a recurring donation
api.route("DELETE /api/v1/recurring-donations/{id}", {
  handler: "packages/functions/src/recurring-donations/delete.handler",
});

// Pause a recurring donation
api.route("PATCH /api/v1/recurring-donations/{id}/pause", {
  handler: "packages/functions/src/recurring-donations/pause.handler",
});

// Resume a recurring donation
api.route("PATCH /api/v1/recurring-donations/{id}/resume", {
  handler: "packages/functions/src/recurring-donations/resume.handler",
});

// Process a payment for a recurring donation
api.route("POST /api/v1/recurring-donations/{id}/process", {
  handler: "packages/functions/src/recurring-donations/process.handler",
});