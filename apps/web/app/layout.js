import "./globals.css";
import SiteHeader from "./components/layout/SiteHeader";
import SiteFooter from "./components/layout/SiteFooter";

export const metadata = {
  title: "BlueCallio — Video Communication Infrastructure",
  description:
    "REST APIs, WebSocket signaling, and a hosted call UI for any software product. No frontend SDK required.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased scroll-smooth"
    >
      <body className="min-h-screen bg-[#050816] text-white overflow-x-hidden">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}