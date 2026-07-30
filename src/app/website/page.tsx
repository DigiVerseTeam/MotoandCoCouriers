import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicFooter } from "@/components/public-site-shell";
import { brand } from "@/lib/brand";
import {
  activeSuppliers,
  brandPillars,
  faqItems,
  gettingStarted,
  howItWorks,
  operatingCadence,
  portalEntryPoints,
  publicContact,
  publicNav,
  serviceCards,
  siteUrl,
  workshopReasons,
} from "@/lib/public-website";
import styles from "./website.module.css";

export const metadata: Metadata = {
  title: "Moto & Co Couriers | Motorcycle Last Mile Logistics",
  description:
    "Moto & Co Couriers connects motorcycle suppliers and workshops through scheduled last mile logistics across South East Queensland.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: false,
    follow: true,
  },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#localbusiness`,
  name: brand.name,
  legalName: publicContact.legalEntity,
  image: `${siteUrl}/moto-and-co-couriers-logo.png`,
  email: publicContact.email,
  areaServed: ["Brisbane", "Gold Coast", "South East Queensland"],
  address: {
    "@type": "PostalAddress",
    addressRegion: "QLD",
    addressCountry: "AU",
  },
  url: siteUrl,
};

export default function WebsitePage() {
  return (
    <main className={styles.site}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <section className={styles.hero}>
        <div className={styles.heroPhoto} aria-hidden="true">
          <Image
            src="/moto-and-co-hero-van.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
        </div>
        <header className={styles.nav}>
          <Link href="/" className={styles.logoLink} aria-label={brand.name}>
            <Image src="/moto-and-co-couriers-logo.png" alt="Moto & Co Couriers" width={174} height={132} priority />
          </Link>
          <nav className={styles.navLinks} aria-label="Website">
            {publicNav.map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </nav>
        </header>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Motorcycle last mile logistics</p>
          <h1 className={styles.visuallyHidden}>Moto & Co Couriers</h1>
          <div className={styles.heroLogoTitle} aria-hidden="true">
            <Image
              src="/moto-and-co-couriers-hero-logo.png"
              alt=""
              width={900}
              height={392}
              priority
              sizes="(max-width: 768px) 88vw, 720px"
            />
          </div>
          <h2 className={styles.heroSubTitle}>{brand.tagline}</h2>
          <p>
            We connect motorcycle suppliers and workshops through scheduled delivery
            runs, transparent Standard Network Rates, and a customer portal built
            for the way the motorcycle industry moves parts.
          </p>
          <div className={styles.actions}>
            <Link href="/portal">Register Your Workshop</Link>
            <Link href="/suppliers">Partner With Us</Link>
          </div>
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Built for the motorcycle industry</p>
            <h2>Motorcycle businesses deserve more than general freight.</h2>
          </div>
          <div className={styles.serviceList}>
            {workshopReasons.map((item) => (
              <article className={styles.serviceItem} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.whiteBand}>
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>One network. Two solutions.</p>
            <h2>For workshops and suppliers.</h2>
          </div>
          <div className={styles.serviceListWide}>
            <article className={styles.serviceItem}>
              <h3>For workshops</h3>
              <p>
                Reduce supplier runs, keep technicians productive, and receive
                motorcycle parts through scheduled delivery days your team can plan
                around.
              </p>
              <div className={styles.itemAction}>
                <Link href="/workshops">Discover workshop services</Link>
              </div>
            </article>
            <article className={styles.serviceItem}>
              <h3>For suppliers</h3>
              <p>
                Extend your delivery network without adding vehicles, drivers, or
                daily route management to your warehouse operation.
              </p>
              <div className={styles.itemAction}>
                <Link href="/suppliers">Explore supplier partnerships</Link>
              </div>
            </article>
            <article className={styles.serviceItem}>
              <h3>For the industry</h3>
              <p>
                A connected delivery network helps suppliers, workshops, and riders
                benefit from a simpler motorcycle supply chain.
              </p>
              <div className={styles.itemAction}>
                <Link href="/about">Learn about the network</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.whiteBand}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>What is a milk run?</p>
            <h2>Shared supplier pickups, delivered in one workshop drop.</h2>
          </div>
          <div className={styles.copyStack}>
            <p>
              A milk run is a set collection route. Instead of separate courier trips
              for every single order, we consolidate participating supplier pickups on
              fixed run days and deliver everything to your workshop.
            </p>
            <ul className={styles.checkList}>
              <li>Lower cost per delivery because the run is shared.</li>
              <li>Predictable delivery windows your workshop can plan around.</li>
              <li>Fewer missed parts because collection follows a fixed cadence.</li>
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

      <section className={styles.whiteBand}>
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>Set days. Set route. Set expectations.</p>
            <h2>Order before each supplier warehouse cut-off for the next standard run.</h2>
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

      <section id="how-it-works" className={styles.band}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>How it works</p>
            <h2>From supplier con note to workshop delivery.</h2>
            <div className={styles.inlineActions}>
              <Link href="/portal">Register Your Workshop</Link>
              <Link href="/pricing">View pricing</Link>
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
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Getting started</p>
            <h2>Register once, then run your freight through the portal.</h2>
          </div>
          <ol className={styles.journeyList}>
            {gettingStarted.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.whiteBand} aria-label="SEQ motorcycle logistics portal entry points">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>SEQ motorcycle logistics</p>
            <h2>Customer portal and Courier business login.</h2>
          </div>
          <div className={styles.entryGrid}>
            {portalEntryPoints.map((entry) => (
              <Link className={styles.entryItem} href={entry.href} key={entry.href}>
                <span>{entry.label}</span>
                <p>{entry.summary}</p>
              </Link>
            ))}
            <Link className={styles.entryItem} href="/legal">
              <span>Legal centre</span>
              <p>Booking terms, credit terms, dangerous goods policy, delivery disclaimer, privacy policy.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Services</p>
            <h2>Specialist logistics for motorcycle parts.</h2>
            <div className={styles.inlineActions}>
              <Link href="/workshops">For workshops</Link>
              <Link href="/contact">Get in touch</Link>
            </div>
          </div>
          <div className={styles.serviceList}>
            {serviceCards.map((item) => (
              <article className={styles.serviceItem} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.proofBand}>
        <div className={styles.placeholderPair}>
          <div className={styles.placeholder} aria-hidden="true" />
          <div className={styles.placeholder} aria-hidden="true" />
        </div>
        <div className={styles.proofCopy}>
          <p className={styles.kicker}>Digital delivery management</p>
          <h2>Book, monitor, and access proof of delivery.</h2>
          <p>
            The customer portal keeps delivery records in one place. Completed
            deliveries include Receiver name and signature so workshops can see what
            arrived and when.
          </p>
          <Link href="/portal">Open the customer portal</Link>
        </div>
      </section>

      <section className={styles.whiteBand}>
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>Workshop questions</p>
            <h2>Plain answers before you register.</h2>
          </div>
          <div className={styles.faqGrid}>
            {faqItems.map((item) => (
              <article className={styles.serviceItem} key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.innerGrid}>
          <div>
            <p className={styles.kicker}>Why Moto & Co Couriers?</p>
            <h2>A practical network with a clear industry focus.</h2>
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

      <section className={styles.legalBand}>
        <div>
          <p className={styles.kicker}>Standard Network Rates</p>
          <h2>Transparent rates, billed monthly.</h2>
        </div>
        <p>
          Rates are quoted ex GST and published before you book. No minimum order or
          volume commitment is required to maintain a workshop account.
        </p>
        <Link href="/pricing">View Standard Network Rates</Link>
      </section>
      <PublicFooter />
    </main>
  );
}
