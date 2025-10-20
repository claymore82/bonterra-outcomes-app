import type { Metadata } from "next";
import "@bonterratech/stitch-extension/stitch-extension.css";
import "../../styles/stylex.css";
import "./globals.css";
import { NextLinkProvider } from "../components/NextLinkProvider";

export const metadata: Metadata = {
  title: "bonstart-template",
  description: "Full stack starter template for Bonterra projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NextLinkProvider>{children}</NextLinkProvider>
      </body>
    </html>
  );
}
