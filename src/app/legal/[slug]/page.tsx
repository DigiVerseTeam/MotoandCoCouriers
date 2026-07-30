import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFooter, PublicPageIntro, PublicSiteHeader } from "@/components/public-site-shell";
import { legalDocBySlug, legalDocs, legalSectionHtml } from "@/lib/legal-docs";
import styles from "../../website/website.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return legalDocs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = legalDocBySlug(slug);
  if (!doc) return {};

  return {
    title: `${doc.title} | Moto & Co Couriers`,
    description: doc.description,
    alternates: {
      canonical: `/legal/${doc.slug}`,
    },
  };
}

export default async function LegalDocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = legalDocBySlug(slug);
  if (!doc) notFound();

  const html = legalSectionHtml(doc);

  return (
    <main className={styles.site}>
      <PublicSiteHeader />
      <PublicPageIntro
        eyebrow="Legal and policies"
        title={doc.title}
        lead={doc.description}
      />
      <section className={styles.legalContent}>
        <nav className="doc-nav" aria-label="Legal documents">
          {legalDocs.map((item) => (
            <Link className={item.slug === doc.slug ? "active" : undefined} href={`/legal/${item.slug}`} key={item.slug}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="legal-body">
          <aside className="sidebar">
            <h3>Legal centre</h3>
            <ul>
              <li><Link href="/legal">All legal documents</Link></li>
              {legalDocs.map((item) => (
                <li key={item.slug}>
                  <Link href={`/legal/${item.slug}`}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </aside>
          <div className="doc-panel" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
