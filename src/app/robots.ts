import type { MetadataRoute } from "next";
import { legalDocs } from "@/lib/legal-docs";
import { siteUrl } from "@/lib/public-website";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/workshops",
        "/suppliers",
        "/services",
        "/pricing",
        "/about",
        "/faq",
        "/contact",
        "/legal",
        ...legalDocs.map((doc) => `/legal/${doc.slug}`),
      ],
      disallow: [
        "/admin",
        "/api",
        "/auth",
        "/booking",
        "/driver",
        "/journey",
        "/login",
        "/portal",
        "/tracking",
        "/accountability",
        "/website",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
