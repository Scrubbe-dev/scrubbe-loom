// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth-context";
import { SocketProvider } from "@/lib/socket-context";
import { PresentationMode } from "@/components/presentation-mode";
import Navbar from "@/components/loom/Navbar";
import Footer from "@/components/loom/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SOAR Platform",
  description: "Security Orchestration, Automation and Response",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SocketProvider>
          <Navbar />
            {children}
            <Footer />
            <Toaster />
            <PresentationMode />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}