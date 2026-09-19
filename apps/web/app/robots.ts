import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/login", "/signup", "/call", "/auth"] },
    sitemap: "https://bluecallio.com/sitemap.xml",
    host: "https://bluecallio.com",
  };
}
