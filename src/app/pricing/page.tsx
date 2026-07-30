import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicPageIntro, PublicSiteHeader } from "@/components/public-site-shell";
import { additionalPricing, partsPricing, tyrePricing } from "@/lib/public-website";
import styles from "../website/website.module.css";

export const metadata: Metadata = {
  title: "Standard Network Rates | Moto & Co Couriers",
  description:
    "Transparent ex-GST Standard Network Rates for motorcycle tyres, parts, returns, and out-of-zone work across South East Queensland.",
  alternates: {
    canonical: "/pricing",
  },
};

function PriceTable({ title, rows }: { title: string; rows: Array<{ freight: string; price: string }> }) {
  return (
    <section className={styles.pricePanel}>
      <h2>{title}</h2>
      <div className={styles.priceRows}>
        {rows.map((row) => (
          <div className={styles.priceRow} key={`${title}-${row.freight}`}>
            <span>{row.freight}</span>
            <strong>{row.price}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PricingPage() {
  return (
    <main className={styles.site}>
      <PublicSiteHeader />
      <PublicPageIntro
        eyebrow="Standard Network Rates"
        title="Transparent pricing for a connected motorcycle logistics network."
        lead="Standard Network Rates are quoted ex GST and designed to make delivery costs clear before you book. No minimum order or volume commitment is required to maintain a workshop account."
      />
      <section className={styles.whiteBand}>
        <div className={styles.pricingGrid}>
          <PriceTable title="Tyres, per piece" rows={tyrePricing} />
          <PriceTable title="Parts, by weight" rows={partsPricing} />
          <PriceTable title="Additional charges" rows={additionalPricing} />
        </div>
        <div className={styles.inner}>
          <p className={styles.noteText}>
            Rates apply to standard milk-run collections. Urgent, out-of-cycle,
            oversized, or out-of-zone delivery may require confirmation or a separate quote.
          </p>
        </div>
      </section>
      <section className={styles.legalBand}>
        <div>
          <p className={styles.kicker}>Billing</p>
          <h2>Monthly PDF invoices.</h2>
        </div>
        <p>
          Invoices are generated as monthly PDFs and emailed separately by the
          Moto & Co Couriers team. Supplier partnerships or tailored delivery
          arrangements may be priced under separate written agreements.
        </p>
        <Link href="/portal">Register Your Workshop</Link>
      </section>
      <PublicFooter />
    </main>
  );
}
