import { Handler, APIGatewayProxyEvent } from 'aws-lambda';
import { RecurringDonations } from '@bonstart/core';

export const handler: Handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Parse request body
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
    
    // Validate required fields
    const requiredFields = ['nonprofitId', 'supporterId', 'amount', 'frequency', 'paymentMethodId'];
    const missingFields = requiredFields.filter(field => !input[field]);
    
    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: `Missing required fields: ${missingFields.join(', ')}`
          }
        })
      };
    }
    
    // Create the recurring donation
    const newDonation = RecurringDonations.RecurringDonationsRepository.create(input);
    
    // Return with 201 Created status and Location header
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Location': `/api/v1/recurring-donations/${newDonation.id}`
      },
      body: JSON.stringify(newDonation)
    };
  } catch (error) {
    console.error('Error creating recurring donation:', error);
    
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