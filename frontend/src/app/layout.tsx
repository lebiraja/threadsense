import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" });

export const metadata: Metadata = {
  title: "ThreadSense: Discovering Which Reddit Communities You Belong In",
  description: "A MongoDB + MapReduce community recommender over 1,013,000 Reddit self-posts.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
