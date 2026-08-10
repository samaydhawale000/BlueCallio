import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/layout/SiteHeader";
import SiteFooter from "./components/layout/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BlueJoinet — Video Communication Infrastructure",
  description:
    "REST APIs, WebSocket signaling, and a hosted call UI for any software product. No frontend SDK required.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
<body className="min-h-screen bg-[#050816] text-white overflow-x-hidden">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}