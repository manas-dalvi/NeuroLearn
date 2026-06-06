import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { AuthProvider } from "@/context/AuthContext";
import QueryProvider from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"], variable: "--inter" });

export const metadata: Metadata = {
  title: "NLAP — Neurodivergent Learning Accessibility Platform",
  description:
    "AI-powered adaptive learning platform designed for ADHD, dyslexia, and autism spectrum learners. Break down complex content into accessible, personalized chunks.",
  keywords: ["ADHD", "dyslexia", "adaptive learning", "neurodivergent", "accessibility", "AI education"],
  authors: [{ name: "NLAP Team" }],
  openGraph: {
    title: "NLAP — Learn Your Way",
    description: "AI-powered adaptive learning for every mind.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <AccessibilityProvider>
              {children}
            </AccessibilityProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
