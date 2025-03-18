'use client'

import { Box, Heading, Text, Container, Button, Stack, Flex } from '@chakra-ui/react'
import ResourcesList from './components/ResourcesList'

export default function Home() {
  return (
    <Container maxW="container.xl" py={10}>
      <Box textAlign="center" py={10}>
        <Heading as="h1" size="2xl" mb={4}>
          Welcome to Bonstart
        </Heading>
        <Text fontSize="xl" mb={6}>
          Bonterra Platform Starter Application
        </Text>
        <Stack direction={['column', 'row']} gap={4} justify="center">
          <Button colorScheme="blue" size="lg">
            Get Started
          </Button>
          <Button colorScheme="gray" size="lg">
            Documentation
          </Button>
        </Stack>
      </Box>
      
      <Flex direction={['column', 'row']} gap={8} mt={10}>
        <Box flex={1} p={6} boxShadow="md" borderRadius="md">
          <Heading as="h2" size="lg" mb={4}>
            What is Bonstart?
          </Heading>
          <Text>
            Bonstart is a starter application for building within the Bonterra Platform.
            It demonstrates AWS native serverless architecture patterns and provides a foundation
            for developing scalable web applications.
          </Text>
        </Box>
        
        <Box flex={1} p={6} boxShadow="md" borderRadius="md">
          <Heading as="h2" size="lg" mb={4}>
            Why Bonstart?
          </Heading>
          <Text>
            Bonstart accelerates your development by providing a pre-configured environment with 
            best practices for serverless architecture. It includes API integration examples, 
            modern frontend components, and deployment workflows.
          </Text>
        </Box>
      </Flex>
      
      <Box mt={10} p={6} boxShadow="md" borderRadius="md">
        <ResourcesList />
      </Box>
    </Container>
  )
}
