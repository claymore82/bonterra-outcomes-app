declare module '@chakra-ui/react' {
  // Force all Chakra components to return JSX.Element
  export interface ChakraComponent {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any): JSX.Element;
    Root?: ChakraComponent;
    Indicator?: ChakraComponent;
    Content?: ChakraComponent;
    Title?: ChakraComponent;
    Description?: ChakraComponent;
    // Table components
    Header?: ChakraComponent;
    Body?: ChakraComponent;
    Footer?: ChakraComponent;
    Row?: ChakraComponent;
    Cell?: ChakraComponent;
    ColumnHeader?: ChakraComponent;
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
  
  // Add other components
  export const Badge: ChakraComponent;
  export const Spinner: ChakraComponent;
  export const Alert: ChakraComponent;
  // AlertIcon, AlertTitle, and AlertDescription are now under Alert.*
} 