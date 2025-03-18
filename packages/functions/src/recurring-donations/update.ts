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
    
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: {
            code: 'MISSING_BODY',
            message: 'Request body is required'
          }
        })
      };
    }
    
    const input = JSON.parse(event.body);
    
    // Check if the donation exists
    const existing = RecurringDonations.RecurringDonationsRepository.getById(id);
    if (!existing) {
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
    
    // Update the donation
    const updated = RecurringDonations.RecurringDonationsRepository.update(id, input);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updated)
    };
  } catch (error) {
    console.error('Error updating recurring donation:', error);
    
    // Handle parsing errors separately
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body'
          }
        })
      };
    }
    
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