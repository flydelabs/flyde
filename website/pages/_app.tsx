import type { AppProps } from 'next/app'
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from '@next/third-parties/google'
import { PHProvider } from '../lib/providers'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-black text-white`}>
      <PHProvider>
        <Header />
        <main className="flex-1">
          <Component {...pageProps} />
        </main>
        <Footer />
      </PHProvider>
      <GoogleAnalytics gaId="G-RCVXXHJXZ6" />
    </div>
  );
}