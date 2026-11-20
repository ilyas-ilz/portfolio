"use client";

import Floater from "./Floater";
import {
  Bot,
  Cloud,
  Code2,
  Cpu,
  Database,
  Globe2,
  LayoutTemplate,
  Search,
  Server,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { skillGroups } from "@/lib/data";
import { playHoverSound } from "@/lib/sound";

const icons: Record<string, ReactNode> = {
  Languages: <Code2 className="w-5 h-5" />,
  Frontend: <LayoutTemplate className="w-5 h-5" />,
  Backend: <Server className="w-5 h-5" />,
  Database: <Database className="w-5 h-5" />,
  "Cloud and DevOps": <Cloud className="w-5 h-5" />,
  "AI and integrations": <Bot className="w-5 h-5" />,
  SEO: <Search className="w-5 h-5" />,
  Tools: <Wrench className="w-5 h-5" />,
};

const categoryAccents: Record<string, string> = {
  Languages: "#38bdf8",
  Frontend: "#00f0ff",
  Backend: "#818cf8",
  Database: "#10b981",
  "Cloud and DevOps": "#f59e0b",
  "AI and integrations": "#c084fc",
  SEO: "#f43f5e",
  Tools: "#94a3b8",
};

export default function Skills() {
  return (
    <section id="skills" className="section relative z-10 space-section">
      {/* Decorative Floating Space Elements from Figma Community Pack */}
      <Floater src="/space/planets/planet-12.svg" className="decor-planet-top-right" width={130} height={130} kind="planet" depth={0.5} seed={23.1} />

      <Floater src="/space/planets/planet-04.svg" className="decor-planet-bottom-left" width={84} height={84} kind="planet" depth={0.5} seed={24.8} />

      <div className="container">
        {/* Figma Space Themed Section Header */}
        <header className="skills-figma-head text-center flex flex-col items-center mb-12">
          <div className="space-title-wrap" data-reveal>
            <img
              src="/space/assets/title-skills.svg"
              alt="MY SKILLS"
              className="space-title-img"
              width={312}
              height={132}
            />
          </div>
          <div className="space-sub-wrap mt-2" data-reveal>
            <img
              src="/space/assets/skills-sub.svg"
              alt="Here is a list of some of my skills"
              className="space-sub-img"
              width={565}
              height={44}
            />
          </div>
          <p data-reveal className="max-w-xl text-slate-400 mt-4 text-center text-sm md:text-base font-mono">
            Mission-tested full stack capabilities spanning distributed systems, relational &amp; NoSQL architectures,
            high-throughput REST APIs, and responsive micro-frontends.
          </p>
        </header>

        {/* Skill Bento Grid with Figma Card Brackets */}
        <div className="skill-grid">
          {skillGroups.map((group, i) => {
            const accent = categoryAccents[group.label] || "#38bdf8";

            return (
              <div
                key={group.label}
                className="skill-card figma-card"
                data-spot
                data-tilt
                data-reveal
                style={
                  {
                    "--d": `${(i % 4) * 60}ms`,
                    "--skill-accent": accent,
                  } as CSSProperties
                }
              >
                <div className="skill-glow" aria-hidden="true" />

                <div className="skill-top">
                  <span className="skill-icon-wrap" aria-hidden="true">
                    {icons[group.label]}
                  </span>
                  <div>
                    <h3 className="skill-card-title">{group.label}</h3>
                    <span className="skill-count font-mono">{group.skills.length} competencies</span>
                  </div>
                </div>

                <ul className="skill-pills-list">
                  {group.skills.map((skill) => (
                    <li
                      key={skill}
                      className="skill-pill"
                      onMouseEnter={playHoverSound}
                    >
                      <span className="pill-dot" />
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
