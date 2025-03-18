declare module '@chakra-ui/react' {
  // Force all Chakra components to return JSX.Element
  export interface ChakraComponent {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any): JSX.Element;
  }
  
  // Add missing exports from Chakra UI v3
  export const ChakraProvider: ChakraComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createSystem(config?: any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const defaultConfig: any;
  
  // Override return types for specific components
  export const Box: ChakraComponent;
  export const Container: ChakraComponent;
  export const Heading: ChakraComponent;
  export const Text: ChakraComponent;
  export const Button: ChakraComponent;
  export const Stack: ChakraComponent;
  export const Flex: ChakraComponent;
  
  // Add table components
  export const Table: ChakraComponent;
  export const Thead: ChakraComponent;
  export const Tbody: ChakraComponent;
  export const Tr: ChakraComponent;
  export const Th: ChakraComponent;
  export const Td: ChakraComponent;
  
  // Add other components
  export const Badge: ChakraComponent;
  export const Spinner: ChakraComponent;
  export const Alert: ChakraComponent;
  export const AlertIcon: ChakraComponent;
  export const AlertTitle: ChakraComponent;
  export const AlertDescription: ChakraComponent;
} 