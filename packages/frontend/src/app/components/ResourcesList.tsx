'use client'

import { useState, useEffect } from 'react'
import { Box, Heading, Text, Button, Flex, Spinner } from '@chakra-ui/react'
import { buildApiUrl } from '../../utils/api'

// Define the resource type
interface Resource {
  id: string;
  name: string;
  description: string;
  type: string;
  lastUpdated: string;
  status: string;
}

export default function ResourcesList() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        // Call the API endpoint using the buildApiUrl utility
        const response = await fetch(buildApiUrl('api/v1/resources'));
        
        if (!response.ok) {
          throw new Error(`Failed to fetch resources: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure we have the expected format or handle different response formats
        if (data && data.data && Array.isArray(data.data)) {
          // Standard response format with data property
          setResources(data.data);
        } else if (Array.isArray(data)) {
          // API returned a direct array
          setResources(data);
        } else {
          console.error('Unexpected API response format:', data);
          setResources([]);
          setError('Received invalid data format from server');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError('Failed to load resources. Please try again later.');
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={3}>Loading resources...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.100" borderRadius="md">
        <Heading size="md">Error!</Heading>
        <Text>{error}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>
        Platform Resources
      </Heading>
      
      {resources.length === 0 ? (
        <Text>No resources available currently. Check back later.</Text>
      ) : (
        <Flex direction={["column", "row"]} wrap="wrap" gap={6}>
          {resources.map((resource) => (
            <Box 
              key={resource.id}
              p={4} 
              borderWidth="1px" 
              borderRadius="md"
              boxShadow="sm"
              flex={["1 1 100%", "1 1 45%", "1 1 30%"]}
              _hover={{ boxShadow: "md" }}
              transition="all 0.2s"
            >
              <Heading size="md" mb={2}>{resource.name}</Heading>
              <Text mb={2}>{resource.description}</Text>
              <Text fontSize="sm" color="gray.500">Type: {resource.type}</Text>
              <Text fontSize="sm" color="gray.500">
                Last Updated: {new Date(resource.lastUpdated).toLocaleDateString()}
              </Text>
              <Text fontSize="sm" color="gray.500" mb={3}>Status: {resource.status}</Text>
              <Button colorScheme="blue" size="sm">View Details</Button>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  );
} 