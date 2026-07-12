import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — NLAP",
  description: "Your personalized learning hub",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
