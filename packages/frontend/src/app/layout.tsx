import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bonstart - Bonterra Platform Starter Application",
  description: "A starter application for building within the Bonterra Platform, demonstrating AWS native serverless web building",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return React.createElement(
    'html',
    { lang: "en", suppressHydrationWarning: true },
    React.createElement(
      'body',
      { className: `${geistSans.variable} ${geistMono.variable}` },
      React.createElement(
        Providers,
        null,
        children
      )
    )
  );
}
