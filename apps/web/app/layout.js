import "./globals.css";
import SiteHeader from "./components/layout/SiteHeader";
import SiteFooter from "./components/layout/SiteFooter";
import { siteUrl, defaultDescription } from "./lib/seo";

export const metadata = {
  metadataBase: siteUrl,
  title: { default: "Video Calling API & WebRTC SDK | PurpleCallio", template: "%s | PurpleCallio" },
  description: defaultDescription,
  applicationName: "PurpleCallio",
  authors: [{ name: "PurpleCallio" }],
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "PurpleCallio", locale: "en_US", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "PurpleCallio" }] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
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
