"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type PublicAgeGateProps = {
  children?: ReactNode;
  initialVerified?: boolean;
};

const AGE_GATE_KEY = "milk-bubbles-age-verified";
const AGE_GATE_COOKIE = "milk-bubbles-age-verified";

function storeAgeVerification() {
  window.localStorage.setItem(AGE_GATE_KEY, "true");
  window.document.cookie = `${AGE_GATE_COOKIE}=true; Max-Age=31536000; Path=/; SameSite=Lax`;
}

export function PublicAgeGate({ children, initialVerified = false }: PublicAgeGateProps) {
  const [verified, setVerified] = useState(initialVerified);

  useEffect(() => {
    if (!initialVerified && window.localStorage.getItem(AGE_GATE_KEY) === "true") {
      storeAgeVerification();
      window.requestAnimationFrame(() => window.location.reload());
    }
  }, [initialVerified]);

  useEffect(() => {
    document.documentElement.classList.toggle("age-gate-locked", verified !== true);
    return () => document.documentElement.classList.remove("age-gate-locked");
  }, [verified]);

  function enter() {
    storeAgeVerification();

    if (children) {
      setVerified(true);
      return;
    }

    window.location.reload();
  }

  function decline() {
    window.location.replace("https://www.google.com/");
  }

  if (verified && children) return <>{children}</>;

  return (
    <main className="age-gate" aria-label="Age confirmation">
      <div className="ambient-grain" />
      <section className="age-gate__panel" aria-labelledby="age-gate-title">
        <NeonPolaroid className="age-gate__polaroid" />
        <div className="age-gate__copy">
          <h1 id="age-gate-title">19+</h1>
          <p>Adults Only</p>
          <p>By entering, you confirm that you are of legal age in your jurisdiction.</p>
          <div className="age-gate__actions">
            <button className="age-gate__enter" type="button" onClick={enter}>
              Enter
            </button>
            <button className="age-gate__decline" type="button" onClick={decline}>
              I am not of legal age
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export function NeonPolaroid({ className = "" }: { className?: string }) {
  return (
    <div className={`hero-polaroid neon-polaroid ${className}`} aria-hidden="true">
      <span className="tape tape--left" />
      <span className="tape tape--right" />
      <div className="hero-polaroid__glow">
        <span>Milk</span>
        <span>&amp;</span>
        <span>Bubbles</span>
        <span className="hero-polaroid__heart">♡</span>
      </div>
    </div>
  );
}
