import type { MetadataRoute } from "next";

const publicPaths = ["", "/features/video-calling", "/features/audio-calling", "/features/screen-sharing", "/features/webrtc", "/developers", "/docs", "/docs/quickstart", "/docs/authentication", "/docs/javascript", "/docs/react", "/docs/rest-api", "/docs/calls", "/docs/screen-sharing", "/docs/hosted-ui", "/docs/webhooks", "/docs/usage-billing", "/pricing", "/faq", "/privacy", "/terms", "/refund", "/billing-terms", "/acceptable-use"];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({ url: `https://bluecallio.com${path}`, changeFrequency: path.startsWith("/docs") ? "monthly" : "weekly", priority: path === "" ? 1 : 0.7 }));
}
