import type { MetadataRoute } from "next";
import { PURPLECALLIO_URL } from "./lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/login", "/signup", "/call", "/auth"] },
    sitemap: `${PURPLECALLIO_URL}/sitemap.xml`,
    host: PURPLECALLIO_URL,
  };
}
