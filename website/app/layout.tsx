import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from '@next/third-parties/google'
import { PHProvider } from './providers'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visual AI Flows | In Your Codebase",
  description: "The missing link between developers and non-developers working on AI workflows",
  icons: {
    icon: [
      { url: '/favicon.png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/favicon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-black`}
      >
        <PHProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </PHProvider>
      </body>
      <GoogleAnalytics gaId="G-RCVXXHJXZ6" />
    </html>
  );
}
