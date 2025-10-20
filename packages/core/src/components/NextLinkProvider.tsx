'use client';

import { RouterProvider } from 'react-aria-components';
import { useRouter } from 'next/navigation';

export function NextLinkProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <RouterProvider navigate={(href) => router.push(href)}>
      {children}
    </RouterProvider>
  );
}

