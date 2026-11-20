"use client";

import { animate } from "animejs";
import { ArrowRight, Download, Globe2, Mail, Radio, Sparkles, Terminal } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { marquee, profile, stats } from "@/lib/data";
import { playClickSound, playHoverSound } from "@/lib/sound";
import Clock from "./Clock";
import CodeWindow from "./CodeWindow";
import HoloDossier from "./HoloDossier";
import RotatingWord from "./RotatingWord";
import SpaceHorizons from "./SpaceHorizons";

const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => (
    <div className="orb-skeleton" aria-label="Loading 3D view">
      <span className="skel-shimmer" />
    </div>
  ),
});

type StageTab = "vector" | "3d" | "code";

const TABS: Array<{ id: StageTab; label: string; short: string; Icon: typeof Globe2 }> = [
  { id: "vector", label: "Vector Planetarium", short: "Vector", Icon: Globe2 },
  { id: "3d", label: "3D Celestial Core", short: "3D Core", Icon: Sparkles },
  { id: "code", label: "Flight Terminal", short: "Terminal", Icon: Terminal },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -72 });
  else el.scrollIntoView({ behavior: "smooth" });
}

function at(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

export default function Hero() {
  const [activeTab, setActiveTab] = useState<StageTab>("vector");
  const [dossierOpen, setDossierOpen] = useState(false);
  const shockwaveRef = useRef<HTMLDivElement>(null);
  const tabGroupRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // Sliding pill indicator that glides between the active tab buttons
  useLayoutEffect(() => {
    const group = tabGroupRef.current;
    const ind = indicatorRef.current;
    if (!group || !ind) return;
    const place = () => {
      const btn = group.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
      if (!btn) return;
      ind.style.width = `${btn.offsetWidth}px`;
      ind.style.transform = `translate3d(${btn.offsetLeft}px, 0, 0)`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(group);
    return () => ro.disconnect();
  }, [activeTab]);

  const selectTab = (tab: StageTab) => {
    if (tab === activeTab) return;
    playClickSound();
    setDossierOpen(false);
    setActiveTab(tab);
  };

  const closeDossier = useCallback(() => setDossierOpen(false), []);

  const exploreWork = useCallback(() => {
    playClickSound();
    setDossierOpen(false);
    scrollToId("work");
  }, []);

  const handlePlanetClick = () => {
    playClickSound();
    if (shockwaveRef.current) {
      animate(shockwaveRef.current, {
        scale: [0.4, 3.2],
        opacity: [0.9, 0],
        duration: 1100,
        ease: "outExpo",
      });
    }
    setDossierOpen((prev) => !prev);
  };

  return (
    <section className="hero" id="top">
      {/* Background Alien Spires, Pink Energy Pods & Moon from Figma Model */}
      <SpaceHorizons />

      {/* Background radial cosmic glows */}
      <div className="hero-bg" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <div className="container hero-head-wrap">
        {/* Top Figma Artwork Header */}
        <div className="hero-figma-head fade-in" style={at(0)}>
          <div className="hero-title-img-wrap">
            <img
              src="/space/assets/hero-title.svg"
              alt="A MESSAGE FROM EARTH — HELLO FELLOW GALAXY MEMBER"
              className="hero-figma-title"
              width={902}
              height={155}
              loading="eager"
            />
            {/* phones: the 902px artwork shrinks to ~40% and its hairline outlines blur out,
                so the same heading is set as real text (two lines, readable stroke) */}
            <p className="hero-title-text">
              <span className="htt-tag htt-tag-top">
                <span className="htt-bar" aria-hidden="true" />
                <span>A message from Earth</span>
              </span>
              <span className="htt-main">
                <span>Hello fellow</span>
                <span>galaxy member</span>
              </span>
              <span className="htt-tag htt-tag-bottom" aria-hidden="true">
                <span>A message from Earth</span>
                <span className="htt-bar" />
              </span>
            </p>
          </div>

          <h1 className="hero-name-callout" style={at(1)}>
            I AM ILYAS
          </h1>

          <div className="hero-subtitle-bar fade-in" style={at(2)}>
            <span className="sub-tag">TRANSMISSION // ARCHITECTING</span>
            <span className="sub-rotator">
              <RotatingWord words={profile.builds} />
            </span>
          </div>
        </div>
      </div>

      {/* Panoramic Planetary Dome Stage (Full Horizon Width) */}
      <div className="hero-celestial-stage fade-in" style={at(3)}>
        {/* Floating Top Right HUD Control Pill */}
        <div className="stage-control-hud">
          <a
            href="#contact"
            className="hud-status-pill"
            onClick={playClickSound}
            onMouseEnter={playHoverSound}
            aria-label="Available for work — open contact section"
          >
            <span className="hud-pulse-dot" aria-hidden="true" />
            <span className="hud-status-text font-mono">
              <span className="hud-status-idle">
                Available · <Clock />
              </span>
              <span className="hud-status-hover" aria-hidden="true">
                Let&apos;s talk <ArrowRight className="hud-arrow" />
              </span>
            </span>
          </a>

          <div ref={tabGroupRef} className="stage-tab-group" role="tablist" aria-label="Celestial view modes">
            <span ref={indicatorRef} className="stage-tab-indicator" aria-hidden="true" />
            {TABS.map(({ id, label, short, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                data-tab={id}
                aria-selected={activeTab === id}
                className={`stage-mode-btn ${activeTab === id ? "is-active" : ""}`}
                onClick={() => selectTab(id)}
                onMouseEnter={playHoverSound}
              >
                <Icon className="stage-mode-icon" aria-hidden="true" />
                <span className="btn-label-desktop">{label}</span>
                <span className="btn-label-mobile">{short}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Central Planet Stage Body */}
        <div className={`stage-planet-viewport mode-${activeTab} ${dossierOpen ? "is-dossier" : ""}`}>
          {/* Shockwave ripple element for click interaction */}
          <div ref={shockwaveRef} className="planet-shockwave-ring" aria-hidden="true" />

          {/* Astronaut perched at the apex of the planetary horizon */}
          {activeTab !== "code" && (
            <div className="hero-astronaut-anchor" aria-hidden="true">
              <img
                src="/space/assets/astronaut-laptop.svg"
                alt="Astronaut programming"
                className="hero-astronaut-svg"
                width={112}
                height={136}
                loading="eager"
              />
              <div className="hero-astronaut-beacon" />
            </div>
          )}

          <div key={activeTab} className="stage-mode-layer">
          {activeTab === "3d" ? (
            <div className="stage-3d-wrap">
              <Hero3D />
            </div>
          ) : activeTab === "vector" ? (
            <div className="stage-vector-wrap">
              {/* Authentic Figma Full Vector Planet */}
              <div className="vector-planet-disc">
                <img
                  src="/space/assets/planet-full.svg"
                  alt="Celestial Earth Planet"
                  className="vector-planet-img"
                  width={1280}
                  height={1280}
                  loading="eager"
                />
              </div>
            </div>
          ) : (
            <div className="stage-terminal-wrap">
              <CodeWindow />
            </div>
          )}
          </div>

          {/* Signature Figma Corner Bracket Prompt: CLICK TO OPEN */}
          {activeTab !== "code" && (
            <button
              type="button"
              className={`figma-planet-prompt ${dossierOpen ? "is-open" : ""}`}
              onClick={handlePlanetClick}
              onMouseEnter={playHoverSound}
              aria-expanded={dossierOpen}
              aria-controls="mission-dossier"
            >
              <span className="prompt-corner top-left" aria-hidden="true" />
              <span className="prompt-content">
                <span className="prompt-headline">
                      CLICK
                  <br />
                  TO OPEN
                </span>
              </span>
              <span className="prompt-corner bottom-right" aria-hidden="true" />
              <span className="prompt-pulse" aria-hidden="true" />
            </button>
          )}

          {activeTab !== "code" && <HoloDossier open={dossierOpen} onClose={closeDossier} onExplore={exploreWork} />}
        </div>
      </div>

      <div className="container hero-dossier-wrap">
        {/* Mission Dossier & Full-Stack Briefing Card (Signature Figma Container Style) */}
        <div
          className="hero-brief-card figma-card fade-in"
          style={at(4)}
        >
          <div className="brief-header">
            <div className="pill brief-status">
              <span className="status">
                <i aria-hidden="true" />
              </span>
              <span className="status-text">Available for missions</span>
              <span className="pill-divider">·</span>
              <span className="status-location">{profile.location}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="brief-freq font-mono text-xs text-cyan-300">
                <Radio className="w-3.5 h-3.5 inline-block mr-1 text-cyan-400 animate-pulse" />
                FREQ: 1420.405 MHz // ENCRYPTED
              </div>
            </div>
          </div>

          <p className="hero-intro">
            Full stack developer at <strong>{profile.employer}</strong>. Navigating the space between scalable backend
            architectures, high-throughput REST APIs, and modern cloud platforms with{" "}
            <strong>Next.js, React, Node.js, MongoDB, MySQL &amp; Redis</strong>.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-glow cursor-pointer"
              onClick={() => { playClickSound(); scrollToId("work"); }}
              onMouseEnter={playHoverSound}
            >
              <span>Explore Selected Work</span>
              <ArrowRight className="icon" aria-hidden="true" />
            </button>

            <a
              className="btn btn-outline"
              href={`mailto:${profile.email}?subject=${encodeURIComponent("Mission Inquiry / Software Engineering Role")}`}
              onClick={playClickSound}
              onMouseEnter={playHoverSound}
            >
              <Mail className="icon" aria-hidden="true" />
              <span>Initiate Transmission</span>
            </a>
          </div>

          {/* Telemetry Stats Bar */}
          <ul className="hero-stats">
            {stats.slice(0, 4).map((stat) => (
              <li key={stat.label} className="stat-item">
                <span className="stat-prefix font-mono text-xs text-purple-300">SYS.STAT //</span>
                <b className="stat-val">0{stat.value}</b>
                <span className="stat-lbl">{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Orbit Chrome Controls: CV Download & Scroll Hint */}
        <div className="hero-bottom-chrome" aria-label="Quick Navigation and Download">
          {/* Bottom Left: Authentic Figma CV Download Badge */}
          <a
            className="chrome-cv-badge"
            href={`mailto:${profile.email}?subject=${encodeURIComponent("Resume / CV Transmission Request")}`}
            onClick={playClickSound}
            onMouseEnter={playHoverSound}
            title="Download / Request Curriculum Vitae"
          >
            <div className="cv-badge-inner">
              <span className="cv-corner top-left" />
              <span className="cv-corner bottom-right" />
              <Download className="w-4 h-4 text-cyan-300 mr-2" />
              <span className="cv-badge-text font-mono text-xs">TRANSMIT RESUME</span>
            </div>
          </a>

          {/* Bottom Right: Authentic Figma Scroll Down Hint */}
          <button
            type="button"
            className="chrome-scroll-hint"
            onClick={() => {
              playClickSound();
              scrollToId("work");
            }}
            onMouseEnter={playHoverSound}
            aria-label="Scroll to projects"
          >
            <span className="scroll-mouse" aria-hidden="true">
              <i />
            </span>
            <span className="scroll-label font-mono">SCROLL TO EXPLORE</span>
          </button>
        </div>
      </div>

      {/* Tech Marquee Ticker */}
      <div className="ticker" aria-label="Technologies and frameworks I engineer with">
        <div className="ticker-track">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1}>
              {marquee.map((tech) => (
                <li key={tech} className="ticker-item">
                  <span className="ticker-bullet" />
                  <span>{tech}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
