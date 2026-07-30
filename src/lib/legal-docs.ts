import { readFileSync } from "node:fs";
import { join } from "node:path";

export type LegalDoc = {
  id: string;
  slug: string;
  label: string;
  title: string;
  description: string;
};

export const legalDocs: LegalDoc[] = [
  {
    id: "booking",
    slug: "booking-terms",
    label: "Booking Terms",
    title: "Booking Terms",
    description: "Terms for booking Moto & Co Couriers scheduled motorcycle parts deliveries.",
  },
  {
    id: "credit",
    slug: "credit-terms",
    label: "Credit Terms",
    title: "Credit Terms",
    description: "Payment, invoicing, GST, and account terms for Moto & Co Couriers customers.",
  },
  {
    id: "dangerous",
    slug: "dangerous-goods",
    label: "Dangerous Goods",
    title: "Dangerous Goods Policy",
    description: "Dangerous goods limits for Moto & Co Couriers motorcycle parts delivery services.",
  },
  {
    id: "delivery",
    slug: "delivery-disclaimer",
    label: "Delivery Disclaimer",
    title: "Delivery Disclaimer",
    description: "Delivery completion, proof of delivery, delay, damage, and liability terms.",
  },
  {
    id: "privacy",
    slug: "privacy-policy",
    label: "Privacy Policy",
    title: "Privacy Policy",
    description: "How Moto & Co Couriers collects, uses, stores, and protects personal information.",
  },
  {
    id: "collection",
    slug: "collection-notice",
    label: "Collection Notice",
    title: "Collection Notice",
    description: "Privacy collection notice for Moto & Co Couriers bookings and accounts.",
  },
  {
    id: "retention",
    slug: "data-retention",
    label: "Data Retention",
    title: "Data Retention & Destruction",
    description: "How long Moto & Co Couriers keeps booking, billing, POD, and account records.",
  },
  {
    id: "security",
    slug: "information-security",
    label: "Information Security",
    title: "Information Security",
    description: "Information security approach for Moto & Co Couriers systems and records.",
  },
];

export const legalHtmlPath = join(process.cwd(), "src", "content", "legal", "motoandco-legal-pages.v2.html");

export function approvedLegalContent() {
  return readFileSync(legalHtmlPath, "utf8");
}

function replaceLegalLinks(html: string) {
  return legalDocs.reduce((updated, doc) => {
    const hashLink = new RegExp(`href="#${doc.id}"`, "g");
    return updated.replace(hashLink, `href="/legal/${doc.slug}"`);
  }, html);
}

export function legalDocBySlug(slug: string) {
  return legalDocs.find((doc) => doc.slug === slug);
}

export function legalSectionHtml(doc: LegalDoc) {
  const html = approvedLegalContent();
  const match = html.match(new RegExp(`<section class="doc-section" id="${doc.id}">[\\s\\S]*?<\\/section>`, "i"));
  return replaceLegalLinks(match?.[0] || "");
}
