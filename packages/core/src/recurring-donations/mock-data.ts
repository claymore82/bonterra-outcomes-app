import { RecurringDonation, RecurringDonationQueryParams, PaginatedResponse, CreateRecurringDonationInput, UpdateRecurringDonationInput } from './types';
import { v4 as uuidv4 } from 'uuid';

// Mock data for testing
const mockRecurringDonations: RecurringDonation[] = [
  {
    id: '1',
    nonprofitId: 'nonprofit-1',
    supporterId: 'supporter-1',
    amount: 25.00,
    currency: 'USD',
    frequency: 'monthly',
    paymentMethodId: 'payment-1',
    status: 'active',
    startDate: '2023-01-01T00:00:00Z',
    nextPaymentDate: '2023-03-01T00:00:00Z',
    lastPaymentDate: '2023-02-01T00:00:00Z',
    lastPaymentStatus: 'success',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-02-01T00:00:00Z',
    metadata: {
      campaign: 'winter-2023'
    }
  },
  {
    id: '2',
    nonprofitId: 'nonprofit-1',
    supporterId: 'supporter-2',
    amount: 50.00,
    currency: 'USD',
    frequency: 'quarterly',
    paymentMethodId: 'payment-2',
    status: 'active',
    startDate: '2023-01-15T00:00:00Z',
    nextPaymentDate: '2023-04-15T00:00:00Z',
    lastPaymentDate: '2023-01-15T00:00:00Z',
    lastPaymentStatus: 'success',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-01-15T00:00:00Z',
    metadata: {
      campaign: 'winter-2023'
    }
  },
  {
    id: '3',
    nonprofitId: 'nonprofit-2',
    supporterId: 'supporter-3',
    amount: 100.00,
    currency: 'USD',
    frequency: 'annual',
    paymentMethodId: 'payment-3',
    status: 'paused',
    startDate: '2023-02-01T00:00:00Z',
    nextPaymentDate: '2024-02-01T00:00:00Z',
    createdAt: '2023-02-01T00:00:00Z',
    updatedAt: '2023-02-15T00:00:00Z'
  },
  {
    id: '4',
    nonprofitId: 'nonprofit-2',
    supporterId: 'supporter-4',
    amount: 15.00,
    currency: 'USD',
    frequency: 'monthly',
    paymentMethodId: 'payment-4',
    status: 'cancelled',
    startDate: '2023-01-10T00:00:00Z',
    nextPaymentDate: '2023-03-10T00:00:00Z',
    lastPaymentDate: '2023-02-10T00:00:00Z',
    lastPaymentStatus: 'success',
    createdAt: '2023-01-10T00:00:00Z',
    updatedAt: '2023-02-20T00:00:00Z'
  },
  {
    id: '5',
    nonprofitId: 'nonprofit-3',
    supporterId: 'supporter-5',
    amount: 75.00,
    currency: 'USD',
    frequency: 'monthly',
    paymentMethodId: 'payment-5',
    status: 'failed',
    startDate: '2023-02-05T00:00:00Z',
    nextPaymentDate: '2023-04-05T00:00:00Z',
    lastPaymentDate: '2023-03-05T00:00:00Z',
    lastPaymentStatus: 'failed',
    createdAt: '2023-02-05T00:00:00Z',
    updatedAt: '2023-03-05T00:00:00Z'
  }
];

// In-memory database
let recurringDonations = [...mockRecurringDonations];

export const RecurringDonationsRepository = {
  // Get all recurring donations with pagination and filtering
  getAll: (params: RecurringDonationQueryParams): PaginatedResponse<RecurringDonation> => {
    const { page = 1, limit = 20, nonprofitId, supporterId, status, fromDate, toDate } = params;
    
    // Apply filters
    let filtered = [...recurringDonations];
    
    if (nonprofitId) {
      filtered = filtered.filter(d => d.nonprofitId === nonprofitId);
    }
    
    if (supporterId) {
      filtered = filtered.filter(d => d.supporterId === supporterId);
    }
    
    if (status) {
      filtered = filtered.filter(d => d.status === status);
    }
    
    if (fromDate) {
      filtered = filtered.filter(d => new Date(d.startDate) >= new Date(fromDate));
    }
    
    if (toDate) {
      filtered = filtered.filter(d => new Date(d.startDate) <= new Date(toDate));
    }
    
    // Calculate pagination
    const total = filtered.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Get paginated results
    const data = filtered.slice(startIndex, endIndex);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    };
  },
  
  // Get a recurring donation by ID
  getById: (id: string): RecurringDonation | undefined => {
    return recurringDonations.find(d => d.id === id);
  },
  
  // Create a new recurring donation
  create: (input: CreateRecurringDonationInput): RecurringDonation => {
    const now = new Date().toISOString();
    const startDate = input.startDate || now;
    
    // Calculate nextPaymentDate based on frequency
    let nextPaymentDate = new Date(startDate);
    switch (input.frequency) {
      case 'monthly':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
        break;
      case 'annual':
        nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
        break;
      default:
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }
    
    const newDonation: RecurringDonation = {
      id: uuidv4(),
      nonprofitId: input.nonprofitId,
      supporterId: input.supporterId,
      amount: input.amount,
      currency: input.currency || 'USD',
      frequency: input.frequency,
      paymentMethodId: input.paymentMethodId,
      status: 'active',
      startDate,
      nextPaymentDate: nextPaymentDate.toISOString(),
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata
    };
    
    recurringDonations.push(newDonation);
    return newDonation;
  },
  
  // Update a recurring donation
  update: (id: string, input: UpdateRecurringDonationInput): RecurringDonation | undefined => {
    const index = recurringDonations.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    
    const updated = {
      ...recurringDonations[index],
      ...input,
      updatedAt: new Date().toISOString()
    };
    
    recurringDonations[index] = updated;
    return updated;
  },
  
  // Delete (cancel) a recurring donation
  delete: (id: string): boolean => {
    const index = recurringDonations.findIndex(d => d.id === id);
    if (index === -1) return false;
    
    recurringDonations[index] = {
      ...recurringDonations[index],
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    };
    
    return true;
  },
  
  // Pause a recurring donation
  pause: (id: string): RecurringDonation | undefined => {
    const index = recurringDonations.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    
    const updated = {
      ...recurringDonations[index],
      status: 'paused',
      updatedAt: new Date().toISOString()
    };
    
    recurringDonations[index] = updated;
    return updated;
  },
  
  // Resume a recurring donation
  resume: (id: string): RecurringDonation | undefined => {
    const index = recurringDonations.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    
    const updated = {
      ...recurringDonations[index],
      status: 'active',
      updatedAt: new Date().toISOString()
    };
    
    recurringDonations[index] = updated;
    return updated;
  },
  
  // Process a payment for a recurring donation
  processPayment: (id: string): { paymentId: string, status: string } => {
    const donation = recurringDonations.find(d => d.id === id);
    if (!donation) {
      throw new Error('Recurring donation not found');
    }
    
    // In a real implementation, this would call a payment service
    return {
      paymentId: uuidv4(),
      status: 'processing'
    };
  }
}; 