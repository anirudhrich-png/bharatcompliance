import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "BharatCompliance — GST Made Simple",
    template: "%s | BharatCompliance",
  },
  description:
    "AI-powered GST compliance for Indian MSMEs. Upload invoices, reconcile GSTR-2B, and never miss a deadline. Works in Hindi, Tamil, Telugu, and 8+ Indian languages.",
  keywords: ["GST", "GSTR", "invoice", "compliance", "India", "MSME", "tax"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
