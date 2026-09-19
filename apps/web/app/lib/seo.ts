import type { Metadata } from "next";

export const siteUrl = new URL("https://bluecallio.com");
export const siteName = "BlueCallio";
export const defaultDescription =
  "BlueCallio is a developer-focused real-time communication platform with video and audio calling, screen sharing, WebRTC APIs, React components, JavaScript SDKs, and hosted call UI.";

type PageMetadata = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
};

export function pageMetadata({ title, description, path, type = "website" }: PageMetadata): Metadata {
  const url = new URL(path, siteUrl).toString();
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url,
      siteName,
      title,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "BlueCallio" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export const noIndex: Metadata["robots"] = { index: false, follow: false, nocache: true };
