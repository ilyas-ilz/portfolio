"use client";

import Floater from "./Floater";
import { Clock, MessageSquare, Radio, Send, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { profile } from "@/lib/data";
import { playClickSound, playHoverSound } from "@/lib/sound";
import CopyEmail from "./CopyEmail";

const mailto = `mailto:${profile.email}?subject=${encodeURIComponent("Mission Briefing / Software Engineering Role")}&body=${encodeURIComponent(
  `Hi Ilyas,\n\nI reviewed your portfolio and would like to discuss a project or engineering role regarding:\n\n`,
)}`;

export default function Contact() {
  return (
    <section id="contact" className="section contact relative z-10 space-section">
      {/* Decorative Space Elements from Figma Community Pack */}
      <Floater src="/space/planets/planet-09.svg" className="decor-planet-top-left" width={92} height={92} kind="planet" depth={0.5} seed={7.8} />

      <Floater src="/space/planets/planet-11.svg" className="decor-planet-mid-right" width={84} height={84} kind="planet" depth={0.5} seed={9.5} />

      <div className="container">
        {/* Figma Space Header */}
        <header className="contact-figma-head text-center flex flex-col items-center mb-10">
          <div className="space-title-wrap" data-reveal>
            <img
              src="/space/assets/title-contact.svg"
              alt="CONTACT ME"
              className="space-title-img"
              width={380}
              height={136}
            />
          </div>
          <p data-reveal className="max-w-lg text-slate-400 mt-3 text-center text-sm md:text-base font-mono">
            Have a new mission, SaaS platform, or full stack engineering challenge? Send a subspace transmission.
          </p>
        </header>

        <div className="contact-card figma-card" data-reveal>
          {/* Animated Matrix Grid Background */}
          <div className="contact-grid-bg" aria-hidden="true" />
          <div className="contact-glow-orb" aria-hidden="true" />

          <div className="contact-header">
            <div className="contact-kicker font-mono">
              <Radio className="icon" aria-hidden="true" />
              <span>SUB-SPACE TRANSMISSION LINK // ACTIVE</span>
            </div>

            <h2 className="contact-title font-display">
              Have an ambitious mission in mind?
              <br />
              <span className="contact-title-accent">Let&apos;s engineer it into orbit.</span>
            </h2>
            <p className="contact-sub">
              Available for full-time software engineering roles, high-impact SaaS development, or technical
              architecture consulting. Typical transmission response time is within 24 hours.
            </p>

            <div className="contact-cta-row">
              <a
                className="btn btn-glow"
                href={mailto}
                onClick={playClickSound}
                onMouseEnter={playHoverSound}
              >
                <span className="label-long">Initiate Transmission</span>
                <span className="label-short">Start a project</span>
                <Send className="icon" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Contact Direct Tiles */}
          <div className="contact-rows">
            <CopyEmail email={profile.email} />

            <div className="contact-tile figma-card" style={{ "--d": "80ms" } as CSSProperties}>
              <small className="font-mono">
                <span>Mission Availability</span>
                <Clock className="icon" aria-hidden="true" />
              </small>
              <b>Open for Engineering Roles</b>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
