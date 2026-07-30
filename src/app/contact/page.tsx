import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicPageIntro, PublicSiteHeader } from "@/components/public-site-shell";
import { publicContact } from "@/lib/public-website";
import styles from "../website/website.module.css";

export const metadata: Metadata = {
  title: "Contact Moto & Co Couriers | SEQ Motorcycle Parts Courier",
  description:
    "Questions about motorcycle last mile logistics, workshop registration, Standard Network Rates, or supplier partnerships? Contact Moto & Co Couriers.",
  alternates: {
    canonical: "/contact",
  },
};

const contactDetails = [
  { label: "General enquiries", value: publicContact.email, href: `mailto:${publicContact.email}` },
  { label: "Privacy enquiries", value: publicContact.privacyEmail, href: `mailto:${publicContact.privacyEmail}` },
  { label: "Legal entity", value: `${publicContact.legalEntity} ABN ${publicContact.abn}` },
  { label: "Service area", value: publicContact.serviceArea },
];

export default function ContactPage() {
  return (
    <main className={styles.site}>
      <PublicSiteHeader />
      <PublicPageIntro
        eyebrow="Contact"
        title="Get in touch."
        lead="Got a question about the delivery network, Standard Network Rates, workshop registration, or supplier partnerships? Send us a note and we will get back to you."
      />
      <section className={styles.whiteBand}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Direct contact</p>
            <h2>Use email for public enquiries.</h2>
          </div>
          <div className={styles.contactPanel}>
            {contactDetails.map((item) => (
              <div className={styles.contactRow} key={item.label}>
                <span>{item.label}</span>
                {item.href ? <a href={item.href}>{item.value}</a> : <strong>{item.value}</strong>}
              </div>
            ))}
            <p className={styles.noteText}>
              Email is the current contact channel for website enquiries.
            </p>
          </div>
        </div>
      </section>
      <section className={styles.band}>
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>How we can help</p>
            <h2>Workshop accounts, supplier partnerships, and delivery questions.</h2>
          </div>
          <div className={styles.serviceListWide}>
            <article className={styles.serviceItem}>
              <h3>Workshop registration</h3>
              <p>Open an account and start lodging deliveries from participating motorcycle suppliers.</p>
            </article>
            <article className={styles.serviceItem}>
              <h3>Supplier partnerships</h3>
              <p>Discuss scheduled collections, warehouse fit, and last mile delivery support for your customers.</p>
            </article>
            <article className={styles.serviceItem}>
              <h3>Delivery support</h3>
              <p>Account holders can check delivery history and proof of delivery through the customer portal.</p>
            </article>
          </div>
        </div>
      </section>
      <section className={styles.legalBand}>
        <div>
          <p className={styles.kicker}>Customer portal</p>
          <h2>Already have an account?</h2>
        </div>
        <p>
          Log in to lodge deliveries, check status, view delivery history, and access
          proof of delivery records.
        </p>
        <Link href="/portal">Open customer portal</Link>
      </section>
      <PublicFooter />
    </main>
  );
}
