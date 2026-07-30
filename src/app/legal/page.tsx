import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicPageIntro, PublicSiteHeader } from "@/components/public-site-shell";
import { approvedLegalContent, legalDocs } from "@/lib/legal-docs";
import styles from "../website/website.module.css";

export const metadata: Metadata = {
  title: "Legal & Policies | Moto & Co Couriers",
  description: "Customer-facing legal, privacy, collection notice, delivery, billing, and data handling terms for Moto and Co Couriers.",
  alternates: {
    canonical: "/legal",
  },
};

export default function LegalPage() {
  const legalContent = approvedLegalContent();
  const approvedLegalSource = "motoandco-legal-pages.v2.html";
  const sourceContainsApprovedFooter = legalContent.includes("site-footer");

  return (
    <main className={styles.site}>
      <PublicSiteHeader />
      <PublicPageIntro
        eyebrow="Legal and policies"
        title="How we operate. In plain terms."
        lead="Everything that governs how Moto & Co Couriers works with you, your suppliers, and your freight. Choose a legal document below."
      />
      <section className={styles.whiteBand}>
        <div className={styles.entryGrid}>
          {legalDocs.map((doc) => (
            <Link className={styles.entryItem} href={`/legal/${doc.slug}`} key={doc.slug}>
              <span>{doc.label}</span>
              <p>{doc.description}</p>
            </Link>
          ))}
        </div>
        <div className={styles.inner}>
          <p className={styles.noteText}>
            Legal documents are rendered from approved source file {approvedLegalSource}
            {sourceContainsApprovedFooter ? " including the approved site-footer content." : "."}
          </p>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
