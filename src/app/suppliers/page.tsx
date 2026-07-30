import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicPageIntro, PublicSiteHeader } from "@/components/public-site-shell";
import { supplierBenefits } from "@/lib/public-website";
import styles from "../website/website.module.css";

export const metadata: Metadata = {
  title: "For Suppliers | Moto & Co Couriers",
  description:
    "Extend your motorcycle delivery network without adding vehicles or daily route management. Partner with Moto & Co Couriers for specialist last mile logistics.",
  alternates: {
    canonical: "/suppliers",
  },
};

const supplierWorkflow = [
  "Your customer places an order through your existing sales process.",
  "Your warehouse prepares the consignment for collection.",
  "Moto & Co Couriers collects during the scheduled network run.",
  "The order is delivered directly to the workshop.",
  "Proof of delivery is captured for the completed delivery.",
];

export default function SuppliersPage() {
  return (
    <main className={styles.site}>
      <PublicSiteHeader />
      <PublicPageIntro
        eyebrow="For suppliers"
        title="Extend your delivery network. Not your fleet."
        lead="Moto & Co Couriers gives motorcycle suppliers a specialist last mile logistics partner, helping you support customers without adding vehicles, drivers, or daily route management."
      />

      <section className={styles.whiteBand}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Supplier partnerships</p>
            <h2>Professional last mile delivery for motorcycle customers.</h2>
          </div>
          <div className={styles.copyStack}>
            <p>
              The final journey from warehouse to workshop is a visible part of your
              customer experience. A reliable delivery partner helps you protect that
              experience while reducing the cost and complexity of running more
              delivery infrastructure yourself.
            </p>
            <ul className={styles.checkList}>
              {supplierBenefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>How supplier logistics works</p>
            <h2>Your ordering process stays yours.</h2>
            <div className={styles.inlineActions}>
              <Link href="/contact">Discuss a partnership</Link>
              <Link href="/pricing">View network rates</Link>
            </div>
          </div>
          <ol className={styles.journeyList}>
            {supplierWorkflow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.whiteBand}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Built to scale</p>
            <h2>A delivery network that can grow with your customer base.</h2>
          </div>
          <div className={styles.copyStack}>
            <p>
              Whether you are supporting a small group of workshops or building a
              broader customer network, Moto & Co Couriers provides a structured way
              to add last mile delivery capability without carrying the full burden
              of extra fleet resources.
            </p>
            <p>
              If your business supplies motorcycle workshops, we can discuss how the
              network could fit your warehouse operation and customer service model.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.legalBand}>
        <div>
          <p className={styles.kicker}>Partnership enquiry</p>
          <h2>A better delivery experience starts here.</h2>
        </div>
        <p>
          Tell us about your customer base, warehouse location, and delivery needs so
          we can discuss whether the network is the right fit.
        </p>
        <Link href="/contact">Discuss a Supplier Partnership</Link>
      </section>
      <PublicFooter />
    </main>
  );
}
