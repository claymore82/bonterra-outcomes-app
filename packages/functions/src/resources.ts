import { APIGatewayProxyHandlerV2 } from "aws-lambda";

// Resource type definition
interface Resource {
  id: string;
  name: string;
  description: string;
  type: string;
  lastUpdated: string;
  status: string;
}

// Mock resources data for development/demo
const mockResources: Resource[] = [
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

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // In a real implementation, you would fetch resources from a database
    // const resources = await fetchResourcesFromDatabase();
    
    // For now, we'll use the mock data
    const resources = mockResources;
    
    // Optional: Add pagination parameters to match recurring-donations exactly
    // In a real implementation, you'd handle proper pagination based on query parameters
    const page = 1;
    const limit = resources.length;
    const total = resources.length;
    const pages = 1;

    // Return in the same format as recurring-donations
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: resources,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      })
    };
  } catch (error) {
    console.error("Error fetching resources:", error);
    
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Internal server error",
        error: (error instanceof Error) ? error.message : "Unknown error"
      })
    };
  }
}; 