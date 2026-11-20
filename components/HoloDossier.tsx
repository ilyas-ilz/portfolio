"use client";

import { animate, createTimeline, stagger } from "animejs";
import { ArrowRight, Briefcase, Code2, Mail, MapPin, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { profile, stats } from "@/lib/data";
import { playClickSound, playHoverSound } from "@/lib/sound";

interface HoloDossierProps {
  open: boolean;
  onClose: () => void;
  onExplore: () => void;
}

/**
 * Holographic mission dossier that unfolds out of the planet:
 * scan beam → panel unfolds → rows stream in → stats count up.
 */
export default function HoloDossier({ open, onClose, onExplore }: HoloDossierProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    const beam = beamRef.current;
    if (!root || !panel || !beam) return;
    const rows = panel.querySelectorAll<HTMLElement>("[data-holo-row]");
    const nums = panel.querySelectorAll<HTMLElement>("[data-count]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (open) {
      root.classList.add("is-open");
      if (reduce) {
        panel.style.clipPath = "inset(0 0 0 0 round 20px)";
        rows.forEach((r) => (r.style.opacity = "1"));
        nums.forEach((n) => (n.textContent = String(n.dataset.count).padStart(2, "0")));
        return;
      }
      const tl = createTimeline({ defaults: { ease: "outExpo" } });
      tl.add(beam, { scaleX: [0, 1], opacity: [0, 1], duration: 380 })
        .add(panel, { clipPath: ["inset(49.5% 0 49.5% 0 round 20px)", "inset(0% 0 0% 0 round 20px)"], duration: 620 }, "-=80")
        .add(beam, { opacity: [1, 0], duration: 300 }, "<<+=200")
        .add(rows, { opacity: [0, 1], translateY: [14, 0], filter: ["blur(6px)", "blur(0px)"], delay: stagger(55), duration: 600 }, "<<+=160");
      nums.forEach((n) => {
        const target = Number(n.dataset.count);
        const obj = { v: 0 };
        animate(obj, {
          v: target,
          duration: 1100,
          delay: 520,
          ease: "outQuart",
          onUpdate: () => (n.textContent = String(Math.round(obj.v)).padStart(2, "0")),
        });
      });

      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }

    if (!root.classList.contains("is-open")) return;
    if (reduce) {
      root.classList.remove("is-open");
      return;
    }
    const tl = createTimeline({ defaults: { ease: "inExpo" }, onComplete: () => root.classList.remove("is-open") });
    tl.add(rows, { opacity: 0, translateY: -8, duration: 220, delay: stagger(20, { reversed: true }) }).add(
      panel,
      { clipPath: "inset(49.5% 0 49.5% 0 round 20px)", duration: 420 },
      "-=120",
    );
  }, [open, onClose]);

  return (
    <div
      ref={rootRef}
      className="holo-root"
      id="mission-dossier"
      role="dialog"
      aria-modal="false"
      aria-label="Mission dossier"
      aria-hidden={!open}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <span ref={beamRef} className="holo-beam" aria-hidden="true" />
      <div ref={panelRef} className="holo-panel">
        <span className="holo-scan" aria-hidden="true" />
        <div className="holo-head" data-holo-row>
          <div className="holo-id">
            <span className="holo-avatar" aria-hidden="true">IM</span>
            <div>
              <p className="holo-kicker">CREW FILE // 001</p>
              <h2 className="holo-name">{profile.name}</h2>
              <p className="holo-role">{profile.role}</p>
            </div>
          </div>
          <button
            type="button"
            className="holo-close"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            aria-label="Close dossier"
            tabIndex={open ? 0 : -1}
          >
            <X className="icon" />
          </button>
        </div>

        <ul className="holo-facts">
          <li data-holo-row>
            <Briefcase className="icon" aria-hidden="true" />
            <span>
              <small>Current mission</small>
              {profile.employer}
            </span>
          </li>
          <li data-holo-row>
            <MapPin className="icon" aria-hidden="true" />
            <span>
              <small>Base</small>
              {profile.location}
            </span>
          </li>
          <li data-holo-row>
            <Code2 className="icon" aria-hidden="true" />
            <span>
              <small>Core stack</small>
              Next.js · Node.js · MongoDB · Redis
            </span>
          </li>
        </ul>

        <ul className="holo-stats">
          {stats.map((s) => (
            <li key={s.label} data-holo-row>
              <b data-count={s.value}>00</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>

        <div className="holo-actions" data-holo-row>
          <button
            type="button"
            className="btn btn-glow"
            onClick={onExplore}
            onMouseEnter={playHoverSound}
            tabIndex={open ? 0 : -1}
          >
            <span>Explore missions</span>
            <ArrowRight className="icon" aria-hidden="true" />
          </button>
          <a
            className="btn btn-outline"
            href={`mailto:${profile.email}`}
            onClick={playClickSound}
            onMouseEnter={playHoverSound}
            tabIndex={open ? 0 : -1}
          >
            <Mail className="icon" aria-hidden="true" />
            <span>Open channel</span>
          </a>
        </div>
      </div>
    </div>
  );
}
