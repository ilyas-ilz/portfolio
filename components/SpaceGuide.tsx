"use client";

import { animate } from "animejs";
import { ArrowDown, ArrowUp, Compass, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FlightLayoutInfo, FlightSectionInfo } from "./GuideAstronaut3D";
import { playClickSound, playHoverSound } from "@/lib/sound";

const Astronaut3D = dynamic(() => import("./GuideAstronaut3D"), {
  ssr: false,
  loading: () => <img className="guide-fallback" src="/space/assets/astronaut.svg" alt="" width={70} height={86} />,
});

/**
 * Flight guide: one 3D astronaut that travels with the visitor through every
 * section, flying in the free lane beside the content (or docked in the
 * corner on narrow screens). The badge under it always names the section the
 * timeline is in, numbered in real page order.
 */

interface Stop {
  id: string;
  /** same wording as the main navigation */
  label: string;
  title: string;
  text: string;
  /** button text when this stop is the next destination */
  teaser: string;
}

const STOPS: Stop[] = [
  {
    id: "top",
    label: "Home",
    title: "Welcome aboard, explorer",
    text: "I'm your flight guide. Scroll and I'll take you through Ilyas's missions.",
    teaser: "Back to the launch pad",
  },
  {
    id: "work",
    label: "Projects",
    title: "Mission log",
    text: "Seven products live in production. Every screen here is a real recording.",
    teaser: "Show me the missions",
  },
  {
    id: "about",
    label: "About",
    title: "Pilot profile",
    text: "A full stack developer in Kerala, shipping secure, fast systems teams use daily.",
    teaser: "Who built these?",
  },
  {
    id: "skills",
    label: "Skills",
    title: "The toolkit",
    text: "Frontend, backend, data and cloud: everything used to ship those missions.",
    teaser: "What's in the toolkit?",
  },
  {
    id: "experience",
    label: "Experience",
    title: "Flight history",
    text: "Years of shipping at D4DX and TechMaghi, and the academy that started it all.",
    teaser: "Where has he flown?",
  },
  {
    id: "contact",
    label: "Contact",
    title: "Ready for launch?",
    text: "Copy the email or send a brief. Replies land within 24 hours.",
    teaser: "Open a channel",
  },
];

const SECTION_IDS = STOPS.map((s) => s.id);
const STORE_KEY = "guide-collapsed";
/** auto-show the card only where the free lane can hold it without covering content */
const PEEK_LANE = 300;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(id === "top" ? 0 : el, { offset: -72, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export default function SpaceGuide() {
  const [active, setActive] = useState<FlightSectionInfo>({ index: 0, total: STOPS.length, id: "top" });
  const [flightLayout, setFlightLayout] = useState<FlightLayoutInfo>({ mode: "dock", laneWidth: 0, order: SECTION_IDS });
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const hudRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const firstStep = useRef(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORE_KEY) === "1");
    } catch {
      /* storage blocked: keep defaults */
    }
    setMounted(true);
  }, []);

  const canPeek = flightLayout.mode === "lane" && flightLayout.laneWidth >= PEEK_LANE && !dismissed;

  // Card peeks for a few seconds on each new section (wide screens only).
  useEffect(() => {
    if (!canPeek) {
      setPeek(false);
      return;
    }
    setPeek(true);
    const t = window.setTimeout(() => setPeek(false), 6000);
    return () => window.clearTimeout(t);
  }, [active.id, canPeek]);

  // Text swap animation on section change.
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !textRef.current) return;
    animate(textRef.current, {
      opacity: [0, 1],
      translateY: [10, 0],
      filter: ["blur(4px)", "blur(0px)"],
      duration: 500,
      ease: "outExpo",
    });
  }, [active.id]);

  const onSection = useCallback((info: FlightSectionInfo) => setActive(info), []);
  const onLayout = useCallback((info: FlightLayoutInfo) => {
    setFlightLayout((prev) =>
      prev.mode === info.mode && prev.laneWidth === info.laneWidth && prev.order.join() === info.order.join() ? prev : info,
    );
  }, []);

  const toggleCard = () => {
    playClickSound();
    setUserOpen((o) => !o);
  };

  const closeCard = () => {
    playClickSound();
    setUserOpen(false);
    setPeek(false);
    setDismissed(true);
    try {
      window.localStorage.setItem(STORE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const order = flightLayout.order;
  const stop = STOPS.find((s) => s.id === active.id) ?? STOPS[0];
  const nextId = order[(active.index + 1) % order.length] ?? "top";
  const nextStop = STOPS.find((s) => s.id === nextId) ?? STOPS[0];
  const isLast = active.index >= order.length - 1;
  const open = userOpen || (peek && canPeek);
  const num = `${active.index + 1}/${active.total}`;

  const goNext = () => {
    playClickSound();
    scrollToId(nextId);
  };

  return (
    <aside
      className={`guide is-${flightLayout.mode} ${mounted ? "is-mounted" : ""} ${open ? "is-open" : ""}`}
      aria-label="Flight guide"
    >
      <Astronaut3D
        sections={SECTION_IDS}
        headSelector=".hero-figma-title"
        hudRef={hudRef}
        cardRef={cardRef}
        onSection={onSection}
        onLayout={onLayout}
      />

      <div
        ref={hudRef}
        className="guide-hud"
        data-open={open ? "1" : "0"}
        onMouseEnter={() => {
          // hovering a peeking card keeps it open until the visitor closes it
          if (peek && canPeek) setUserOpen(true);
        }}
      >
        <button
          type="button"
          className="guide-badge font-mono"
          onClick={toggleCard}
          onMouseEnter={playHoverSound}
          aria-expanded={open}
          aria-label={`Flight guide: section ${num.replace("/", " of ")}, ${stop.label}. ${open ? "Hide" : "Show"} guide`}
        >
          <span className="guide-badge-num">{num}</span>
          <span className="guide-badge-label">{stop.label}</span>
        </button>

        <div ref={cardRef} className="guide-card" role="status" aria-live="polite" aria-hidden={!open}>
          <div className="guide-card-head">
            <span className="guide-progress font-mono">
              <Compass className="icon" aria-hidden="true" />
              {active.index + 1} / {active.total} · {stop.label}
            </span>
            <span className="guide-dots" aria-hidden="true">
              {order.map((id, i) => (
                <i key={id} className={i <= active.index ? "is-on" : ""} />
              ))}
            </span>
            <button type="button" className="guide-min" onClick={closeCard} aria-label="Close guide" tabIndex={open ? 0 : -1}>
              <X className="icon" aria-hidden="true" />
            </button>
          </div>
          <div ref={textRef} className="guide-text">
            <b>{stop.title}</b>
            <p>{stop.text}</p>
          </div>
          <button
            type="button"
            className="guide-next"
            onClick={goNext}
            onMouseEnter={playHoverSound}
            tabIndex={open ? 0 : -1}
          >
            {nextStop.teaser}
            {isLast ? <ArrowUp className="icon" aria-hidden="true" /> : <ArrowDown className="icon" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
