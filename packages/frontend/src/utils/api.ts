// This gets replaced at build time with the actual API URL from SST
// During local development, this can be overridden by setting API_URL in .env.local
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Log warning if API_URL is not set
if (!API_URL && typeof window !== 'undefined') {
  console.warn(
    'API_URL is not set. Make sure NEXT_PUBLIC_API_URL environment variable is properly configured. ' +
    'API requests will likely fail.'
  );
}

// Helper function to build API URLs
export const buildApiUrl = (path: string): string => {
  // Remove leading slash if present
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Combine API_URL with path
  // Ensure no double slashes in the URL
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  return `${baseUrl}/${normalizedPath}`;
}; 