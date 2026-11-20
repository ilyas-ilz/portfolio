"use client";

import { Mail, Menu, Radio, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { navLinks, profile } from "@/lib/data";
import { onScroll } from "@/lib/scrollBus";
import { measureSections, sectionIndexAt } from "@/lib/sectionTrack";
import { getSoundEnabled, initSoundState, playClickSound, playHoverSound, setSoundEnabled } from "@/lib/sound";

function GithubIcon({ className = "icon" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path fill="currentColor" stroke="none" d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function LinkedinIcon({ className = "icon" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path fill="currentColor" stroke="none" d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.3c0-1.26-.02-2.9-1.8-2.9-1.8 0-2.07 1.38-2.07 2.8V21h-4z" />
    </svg>
  );
}

const spaceNavLinks = [
  { href: "#top", label: "Home" },
  { href: "#skills", label: "Skills" },
  { href: "#work", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const [active, setActive] = useState("#top");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    setSoundOn(initSoundState());

    // Active section comes from the same tracker the flight guide uses, so the
    // nav pill and the guide badge always switch at the same scroll offset.
    const ids = spaceNavLinks.map((link) => link.href.slice(1));
    let track = measureSections(ids);
    let y = window.scrollY;
    const update = () => {
      setScrolled(y > 20);
      if (track) setActive(`#${track.ids[sectionIndexAt(track, y)]}`);
    };
    const off = onScroll((next) => {
      y = next;
      update();
    });

    let queued = 0;
    const remeasure = () => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        track = measureSections(ids);
        y = window.scrollY;
        update();
      });
    };
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    window.addEventListener("resize", remeasure);
    window.addEventListener("load", remeasure);
    update();

    return () => {
      off();
      cancelAnimationFrame(queued);
      ro.disconnect();
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("load", remeasure);
    };
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Left Chrome Rail (Figma signature element - desktop only) */}
      <aside className="chrome-rail" aria-label="Orbital links">
        <ul>
          <li>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
            >
              <GithubIcon className="icon" />
            </a>
          </li>
          <li>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
            >
              <LinkedinIcon className="icon" />
            </a>
          </li>
          <li>
            <a
              href={`mailto:${profile.email}`}
              aria-label="Sub-space Email"
              title="Send Sub-space Transmission"
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
            >
              <Mail className="icon" />
            </a>
          </li>
        </ul>
        <span className="chrome-rail-line" aria-hidden="true" />
      </aside>

      {/* Floating Navigation Capsule */}
      <header className={`nav-wrapper ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container nav-inner">
          {/* Brand Logo */}
          <a
            href="#top"
            className="brand-logo"
            onClick={() => {
              playClickSound();
              setOpen(false);
            }}
            onMouseEnter={playHoverSound}
          >
            <span className="brand-dot" />
            <span className="brand-name font-display">{profile.shortName}</span>
            <span className="brand-badge font-mono">DEV</span>
          </a>

          {/* Center Navigation Links - Desktop Only */}
          <nav className="nav-links-desktop font-mono" aria-label="Primary Navigation">
            {spaceNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`nav-item ${active === link.href ? "is-active" : ""}`}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
              >
                <span>{link.label}</span>
                {active === link.href && <span className="nav-active-pill" />}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="nav-actions">
            {/* Hire Me CTA Button */}
            <a
              href="#contact"
              className="btn btn-nav-cta font-mono"
              onClick={playClickSound}
              onMouseEnter={playHoverSound}
            >
              <span className="cta-dot" aria-hidden="true" />
              <span>Hire Me</span>
            </a>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="nav-burger-btn"
              onClick={() => {
                playClickSound();
                setOpen((prev) => !prev);
              }}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open navigation menu"}
            >
              {open ? <X className="icon" /> : <Menu className="icon" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop & Drawer */}
      <div
        id="mobile-nav"
        className={`nav-drawer ${open ? "is-open" : ""}`}
        aria-hidden={!open}
      >
        <div className="container nav-drawer-inner">
          <nav className="nav-drawer-links font-mono" aria-label="Mobile Navigation">
            {spaceNavLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                className={`nav-drawer-item ${active === link.href ? "is-active" : ""}`}
                style={{ "--d": `${i * 45}ms` } as CSSProperties}
                onClick={() => {
                  playClickSound();
                  setOpen(false);
                }}
              >
                <span className="nav-drawer-label">{link.label}</span>
                <span className="nav-drawer-arrow">➔</span>
              </a>
            ))}
          </nav>

          <div className="nav-drawer-foot">
            <a
              href="#contact"
              className="btn btn-glow w-full font-mono"
              onClick={() => {
                playClickSound();
                setOpen(false);
              }}
            >
              <Sparkles className="icon" />
              <span>Initiate Transmission / Hire Me</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
