"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";

/* -------------------------------------------------------------------------- */
/* Shared zero-gravity engine: ONE rAF loop drives every floating decoration.  */
/* Each item drifts on its own Lissajous orbit, banks into its motion, reacts  */
/* to the pointer (parallax + lean) and to scroll (depth parallax).            */
/* Off-screen items are skipped via IntersectionObserver.                      */
/* -------------------------------------------------------------------------- */

interface Item {
  el: HTMLElement;
  seed: number;
  depth: number;
  ampX: number;
  ampY: number;
  rotAmp: number;
  visible: boolean;
  /** cached document-space centre of the parent section (no per-frame layout reads) */
  center: number;
}

function measureItem(it: Item): void {
  const r = it.el.parentElement?.parentElement?.getBoundingClientRect();
  it.center = r ? r.top + window.scrollY + r.height / 2 : 0;
}

function measureAll(): void {
  for (const it of items) measureItem(it);
}

const items = new Set<Item>();
let rafId = 0;
let pointerX = 0;
let pointerY = 0;
let smoothX = 0;
let smoothY = 0;
let io: IntersectionObserver | null = null;
let listening = false;

function onPointer(e: PointerEvent) {
  pointerX = e.clientX / window.innerWidth - 0.5;
  pointerY = e.clientY / window.innerHeight - 0.5;
}

function tick(now: number) {
  const t = now / 1000;
  smoothX += (pointerX - smoothX) * 0.06;
  smoothY += (pointerY - smoothY) * 0.06;
  const vh = window.innerHeight;

  const sy = window.scrollY;

  for (const it of items) {
    if (!it.visible) continue;
    // clamp: tall sections (the project deck) must not fling the decoration away
    const rel = Math.max(-1, Math.min(1, (it.center - sy - vh / 2) / vh));
    const s = it.seed;
    const x = Math.sin(t * 0.42 + s) * it.ampX + Math.sin(t * 0.17 + s * 2.1) * it.ampX * 0.4;
    const y = Math.cos(t * 0.33 + s * 1.3) * it.ampY + Math.sin(t * 0.21 + s) * it.ampY * 0.35;
    const vx = Math.cos(t * 0.42 + s) * it.ampX; // velocity sign → bank direction
    const px = smoothX * 26 * it.depth;
    const py = smoothY * 18 * it.depth - rel * 50 * it.depth;
    const rot = Math.sin(t * 0.27 + s) * it.rotAmp + vx * 0.12 + smoothX * 6 * it.depth;
    it.el.style.transform = `translate3d(${(x + px).toFixed(2)}px, ${(y + py).toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
  }

  rafId = items.size ? requestAnimationFrame(tick) : 0;
}

function register(it: Item) {
  items.add(it);
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          for (const item of items) {
            if (item.el !== entry.target) continue;
            item.visible = entry.isIntersecting;
            if (entry.isIntersecting) measureItem(item);
          }
        }
      },
      { rootMargin: "120px" },
    );
  }
  io.observe(it.el);
  measureItem(it);
  if (!listening) {
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", measureAll, { passive: true });
    window.addEventListener("load", measureAll);
    listening = true;
  }
  if (!rafId) rafId = requestAnimationFrame(tick);
}

function unregister(it: Item) {
  items.delete(it);
  io?.unobserve(it.el);
  if (!items.size) {
    cancelAnimationFrame(rafId);
    rafId = 0;
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("resize", measureAll);
    window.removeEventListener("load", measureAll);
    listening = false;
  }
}

interface FloaterProps {
  src: string;
  className?: string;
  width: number;
  height: number;
  kind?: "planet" | "astronaut";
  /** 0..1 — how strongly it reacts to pointer + scroll. */
  depth?: number;
  seed?: number;
  glow?: string;
}

export default function Floater({
  src,
  className = "",
  width,
  height,
  kind = "planet",
  depth = 0.6,
  seed = 1,
  glow = "rgba(0, 240, 255, 0.45)",
}: FloaterProps) {
  const driftRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    const el = driftRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const astro = kind === "astronaut";
    const item: Item = {
      el,
      seed,
      depth,
      ampX: astro ? 22 : 10,
      ampY: astro ? 26 : 14,
      rotAmp: astro ? 9 : 14,
      visible: false,
      center: 0,
    };
    register(item);
    return () => unregister(item);
  }, [kind, depth, seed]);

  const onClick = () => {
    const body = bodyRef.current;
    if (!body || busy.current) return;
    busy.current = true;
    const astro = kind === "astronaut";
    animate(body, {
      rotate: astro ? [0, -360] : [0, 360],
      scale: [1, 1.22, 1],
      duration: astro ? 1400 : 1100,
      ease: "outElastic(1, .55)",
      onComplete: () => {
        body.style.transform = "";
        busy.current = false;
      },
    });
    body.parentElement?.classList.remove("is-burst");
    void body.parentElement?.offsetWidth;
    body.parentElement?.classList.add("is-burst");
  };

  return (
    <div className={`floater floater-${kind} ${className}`} aria-hidden="true" style={{ "--glow": glow } as React.CSSProperties}>
      <div ref={driftRef} className="floater-drift">
        <span className="floater-ring" />
        <div ref={bodyRef} className="floater-body" onClick={onClick}>
          <img src={src} alt="" width={width} height={height} loading="lazy" decoding="async" draggable={false} />
        </div>
        {kind === "astronaut" && <span className="floater-shadow" />}
      </div>
    </div>
  );
}
