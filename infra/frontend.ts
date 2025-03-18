import { api } from "./api";

// Create a Next.js site
export const site = new sst.aws.Nextjs("Frontend", {
  path: "packages/frontend",
  // Configure environment variables required by the frontend
  environment: {
    // Pass the API URL to the frontend
    NEXT_PUBLIC_API_URL: api.url,
  },
}); 