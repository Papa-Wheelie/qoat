import type { Metadata } from "next";
import type { Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Providers from "./providers";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import IOSInstallHint from "@/components/IOSInstallHint";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const description =
  "Upload your trade or supplier quote and get an instant AI assessment plus community insight from Australian homeowners.";

export const metadata: Metadata = {
  title: "QOAT — Know before you pay",
  description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QOAT",
  },
  openGraph: {
    title: "QOAT — Know before you pay",
    description,
    url: "https://getqoat.com",
    siteName: "QOAT",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Suspense fallback={<div className="h-14" />}>
            <Nav />
          </Suspense>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          <ServiceWorkerRegistration />
          <IOSInstallHint />
        </Providers>
      </body>
    </html>
  );
}
