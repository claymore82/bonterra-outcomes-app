import { Handler, APIGatewayProxyEvent } from 'aws-lambda';
import { RecurringDonations } from '@bonstart/core';

export const handler: Handler = async (event: APIGatewayProxyEvent) => {
  try {
    const id = event.pathParameters?.id;
    
    if (!id) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Missing required parameter: id'
          }
        })
      };
    }
    
    const donation = RecurringDonations.RecurringDonationsRepository.getById(id);
    
    if (!donation) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: `Recurring donation with id ${id} not found`
          }
        })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(donation)
    };
  } catch (error) {
    console.error('Error getting recurring donation:', error);
    
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