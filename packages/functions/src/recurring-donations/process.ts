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
    
    // Process the payment
    const result = RecurringDonations.RecurringDonationsRepository.processPayment(id);
    
    return {
      statusCode: 202,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Payment processing initiated',
        paymentId: result.paymentId,
        status: result.status
      })
    };
  } catch (error) {
    console.error('Error processing payment for recurring donation:', error);
    
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