"use client";

import Floater from "./Floater";
import { Award, Briefcase, Clock3, Compass, Cpu, Database, MapPin, ShieldCheck, Zap } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { profile } from "@/lib/data";
import Clock from "./Clock";

function delay(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

interface Fact {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: string;
}

const facts: Fact[] = [
  {
    icon: <Briefcase className="icon" />,
    label: "Current Mission",
    value: `Full Stack Developer at ${profile.employer}`,
    sub: "Shipping core full-stack systems & APIs",
  },
  {
    icon: <MapPin className="icon" />,
    label: "Base Coordinates",
    value: profile.location,
    sub: "11.0510° N, 76.0711° E",
  },
  {
    icon: <Clock3 className="icon" />,
    label: "Telemetry Timezone",
    value: <Clock />,
    sub: "UTC+5:30 (India Standard Time)",
  },
  // education lives in the Experience section (full credentials card)
];

const pillars = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    title: "Granular RBAC & Security",
    desc: "Strict permission matrices, secure JWT lifecycle, workflow approvals, and clean data isolation.",
  },
  {
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    title: "Low-Latency Caching",
    desc: "Strategic Redis caching, indexed MongoDB & MySQL queries, and sub-20ms REST API response times.",
  },
  {
    icon: <Cpu className="w-5 h-5 text-cyan-400" />,
    title: "AI & Modern Integrations",
    desc: "Integrating LLMs, vector-based candidate matching, automated resume parsing, and cloud storage pipelines.",
  },
  {
    icon: <Database className="w-5 h-5 text-purple-400" />,
    title: "Distributed Architecture",
    desc: "Decoupled services, event-driven queues, horizontal scalability, and production-tested data integrity.",
  },
];

export default function About() {
  return (
    <section id="about" className="section relative z-10 space-section">
      {/* Decorative Space Elements from Figma Community Pack */}

      <Floater src="/space/planets/planet-06.svg" className="decor-planet-bottom-left" width={84} height={84} kind="planet" depth={0.5} seed={4.4} />

      {/* Featured Astronaut with Coin Micro-Interactive Mascot */}
      <div className="orbit-scene" aria-hidden="true">
        <div className="orbit-plane">
          <span className="orbit-ring" />
          <span className="orbit-ring orbit-ring-outer" />
          <div className="orbit-planet">
            <span className="orbit-atmo" />
            <img src="/space/planets/planet-01.svg" alt="" width={120} height={120} loading="lazy" decoding="async" />
            <span className="orbit-shade" />
          </div>
          <div className="orbit-arm">
            <span className="orbit-trail t1" />
            <span className="orbit-trail t2" />
            <span className="orbit-trail t3" />
            <div className="orbit-carrier">
              <img className="orbit-astro" src="/space/assets/astronaut-fly.svg" alt="" width={68} height={57} loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <header className="section-head">
          <div>
            <p className="eyebrow" data-reveal>
              <Compass className="w-3.5 h-3.5" />
              Pilot Profile
            </p>
            <h2 className="h-section font-display" data-reveal>
              Architecting dependable systems, <br />
              <span className="grad-text">from core to edge</span>
            </h2>
          </div>
          <p data-reveal className="max-w-md text-slate-400">
            {profile.intro}
          </p>
        </header>

        {/* Fact Matrix */}
        <div className="about-facts-grid">
          {facts.map((fact, i) => (
            <div
              key={fact.label}
              className="fact-card figma-card"
              data-spot
              data-reveal
              style={delay(i * 80)}
            >
              <span className="fact-icon-wrap" aria-hidden="true">
                {fact.icon}
              </span>
              <div className="fact-content">
                <span className="fact-label font-mono">{fact.label}</span>
                <b className="fact-val">{fact.value}</b>
                {fact.sub && <span className="fact-sub font-mono">{fact.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Engineering Philosophy Pillars */}
        <div className="pillars-grid mt-12">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className="pillar-card figma-card"
              data-spot
              data-reveal
              style={delay(i * 70)}
            >
              <div className="pillar-top">
                <span className="pillar-icon-box" aria-hidden="true">
                  {pillar.icon}
                </span>
                <h3 className="pillar-title">{pillar.title}</h3>
              </div>
              <p className="pillar-desc">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
