"use client";

import { ArrowRight, ArrowUpRight, Eye } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { mediaFor, projects } from "@/lib/data";
import type { Project } from "@/lib/data";
import { onScroll } from "@/lib/scrollBus";
import { playChimeSound, playClickSound, playHoverSound } from "@/lib/sound";
import Floater from "./Floater";
import LazyVideo from "./LazyVideo";
import ProjectModal from "./ProjectModal";

type CategoryFilter = "All" | Project["category"];

const CATEGORIES: CategoryFilter[] = ["All", "SaaS & AI", "Platforms & Media", "ERP & Systems"];
/** Below this width the panel is not pinned; the list becomes tappable tabs. */
const PIN_QUERY = "(min-width: 961px)";

const pad = (n: number) => String(n).padStart(2, "0");

interface MediaProps {
  project: Project;
}

function Media({ project }: MediaProps) {
  const media = mediaFor(project);
  if (project.app) {
    return (
      <div className="pd-app">
        <LazyVideo
          src={media.mobileVideo}
          poster={media.mobilePoster}
          label={`${project.name} app screens`}
          width={720}
          height={1280}
          delay={350}
        />
      </div>
    );
  }
  return (
    <div className="pd-devices">
      <div className="pd-browser">
        <div className="bar" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>{project.host}</span>
        </div>
        <LazyVideo
          src={media.desktopVideo}
          poster={media.desktopPoster}
          label={`${project.name}, desktop recording`}
          width={1280}
          height={800}
          delay={350}
        />
      </div>
      <div className="pd-phone">
        <LazyVideo
          src={media.mobileVideo}
          poster={media.mobilePoster}
          label={`${project.name}, phone recording`}
          width={540}
          height={1170}
          delay={350}
        />
      </div>
    </div>
  );
}

