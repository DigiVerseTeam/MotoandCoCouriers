import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicPageIntro, PublicSiteHeader } from "@/components/public-site-shell";
import { howItWorks, operatingCadence, workshopBenefits } from "@/lib/public-website";
import styles from "../website/website.module.css";

export const metadata: Metadata = {
  title: "For Workshops | Moto & Co Couriers",
  description:
    "Keep technicians on the tools with scheduled motorcycle parts delivery from participating suppliers across South East Queensland.",
  alternates: {
    canonical: "/workshops",
  },
};

export default function WorkshopsPage() {
  return (
    <main className={styles.site}>
      <PublicSiteHeader />
      <PublicPageIntro
        eyebrow="For workshops"
        title="Keep your technicians on the tools."
        lead="Moto & Co Couriers reduces unnecessary supplier runs by collecting motorcycle parts from participating suppliers and delivering them directly to your workshop through scheduled delivery days."
      />

      <section className={styles.whiteBand}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Built around your business</p>
            <h2>Less time on the road. More time servicing motorcycles.</h2>
          </div>
          <div className={styles.copyStack}>
            <p>
              Motorcycle workshops operate on tight schedules. Customers expect
              quick turnaround times, and technicians need the right parts at the
              right time.
            </p>
            <p>
              Scheduled deliveries let your workshop plan work with more confidence
              while reducing the time lost to supplier collections.
            </p>
            <ul className={styles.checkList}>
              {workshopBenefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>How it works</p>
            <h2>From supplier order to workshop delivery.</h2>
            <div className={styles.inlineActions}>
              <Link href="/portal">Register Your Workshop</Link>
              <Link href="/pricing">View rates</Link>
            </div>
          </div>
          <ol className={styles.journeyList}>
            {howItWorks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.whiteBand}>
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>Delivery rhythm</p>
            <h2>Predictable delivery days your team can plan around.</h2>
          </div>
          <div className={styles.cadenceGrid}>
            {operatingCadence.map((item) => (
              <div className={styles.cadenceItem} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.legalBand}>
        <div>
          <p className={styles.kicker}>Join the network</p>
          <h2>Open a workshop account.</h2>
        </div>
        <p>
          Register your workshop, select your participating suppliers, and start
          lodging deliveries once your account is active.
        </p>
        <Link href="/portal">Register Your Workshop</Link>
      </section>
      <PublicFooter />
    </main>
  );
}
