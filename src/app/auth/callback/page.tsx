"use client";

import { useEffect, useState } from "react";
import { completeLiveAuthRedirect, readStoredLiveAuthReturnPath } from "@/lib/live-runtime";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function finishSignIn() {
      try {
        const next = await completeLiveAuthRedirect();
        if (cancelled) return;
        window.location.replace(next || readStoredLiveAuthReturnPath("/") || "/");
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Login could not be completed.");
      }
    }

    finishSignIn();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: "24px",
      fontFamily: "Inter, Arial, sans-serif",
      background: "#fff",
      color: "#000",
    }}>
      <section style={{ width: "100%", maxWidth: 420, border: "1px solid #b9b9c3", borderRadius: 8, padding: 28, textAlign: "center" }}>
        <img src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" style={{ width: 132, height: "auto", margin: "0 auto 18px", display: "block" }} />
        <p style={{ fontSize: 12, letterSpacing: ".05em", textTransform: "uppercase", color: "rgba(0,0,0,.62)", marginBottom: 16 }}>Secure login</p>
        {error ? (
          <>
            <p style={{ color: "#e11d48", fontSize: 14, marginBottom: 16 }}>{error}</p>
            <a href="/login" style={{ color: "#e11d48", fontWeight: 800 }}>Request a new login link</a>
          </>
        ) : (
          <p style={{ fontSize: 14, color: "rgba(0,0,0,.62)" }}>Completing your sign in...</p>
        )}
      </section>
    </main>
  );
}
