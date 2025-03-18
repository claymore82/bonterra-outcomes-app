export interface RecurringDonation {
  id: string;
  nonprofitId: string;
  supporterId: string;
  amount: number;
  currency: string;
  frequency: string;
  paymentMethodId: string;
  status: string;
  startDate: string;
  nextPaymentDate: string;
  lastPaymentDate?: string;
  lastPaymentStatus?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RecurringDonationQueryParams extends PaginationParams {
  nonprofitId?: string;
  supporterId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateRecurringDonationInput {
  nonprofitId: string;
  supporterId: string;
  amount: number;
  currency?: string;
  frequency: string;
  paymentMethodId: string;
  startDate?: string;
  metadata?: Record<string, any>;
}

export interface UpdateRecurringDonationInput {
  amount?: number;
  currency?: string;
  frequency?: string;
  paymentMethodId?: string;
  status?: string;
  nextPaymentDate?: string;
  metadata?: Record<string, any>;
}

export type RecurringDonationStatus = 'active' | 'paused' | 'cancelled' | 'failed';
export type RecurringDonationFrequency = 'monthly' | 'quarterly' | 'annual'; 