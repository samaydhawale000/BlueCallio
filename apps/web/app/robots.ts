import type { MetadataRoute } from "next";
import { BLUECALLIO_URL } from "./lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/login", "/signup", "/call", "/auth"] },
    sitemap: `${BLUECALLIO_URL}/sitemap.xml`,
    host: BLUECALLIO_URL,
  };
}
