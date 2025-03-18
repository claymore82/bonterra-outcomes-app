import { Handler, APIGatewayProxyEvent } from 'aws-lambda';
import { RecurringDonations } from '@bonstart/core';

export const handler: Handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Parse query string parameters
    const queryParams = event.queryStringParameters || {};
    
    // Convert string parameters to appropriate types
    const page = queryParams.page ? parseInt(queryParams.page) : 1;
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 20;
    
    // Get donations with filters
    const result = RecurringDonations.RecurringDonationsRepository.getAll({
      page,
      limit,
      nonprofitId: queryParams.nonprofitId,
      supporterId: queryParams.supporterId,
      status: queryParams.status,
      fromDate: queryParams.fromDate,
      toDate: queryParams.toDate
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error listing recurring donations:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      })
    };
  }
}; 