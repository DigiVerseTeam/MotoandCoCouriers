import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";
import styles from "./website.module.css";

const servicePoints = [
  "Brisbane supplier pickups",
  "Gold Coast workshop delivery",
  "Receiver name and signature POD",
  "Account billing with job-level itemisation"
];

const operatingCadence = [
  { label: "Order Monday", value: "Delivered Tuesday" },
  { label: "Order Wednesday", value: "Delivered Thursday" },
  { label: "Booking cut-off", value: "12:30pm Brisbane time" }
];

export default function WebsitePage() {
  return (
    <main className={styles.site}>
      <section className={styles.hero}>
        <div className={styles.heroPhoto} aria-label="Black-and-white website photo placeholder">
          <span>Black-and-white photo placeholder</span>
        </div>
        <header className={styles.nav}>
          <Link href="/website" className={styles.logoLink} aria-label={brand.name}>
            <Image src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" width={174} height={132} priority />
          </Link>
          <nav className={styles.navLinks} aria-label="Website">
            <Link href="/booking">Booking</Link>
            <Link href="/tracking">Tracking</Link>
            <Link href="/legal">Legal</Link>
            <Link href="/">App</Link>
          </nav>
        </header>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{brand.geography}</p>
          <h1>{brand.name}</h1>
          <p>{brand.tagline}</p>
          <div className={styles.actions}>
            <Link href="/booking">Book a pickup</Link>
            <Link href="/tracking">Track a delivery</Link>
          </div>
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Workshop support courier</p>
            <h2>Parts movement for motorcycle workshops.</h2>
          </div>
          <div className={styles.copyStack}>
            <p>
              Moto and Co Couriers supports workshops that need supplier pickups handled with
              parts context, delivery proof, and billing records that can be traced back to the job.
            </p>
            <ul className={styles.checkList}>
              {servicePoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.whiteBand}>
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>Operating cadence</p>
            <h2>Built around the current milk-run rhythm.</h2>
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

      <section className={styles.proofBand}>
        <div className={styles.placeholderPair}>
          <div className={styles.placeholder}>
            <span>Supplier pickup photo placeholder</span>
          </div>
          <div className={styles.placeholder}>
            <span>Workshop delivery photo placeholder</span>
          </div>
        </div>
        <div className={styles.proofCopy}>
          <p className={styles.kicker}>Proof discipline</p>
          <h2>Delivered means receiver name plus signature.</h2>
          <p>
            The local app requires receiver name and signature before a delivery can be marked
            Delivered. GPS is not required for release one.
          </p>
          <Link href="/">Open the logistics app</Link>
        </div>
      </section>

      <section className={styles.legalBand}>
        <div>
          <p className={styles.kicker}>Release state</p>
          <h2>Legal and public proof copy remain controlled.</h2>
        </div>
        <p>
          Booking terms, credit terms, dangerous goods policy, delivery disclaimer, privacy policy,
          case assets, and origin story copy are not published until approved source copy exists.
        </p>
        <Link href="/legal">View legal library status</Link>
      </section>
    </main>
  );
}
