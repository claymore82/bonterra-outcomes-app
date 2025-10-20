import type { Metadata } from "next";
import "@bonterratech/stitch-extension/stitch-extension.css";
import "../../styles/stylex.css";
import "./globals.css";
import { NextLinkProvider } from "../components/NextLinkProvider";

export const metadata: Metadata = {
  title: "bonstart-template",
  description: "⚠️ Run 'npm run bonstart:init' to configure this project",
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
