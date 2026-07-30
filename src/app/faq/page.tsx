import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicPageIntro, PublicSiteHeader } from "@/components/public-site-shell";
import { faqItems, publicContact } from "@/lib/public-website";
import styles from "../website/website.module.css";

export const metadata: Metadata = {
  title: "FAQ | Moto & Co Couriers",
  description:
    "Answers about Moto & Co Couriers, scheduled motorcycle parts delivery, participating suppliers, portal access, pricing, and billing.",
  alternates: {
    canonical: "/faq",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <main className={styles.site}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PublicSiteHeader />
      <PublicPageIntro
        eyebrow="FAQ"
        title="Everything you need to know before joining the network."
        lead="Answers for workshops and suppliers considering Moto & Co Couriers for motorcycle last mile logistics across South East Queensland."
      />

      <section className={styles.whiteBand}>
        <div className={styles.inner}>
          <div className={styles.faqGrid}>
            {faqItems.map((item) => (
              <article className={styles.serviceItem} key={item.question}>
                <h2>{item.question}</h2>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.legalBand}>
        <div>
          <p className={styles.kicker}>Still have a question?</p>
          <h2>Contact the Moto & Co Couriers team.</h2>
        </div>
        <p>
          Email {publicContact.email} for general enquiries, account questions, or
          supplier partnership discussions.
        </p>
        <Link href="/contact">Contact us</Link>
      </section>
      <PublicFooter />
    </main>
  );
}
