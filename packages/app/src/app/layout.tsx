import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'bonstart-template',
  description: "⚠️ Run 'npm run bonstart:init' to configure this project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
