import type { Metadata } from "next";
import type { Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Providers from "./providers";
import Nav from "@/components/Nav";

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
  openGraph: {
    title: "QOAT — Know before you pay",
    description,
    url: "https://getqoat.com",
    siteName: "QOAT",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F9F9F7",
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
