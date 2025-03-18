import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
  Flex,
  Spinner,
  Alert,
} from '@chakra-ui/react';
import { buildApiUrl } from '../../utils/api';

// Define types for the component
interface RecurringDonation {
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
  metadata?: Record<string, unknown>;
}

const RecurringDonationsList = () => {
  const [donations, setDonations] = useState<RecurringDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Function to format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge color based on status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'green';
      case 'paused':
        return 'yellow';
      case 'cancelled':
        return 'red';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Fetch donations
  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const response = await fetch(buildApiUrl(`api/v1/recurring-donations?page=${page}&limit=10`));
        
        if (!response.ok) {
          throw new Error(`Failed to fetch recurring donations: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Ensure we have the expected format or handle different response formats
        if (result && result.data && Array.isArray(result.data)) {
          // Standard response format with pagination
          setDonations(result.data);
          setTotalPages(result.pagination?.pages || 1);
        } else if (Array.isArray(result)) {
          // API returned a direct array
          setDonations(result);
          setTotalPages(1); // No pagination info in this case
        } else {
          console.error('Unexpected API response format:', result);
          setDonations([]);
          setTotalPages(1);
          setError('Received invalid data format from server');
        }
      } catch (err) {
        console.error('Error fetching recurring donations:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setDonations([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [page]);

  // Handle page change
  const handlePreviousPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading recurring donations...</Text>
      </Box>
    );
  }

  if (error && donations.length === 0) {
    return (
      <Alert status="error" borderRadius="md" title="Error!">
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={4}>Recurring Donations</Heading>
      <Text mb={6}>Manage recurring donations for nonprofits.</Text>

      {donations.length === 0 ? (
        <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
          <Text>No recurring donations found.</Text>
        </Box>
      ) : (
        <>
          <Box overflowX="auto">
            <Box as="table" width="100%" variant="simple" borderWidth="1px" borderRadius="md">
              <Box as="thead" bg="gray.50">
                <Box as="tr">
                  <Box as="th" p={3}>ID</Box>
                  <Box as="th" p={3}>Nonprofit</Box>
                  <Box as="th" p={3}>Supporter</Box>
                  <Box as="th" p={3}>Amount</Box>
                  <Box as="th" p={3}>Frequency</Box>
                  <Box as="th" p={3}>Next Payment</Box>
                  <Box as="th" p={3}>Status</Box>
                </Box>
              </Box>
              <Box as="tbody">
                {donations.map((donation) => (
                  <Box as="tr" key={donation.id}>
                    <Box as="td" p={3} fontFamily="mono">{donation.id}</Box>
                    <Box as="td" p={3}>{donation.nonprofitId}</Box>
                    <Box as="td" p={3}>{donation.supporterId}</Box>
                    <Box as="td" p={3}>{formatCurrency(donation.amount, donation.currency)}</Box>
                    <Box as="td" p={3}>{donation.frequency}</Box>
                    <Box as="td" p={3}>{formatDate(donation.nextPaymentDate)}</Box>
                    <Box as="td" p={3}>
                      <Badge colorScheme={getStatusColor(donation.status)}>
                        {donation.status}
                      </Badge>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          <Flex mt={4} justifyContent="space-between">
            <Button 
              onClick={handlePreviousPage} 
              isDisabled={page <= 1}
              size="sm"
            >
              Previous
            </Button>
            <Text>
              Page {page} of {totalPages}
            </Text>
            <Button 
              onClick={handleNextPage} 
              isDisabled={page >= totalPages}
              size="sm"
            >
              Next
            </Button>
          </Flex>
        </>
      )}
    </Box>
  );
};

export default RecurringDonationsList; 