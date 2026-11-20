"use client";

import { ArrowUpRight, CheckCircle2, Layers, Server, Sparkles, X } from "lucide-react";
import { useEffect } from "react";
import type { Project } from "@/lib/data";
import { mediaFor } from "@/lib/data";
import { playClickSound } from "@/lib/sound";
import LazyVideo from "./LazyVideo";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    if (!project) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    // Prevent background scrolling while modal is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [project, onClose]);

  if (!project) return null;

  const media = mediaFor(project);

  return (
    <div
      className="project-modal-backdrop"
      onClick={() => {
        playClickSound();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="project-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ "--accent-color": project.accent } as React.CSSProperties}
      >
        <header className="project-modal-head">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="live-pill">
                <i /> Live Production
              </span>
              <span className="cat-pill">{project.category}</span>
            </div>
            <h2 id="modal-title" className="project-modal-title">
              {project.name}
            </h2>
            <p className="project-modal-kind">{project.kind}</p>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            aria-label="Close project modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="project-modal-body">
          {/* Media preview */}
          <div className="project-modal-media">
            {project.app ? (
              <div className="modal-app-frame">
                <LazyVideo
                  src={media.mobileVideo}
                  poster={media.mobilePoster}
                  label={`${project.name} app demo`}
                  width={720}
                  height={1280}
                />
              </div>
            ) : (
              <div className="modal-browser-frame">
                <div className="modal-browser-bar">
                  <span className="bar-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="bar-url">{project.host}</span>
                </div>
                <LazyVideo
                  src={media.desktopVideo}
                  poster={media.desktopPoster}
                  label={`${project.name} desktop recording`}
                  width={1280}
                  height={800}
                />
              </div>
            )}
          </div>

          {/* Details & Architecture */}
          <div className="project-modal-details">
            <div className="modal-section">
              <h3 className="modal-section-title">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Overview & Impact
              </h3>
              <p className="modal-desc">{project.description}</p>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Key Architectural Highlights
              </h3>
              <ul className="modal-points">
                {project.points.map((pt, i) => (
                  <li key={i}>
                    <span className="point-bullet" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">
                <Layers className="w-4 h-4 text-indigo-400" />
                Technologies & Tools
              </h3>
              <div className="modal-stack-tags">
                {project.stack.map((t) => (
                  <span key={t} className="modal-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="modal-actions">
              {project.app ? (
                <>
                  <a
                    href={project.app.playStore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-btn modal-btn-primary"
                    onClick={playClickSound}
                  >
                    Google Play Store
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                  <a
                    href={project.app.appStore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-btn modal-btn-secondary"
                    onClick={playClickSound}
                  >
                    Apple App Store
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </>
              ) : (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-btn modal-btn-primary"
                  onClick={playClickSound}
                >
                  Visit Live Production Website
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
