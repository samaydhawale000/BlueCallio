import "./globals.css";
import SiteHeader from "./components/layout/SiteHeader";
import SiteFooter from "./components/layout/SiteFooter";
import { siteUrl, defaultDescription } from "./lib/seo";

// The shared shell reads persisted authentication state in client components.
// Render routes on request so static export never evaluates that browser-only state.
export const dynamic = "force-dynamic";

export const metadata = {
  metadataBase: siteUrl,
  title: { default: "BlueCallio | Video Calling API & WebRTC SDK", template: "%s | BlueCallio" },
  description: defaultDescription,
  applicationName: "BlueCallio",
  authors: [{ name: "BlueCallio" }],
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "BlueCallio", locale: "en_US", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "BlueCallio" }] },
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
