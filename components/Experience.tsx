"use client";

import Floater from "./Floater";
import { Award, Briefcase, Calendar, ChevronDown, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";
import type { CSSProperties } from "react";
import { certificates, education, jobs } from "@/lib/data";
import { playClickSound, playHoverSound } from "@/lib/sound";

const PREVIEW = 3;

export default function Experience() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  return (
    <section id="experience" className="section relative z-10 space-section">
      {/* Decorative Space Elements from Figma Community Pack */}
      <Floater src="/space/planets/planet-03.svg" className="decor-planet-top-right" width={100} height={100} kind="planet" depth={0.5} seed={12.9} />

      <Floater src="/space/planets/planet-10.svg" className="decor-planet-mid-left" width={76} height={76} kind="planet" depth={0.5} seed={14.6} />

      <div className="container">
        {/* Figma Space Header */}
        <header className="experience-figma-head text-center flex flex-col items-center mb-12">
          <div className="space-title-wrap" data-reveal>
            <img
              src="/space/assets/title-experience.svg"
              alt="MY WORK EXPERIENCE"
              className="space-title-img"
              width={480}
              height={140}
            />
          </div>
          <p data-reveal className="max-w-xl text-slate-400 mt-3 text-center text-sm md:text-base font-mono">
            Mission log spanning production SaaS architectures, multi-tenant database scaling, and agile sprint deliveries.
          </p>
        </header>

        {/* Timeline */}
        <div className="timeline-wrapper" data-progress>
          <div className="timeline-rail" aria-hidden="true">
            <span />
          </div>

          <ol className="timeline-list">
            {jobs.map((job, i) => {
              const open = Boolean(expanded[i]);
              const points = open ? job.points : job.points.slice(0, PREVIEW);
              const panelId = `xp-${i}`;

              return (
                <li
                  key={job.title}
                  className="tl-item"
                  data-reveal
                  style={{ "--d": `${i * 90}ms` } as CSSProperties}
                >
                  <span className="tl-dot" aria-hidden="true">
                    <span className="tl-dot-inner" />
                  </span>

                  <article className="tl-card figma-card" data-spot data-tilt>
                    <div className="tl-glow" aria-hidden="true" />

                    <div className="tl-head">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="tl-role-tag font-mono">
                            {i === 0 ? "CURRENT MISSION" : "EARLY MISSION"}
                          </span>
                        </div>
                        <h3 className="tl-title">{job.title}</h3>
                        <p className="tl-org font-mono text-sm">
                          <strong>{job.org}</strong>
                          <span className="mx-2 text-slate-600">·</span>
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.place}
                          </span>
                        </p>
                      </div>

                      <span className="tl-when font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {job.when}
                      </span>
                    </div>

                    <ul id={panelId} className="tl-points">
                      {points.map((pt) => (
                        <li key={pt}>
                          <span className="tl-bullet" aria-hidden="true" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>

                    {job.points.length > PREVIEW && (
                      <button
                        type="button"
                        className="tl-more-btn font-mono"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => {
                          playClickSound();
                          setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));
                        }}
                        onMouseEnter={playHoverSound}
                      >
                        <span>
                          {open
                            ? "Collapse Log"
                            : `+${job.points.length - PREVIEW} more milestones`}
                        </span>
                        <ChevronDown className={`icon ${open ? "is-open" : ""}`} />
                      </button>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Education & Credentials */}
        <div className="cred-grid">
          <article className="cred-card figma-card" data-reveal>
            <header className="cred-head">
              <span className="cred-icon" aria-hidden="true">
                <GraduationCap className="icon" />
              </span>
              <div>
                <span className="cred-eyebrow font-mono">Academic foundation</span>
                <h3 className="cred-title">{education[0].title}</h3>
              </div>
            </header>

            <div className="cred-main">
              <p className="cred-org">{education[0].org}</p>
              <p className="cred-meta font-mono">
                <span>{education[0].place}</span>
                <span className="cred-when">{education[0].when}</span>
              </p>
            </div>

            {education.length > 1 && (
              <ul className="cred-list">
                {education.slice(1).map((item) => (
                  <li key={item.title}>
                    <span>
                      <b>{item.title}</b>
                      <small>{item.org}</small>
                    </span>
                    <span className="cred-when font-mono">{item.when}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="cred-card cred-card-alt figma-card" data-reveal style={{ "--d": "120ms" } as CSSProperties}>
            <header className="cred-head">
              <span className="cred-icon" aria-hidden="true">
                <Award className="icon" />
              </span>
              <div>
                <span className="cred-eyebrow font-mono">Professional accreditations</span>
                <h3 className="cred-title">Certifications &amp; Training</h3>
              </div>
            </header>
            <ul className="cert-chips">
              {certificates.map((cert) => (
                <li key={cert}>
                  <span className="cert-dot" aria-hidden="true" />
                  {cert}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
