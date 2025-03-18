import { Handler } from "aws-lambda";

// Mock data for platform resources
const mockResources = [
  {
    id: "res-1",
    name: "User Documentation",
    description: "Comprehensive guides for using the Bonterra Platform",
    type: "Documentation",
    lastUpdated: "2023-03-10",
    status: "Active"
  },
  {
    id: "res-2",
    name: "API Reference",
    description: "Complete API documentation for Bonterra Platform integrations",
    type: "Developer Resource",
    lastUpdated: "2023-03-08",
    status: "Active"
  },
  {
    id: "res-3",
    name: "Component Library",
    description: "Reusable UI components for Bonterra Platform applications",
    type: "Developer Resource",
    lastUpdated: "2023-03-01",
    status: "Active"
  }
];

export const handler: Handler = async (event) => {
  // Add CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  try {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        resources: mockResources
      })
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch resources" })
    };
  }
}; 