"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navLinks, profile } from "@/lib/data";
import { onScroll } from "@/lib/scrollBus";
import { playClickSound, playHoverSound } from "@/lib/sound";
import Clock from "./Clock";

function scrollToTop() {
  playClickSound();
  if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.4 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Floating back-to-top: appears after the hero, ring fills with page progress. */
function BackToTop() {
  const ref = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let max = 1;
    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    const update = (y: number) => {
      ref.current?.style.setProperty("--p", (max > 0 ? y / max : 0).toFixed(3));
      setShown(y > window.innerHeight * 0.9);
    };
    update(window.scrollY);
    const off = onScroll(update);
    return () => {
      off();
      ro.disconnect();
    };
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      className={`to-top ${shown ? "is-shown" : ""}`}
      onClick={scrollToTop}
      onMouseEnter={playHoverSound}
      aria-label="Back to top"
      tabIndex={shown ? 0 : -1}
    >
      <ArrowUp className="to-top-icon" aria-hidden="true" />
    </button>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="footer site-footer">
        <div className="container site-footer-inner">
          <div className="site-footer-top">
            <div className="site-footer-brand">
              <a href="#top" className="site-footer-name" onClick={playClickSound}>
                <span className="brand-dot" aria-hidden="true" />
                {profile.shortName}
              </a>
              <p className="site-footer-status font-mono">
                <span className="footer-status-beacon" aria-hidden="true" />
                All systems operational
              </p>
            </div>

            <nav className="site-footer-links" aria-label="Footer navigation">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onMouseEnter={playHoverSound} onClick={playClickSound}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="site-footer-bottom font-mono">
            <span>
              © {year} {profile.name} · Built with Next.js, Three.js &amp; anime.js
            </span>
            <span>
              {profile.location} · <Clock />
            </span>
          </div>
        </div>
      </footer>
      <BackToTop />
    </>
  );
}
