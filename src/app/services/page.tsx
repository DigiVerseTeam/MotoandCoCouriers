import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicPageIntro, PublicSiteHeader } from "@/components/public-site-shell";
import { activeSuppliers, serviceCards, serviceFit } from "@/lib/public-website";
import styles from "../website/website.module.css";

export const metadata: Metadata = {
  title: "Motorcycle Delivery Services | Moto & Co Couriers",
  description:
    "Scheduled milk runs and last mile logistics for motorcycle suppliers and workshops across South East Queensland.",
  alternates: {
    canonical: "/services",
  },
};

const serviceWorkflow = [
  {
    title: "Supplier collection",
    copy: "Workshop deliveries are lodged through the portal against participating suppliers and scheduled run dates.",
  },
  {
    title: "Consignment check",
    copy: "Tyres, parts, returns, and heavier consignments are checked at collection before they move through the network.",
  },
  {
    title: "Workshop delivery",
    copy: "Delivery is completed with receiver name and signature proof available through the customer portal.",
  },
];

export default function ServicesPage() {
  return (
    <main className={styles.site}>
      <PublicSiteHeader />
      <PublicPageIntro
        eyebrow="Services"
        title="Motorcycle delivery services built around the supply chain."
        lead="Whether it is scheduled supplier collection or last mile delivery, Moto & Co Couriers keeps motorcycle parts moving across South East Queensland."
      />
      <section className={styles.band}>
        <div className={styles.serviceListWide}>
          {serviceCards.map((item) => (
            <article className={styles.serviceItem} key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.whiteBand}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>The milk run</p>
            <h2>Recurring supplier pickups for Gold Coast workshops.</h2>
          </div>
          <div className={styles.copyStack}>
            <p>
              Our core service is a structured Tuesday and Thursday route across the
              current Brisbane supplier network, consolidated and delivered to your
              workshop on the standard run day.
            </p>
            <ul className={styles.checkList}>
              {serviceFit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className={styles.inner}>
          <div className={styles.supplierGrid} aria-label="Active supplier network">
            {activeSuppliers.map((supplier) => (
              <div className={styles.supplierItem} key={supplier}>
                <span>Participating supplier</span>
                <strong>{supplier}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className={styles.band}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Workflow</p>
            <h2>Structured movement from warehouse to workshop.</h2>
          </div>
          <div className={styles.serviceList}>
            {serviceWorkflow.map((item) => (
              <article className={styles.serviceItem} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className={styles.legalBand}>
        <div>
          <p className={styles.kicker}>Not sure which service fits?</p>
          <h2>Regular supplier orders usually belong on the scheduled run.</h2>
        </div>
        <p>
          For one-off, out-of-cycle, oversized, or out-of-zone work, contact us first
          so the job can be checked before collection.
        </p>
        <Link href="/contact">Get in touch</Link>
      </section>
      <PublicFooter />
    </main>
  );
}