function Links({ project }: { project: Project }) {
  if (project.app) {
    return (
      <>
        <a className="pd-link" href={project.app.playStore} target="_blank" rel="noopener noreferrer">
          Google Play
          <ArrowUpRight className="icon" aria-hidden="true" />
        </a>
        <a className="pd-link pd-link-primary" href={project.app.appStore} target="_blank" rel="noopener noreferrer">
          App Store
          <ArrowUpRight className="icon" aria-hidden="true" />
        </a>
      </>
    );
  }
  return (
    <a className="pd-link pd-link-primary" href={project.url} target="_blank" rel="noopener noreferrer">
      Visit live
      <ArrowUpRight className="icon" aria-hidden="true" />
    </a>
  );
}

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(false);

  const list = useMemo(
    () => (activeCategory === "All" ? projects : projects.filter((p) => p.category === activeCategory)),
    [activeCategory],
  );
  const current = list[Math.min(active, list.length - 1)];

  /*
   * Scroll-driven selection: the scroller is ~1 viewport per project; the panel
   * inside it is sticky. Scroll progress through the scroller picks the project.
   */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const mq = window.matchMedia(PIN_QUERY);
    let top = 0;
    let span = 1;

    const measure = () => {
      pinnedRef.current = mq.matches;
      const r = scroller.getBoundingClientRect();
      top = r.top + window.scrollY;
      span = Math.max(1, scroller.offsetHeight - window.innerHeight);
    };

    const update = (y: number) => {
      if (!pinnedRef.current) return;
      const progress = (y - top + window.innerHeight * 0.15) / span;
      const idx = Math.max(0, Math.min(list.length - 1, Math.floor(progress * list.length)));
      setActive(idx);
    };

    measure();
    update(window.scrollY);
    const off = onScroll(update);
    const onResize = () => {
      measure();
      update(window.scrollY);
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", onResize);
    mq.addEventListener("change", onResize);
    return () => {
      off();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
      mq.removeEventListener("change", onResize);
    };
  }, [list.length]);

  const select = useCallback(
    (idx: number) => {
      playClickSound();
      const scroller = scrollerRef.current;
      if (!pinnedRef.current || !scroller) {
        setActive(idx);
        const tab = scroller?.querySelectorAll<HTMLElement>(".work-item")[idx];
        tab?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        return;
      }
      const top = scroller.getBoundingClientRect().top + window.scrollY;
      const span = Math.max(1, scroller.offsetHeight - window.innerHeight);
      const y = top + ((idx + 0.5) / list.length) * span - window.innerHeight * 0.15;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.9 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    },
    [list.length],
  );

  const pickCategory = (cat: CategoryFilter) => {
    if (cat === activeCategory) return;
    playChimeSound();
    setActiveCategory(cat);
    setActive(0);
    const scroller = scrollerRef.current;
    if (scroller && scroller.getBoundingClientRect().top < 0) {
      const y = scroller.getBoundingClientRect().top + window.scrollY - 140;
      window.__lenis?.scrollTo(y, { immediate: true });
    }
  };

  if (!current) return null;
  const number = pad(projects.indexOf(current) + 1);

  return (
    <section id="work" className="section relative z-10 space-section work-section">
      <Floater src="/space/planets/planet-02.svg" className="decor-planet-top-left" width={110} height={110} kind="planet" depth={0.5} seed={18} />

      <div className="container">
        <header className="section-head">
          <div className="space-title-wrap" data-reveal>
            <img src="/space/assets/title-projects.svg" alt="My Projects" className="space-title-img" width={340} height={138} />
          </div>
          <p data-reveal className="section-sub font-mono">
            Full-stack missions live in production. Every screen is recorded from the running product.
          </p>
          <div className="project-filters" role="tablist" aria-label="Filter projects" data-reveal>
            {CATEGORIES.map((cat) => {
              const count = cat === "All" ? projects.length : projects.filter((p) => p.category === cat).length;
              const on = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={`filter-btn ${on ? "is-active" : ""}`}
                  onClick={() => pickCategory(cat)}
                  onMouseEnter={playHoverSound}
                >
                  <span>{cat}</span>
                  <span className="filter-count font-mono">{count}</span>
                </button>
              );
            })}
          </div>
        </header>
      </div>

      <div
        ref={scrollerRef}
        className="work-scroller"
        style={{ "--n": list.length } as CSSProperties}
      >
        <div className="work-pin container">
          <div className="work-pin-top">
            <span className="work-pin-label font-mono">Mission log</span>
            <span className="work-counter font-mono" aria-live="polite">
              <b>{pad(active + 1)}</b> / {pad(list.length)}
            </span>
          </div>

          <div className="work-layout">
            {/* Left: mission list */}
            <ol className="work-list" aria-label="Projects">
              {list.map((p, i) => {
                const on = i === active;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`work-item ${on ? "is-active" : ""}`}
                      style={{ "--p": p.accent } as CSSProperties}
                      aria-current={on ? "true" : undefined}
                      onClick={() => select(i)}
                      onMouseEnter={playHoverSound}
                    >
                      <span className="work-item-num font-display">{pad(projects.indexOf(p) + 1)}</span>
                      <span className="work-item-text">
                        <b>{p.name}</b>
                        <small className="font-mono">{p.category}</small>
                      </span>
                      <ArrowRight className="work-item-arrow" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Right: detail panel */}
            <article key={current.id} className="pd" style={{ "--p": current.accent } as CSSProperties} data-spot>
              <div className="pd-media">
                <span className="pd-live font-mono">
                  <i aria-hidden="true" />
                  Live recording
                </span>
                <Media project={current} />
              </div>

              <div className="pd-body">
                <div className="pd-meta">
                  <span className="pd-kicker font-mono">
                    {number} // {current.category}
                  </span>
                  <div className="pd-links">
                    <button
                      type="button"
                      className="pd-link"
                      onClick={() => {
                        playClickSound();
                        setSelectedProject(current);
                      }}
                      onMouseEnter={playHoverSound}
                    >
                      <Eye className="icon" aria-hidden="true" />
                      Architecture
                    </button>
                    <Links project={current} />
                  </div>
                </div>

                <h3 className="pd-title">{current.name}</h3>
                <p className="pd-kind">{current.kind}</p>
                <p className="pd-desc">{current.description}</p>

                {current.points.length > 0 && (
                  <div className="pd-row">
                    <span className="pd-row-label font-mono">Key highlights</span>
                    <ul className="pd-chips pd-chips-hl">
                      {current.points.slice(0, 2).map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {current.stack.length > 0 && (
                  <div className="pd-row">
                    <span className="pd-row-label font-mono">Tech stack</span>
                    <ul className="pd-chips font-mono">
                      {current.stack.slice(0, 7).map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                      {current.stack.length > 7 && <li className="pd-more">+{current.stack.length - 7}</li>}
                    </ul>
                  </div>
                )}
              </div>
            </article>
          </div>
        </div>
      </div>

      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </section>
  );
}
