import type { MetadataRoute } from "next";
import { legalDocs } from "@/lib/legal-docs";
import { siteUrl } from "@/lib/public-website";

const publicRoutes = [
  "",
  "/workshops",
  "/suppliers",
  "/services",
  "/pricing",
  "/about",
  "/faq",
  "/contact",
  "/legal",
  ...legalDocs.map((doc) => `/legal/${doc.slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
