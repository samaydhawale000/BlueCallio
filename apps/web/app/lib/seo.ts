import type { Metadata } from "next";
import {
  PURPLECALLIO_DESCRIPTION,
  PURPLECALLIO_NAME,
  PURPLECALLIO_URL,
} from "./brand";

export const siteUrl = new URL(PURPLECALLIO_URL);
export const siteName = PURPLECALLIO_NAME;
export const defaultDescription = PURPLECALLIO_DESCRIPTION;

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
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "PurpleCallio" }],
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
