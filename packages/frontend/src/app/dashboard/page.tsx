'use client'

import { useState } from 'react'
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Button, 
  Stack,
} from '@chakra-ui/react'
import ResourcesList from '../components/ResourcesList'

// Icons for the sidebar
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const ResourcesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
  </svg>
);

const DocsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

// Sidebar item type
interface SidebarItem {
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  isActive: boolean;
}

// Sidebar links with icons
const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', icon: HomeIcon, isActive: true },
  { name: 'Resources', icon: ResourcesIcon, isActive: false },
  { name: 'Documentation', icon: DocsIcon, isActive: false },
  { name: 'Settings', icon: SettingsIcon, isActive: false }
];

export default function Dashboard() {
  const [activeItem, setActiveItem] = useState('Dashboard');
  
  return (
    <Flex h="100vh" overflow="hidden">
      {/* Sidebar */}
      <Box
        w="250px"
        bg="white"
        borderRight="1px"
        borderColor="gray.200"
        p={5}
      >
        <Heading size="md" mb={6}>Bonstart</Heading>
        <Stack direction="column" spacing={1}>
          {sidebarItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              justifyContent="flex-start"
              py={3}
              leftIcon={<item.icon width="20" height="20" />}
              colorScheme={activeItem === item.name ? "blue" : "gray"}
              onClick={() => setActiveItem(item.name)}
              borderRadius="md"
              width="100%"
            >
              {item.name}
            </Button>
          ))}
        </Stack>
        
        <Box mt="auto" pt={6}>
          <Box borderTopWidth="1px" borderColor="gray.200" my={6} />
          <Flex align="center">
            <Box
              w="36px"
              h="36px"
              borderRadius="full"
              bg="blue.500"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontWeight="bold"
              mr={3}
            >
              US
            </Box>
            <Box>
              <Text fontWeight="medium">User Name</Text>
              <Text fontSize="sm" color="gray.500">user@example.com</Text>
            </Box>
          </Flex>
        </Box>
      </Box>

      {/* Main content */}
      <Box flex="1" p={8} overflowY="auto">
        <Box mb={8}>
          <Heading size="lg" mb={2}>Welcome to the Dashboard</Heading>
          <Text color="gray.500">Manage your resources and monitor your applications</Text>
        </Box>

        {/* Display content based on active sidebar item */}
        {activeItem === 'Dashboard' && (
          <Box>
            <Heading size="md" mb={4}>Overview</Heading>
            <Text mb={6}>This dashboard provides access to all Bonterra Platform resources and services.</Text>
            
            <Box mt={8}>
              <ResourcesList />
            </Box>
          </Box>
        )}
        
        {activeItem === 'Resources' && (
          <Box>
            <Heading size="md" mb={4}>All Resources</Heading>
            <ResourcesList />
          </Box>
        )}
        
        {activeItem === 'Documentation' && (
          <Box>
            <Heading size="md" mb={4}>Documentation</Heading>
            <Text>View comprehensive documentation about the Bonterra Platform.</Text>
          </Box>
        )}
        
        {activeItem === 'Settings' && (
          <Box>
            <Heading size="md" mb={4}>Settings</Heading>
            <Text>Configure your profile and application preferences.</Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
} 