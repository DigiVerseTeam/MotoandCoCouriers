"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-AU">
      <body>
        <main className="runtime-fallback">
          <section>
            <img src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" />
            <h1>Portal temporarily stopped</h1>
            <p>The live portal hit a browser error. Retry the page, then contact Admin if it happens again.</p>
            <button onClick={reset}>Retry</button>
          </section>
        </main>
      </body>
    </html>
  );
}
