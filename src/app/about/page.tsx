import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicPageIntro, PublicSiteHeader } from "@/components/public-site-shell";
import { brandPillars } from "@/lib/public-website";
import styles from "../website/website.module.css";

export const metadata: Metadata = {
  title: "About Moto & Co Couriers | Motorcycle Supply Chain",
  description:
    "Moto & Co Couriers is building a specialist motorcycle last mile logistics network connecting suppliers and workshops across South East Queensland.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className={styles.site}>
      <PublicSiteHeader />
      <PublicPageIntro
        eyebrow="About Moto & Co Couriers"
        title="The Motorcycle Supply Chain. Simplified."
        lead="Moto & Co Couriers was created because the motorcycle industry deserves a logistics network built specifically for the way suppliers and workshops operate."
      />

      <section className={styles.whiteBand}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Purpose</p>
            <h2>Connecting suppliers and workshops through specialist logistics.</h2>
          </div>
          <div className={styles.copyStack}>
            <p>
              Workshops lose valuable time collecting parts. Suppliers face growing
              pressure to provide reliable deliveries without adding unnecessary
              fleet complexity. General courier services were not designed around
              those industry-specific needs.
            </p>
            <p>
              Moto & Co Couriers exists to simplify that connection with scheduled
              delivery services, transparent Standard Network Rates, and practical
              technology that supports the movement of motorcycle parts.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Brand pillars</p>
            <h2>Professional, practical, and industry-focused.</h2>
          </div>
          <div className={styles.serviceList}>
            {brandPillars.map((item) => (
              <article className={styles.serviceItem} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.whiteBand}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Part of Moto & Co Pty Ltd</p>
            <h2>One business focused on practical motorcycle industry support.</h2>
          </div>
          <div className={styles.copyStack}>
            <p>
              Moto & Co Couriers is a business of Moto & Co Pty Ltd, focused on
              building practical services that strengthen the Australian motorcycle
              industry.
            </p>
            <p>
              The courier network is the logistics business within that vision:
              helping suppliers, workshops, and riders benefit from a more connected
              motorcycle supply chain.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.legalBand}>
        <div>
          <p className={styles.kicker}>Join the network</p>
          <h2>Workshop or supplier?</h2>
        </div>
        <p>
          Whether you want to simplify parts deliveries or discuss last mile logistics
          for your customers, Moto & Co Couriers is ready to help.
        </p>
        <Link href="/contact">Get in touch</Link>
      </section>
      <PublicFooter />
    </main>
  );
}
