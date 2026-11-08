import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { ChatWidget } from "@/components/assistant/chat-widget";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FarmLoop | Agricultural marketplace",
  description: "A marketplace connecting agricultural by-products with their next use.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-20 md:pb-0">
        {children}
        <Suspense fallback={null}>
          <MobileBottomNav />
        </Suspense>
        <ChatWidget />
      </body>
    </html>
  );
}
