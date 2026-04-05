import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { ModelProvider } from "@/components/model-context";
import { AssumptionsPanel } from "@/components/assumptions-panel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina Financial Dashboard",
  description: "Lumina AG — Financial Model, Monte Carlo, Scenarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex">
        <ModelProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto p-6 ml-60">
            {children}
          </main>
          <AssumptionsPanel />
        </ModelProvider>
      </body>
    </html>
  );
}
