"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="runtime-fallback">
      <section>
        <img src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" />
        <h1>Portal temporarily stopped</h1>
        <p>
          The live portal hit a browser error. Retry the page, then contact Admin if it happens again.
        </p>
        <button onClick={reset}>Retry</button>
        {error?.digest && <small>Reference {error.digest}</small>}
      </section>
    </main>
  );
}
