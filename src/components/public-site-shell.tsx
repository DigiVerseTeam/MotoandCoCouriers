import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { footerStatement, publicContact, publicNav } from "@/lib/public-website";
import styles from "@/app/website/website.module.css";

export function PublicSiteHeader() {
  return (
    <header className={styles.simpleHeader}>
      <Link href="/" className={styles.logoLink} aria-label={brand.name}>
        <Image src="/moto-and-co-couriers-logo.png" alt="Moto & Co Couriers" width={174} height={132} priority />
      </Link>
      <nav className={styles.simpleNav} aria-label="Website">
        {publicNav.map((item) => (
          <Link href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div>
        <strong>{brand.name}</strong>
        <span>{publicContact.legalEntity} - ABN {publicContact.abn}</span>
        <span>{footerStatement}</span>
        <span>{publicContact.email}</span>
      </div>
      <div className={styles.footerLinks}>
        <Link href="/portal">Customer portal</Link>
        <Link href="/workshops">Workshops</Link>
        <Link href="/suppliers">Suppliers</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/legal">Legal</Link>
      </div>
    </footer>
  );
}

export function PublicPageIntro({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return (
    <section className={styles.pageIntro}>
      <p className={styles.kicker}>{eyebrow}</p>
      <h1>{title}</h1>
      <p>{lead}</p>
    </section>
  );
}
