import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bonstart",
  description:
    "Built with Bonstart - SST v3 + Next.js template for Bonterra projects",
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
