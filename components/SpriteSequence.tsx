"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { onScroll } from "@/lib/scrollBus";

/**
 * Frame-sequence player (flip-book): draws pre-decoded frames on a canvas so the
 * viewer never sees an image swap, flicker or half-loaded frame.
 *
 * Drop frames in /public/sequences/<name>/ named with a zero-padded counter:
 *   /public/sequences/astro-wave/frame-001.webp … frame-040.webp
 * then:
 *   <SpriteSequence base="/sequences/astro-wave/frame-" count={40} width={300} height={300} />
 *
 * - Loads only when within ~1 screen of the viewport, decodes every frame first
 *   (shimmer skeleton meanwhile), then plays.
 * - Pauses while off-screen or when the tab is hidden; frees GPU bitmaps on unmount.
 * - mode "loop" | "pingpong" play on a timer; "scroll" scrubs frames with page scroll.
 * - prefers-reduced-motion: shows the first frame only.
 */

export type SequenceMode = "loop" | "pingpong" | "scroll";

export interface SpriteSequenceProps {
  /** URL prefix, e.g. "/sequences/astro/frame-" */
  base: string;
  /** Number of frames (numbered from `start`) */
  count: number;
  start?: number;
  /** Zero-padding width of the counter ("001" → 3) */
  pad?: number;
  ext?: "webp" | "png" | "avif" | "jpg";
  /** Intrinsic frame size — sets the aspect ratio of the canvas */
  width: number;
  height: number;
  fps?: number;
  mode?: SequenceMode;
  className?: string;
  style?: CSSProperties;
  label?: string;
}

type Frame = ImageBitmap | HTMLImageElement;

function frameUrls(base: string, count: number, start: number, pad: number, ext: string): string[] {
  return Array.from({ length: count }, (_, i) => `${base}${String(start + i).padStart(pad, "0")}.${ext}`);
}

async function decodeFrame(url: string, signal: AbortSignal): Promise<Frame> {
  if ("createImageBitmap" in window) {
    const res = await fetch(url, { signal, cache: "force-cache" });
    if (!res.ok) throw new Error(`frame ${url}: ${res.status}`);
    return createImageBitmap(await res.blob());
  }
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

export default function SpriteSequence({
  base,
  count,
  start = 1,
  pad = 3,
  ext = "webp",
  width,
  height,
  fps = 24,
  mode = "loop",
  className = "",
  style,
  label,
}: SpriteSequenceProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<Frame[]>([]);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const urls = useMemo(() => frameUrls(base, count, start, pad, ext), [base, count, start, pad, ext]);

  // 1. Start loading once the element is within ~1 screen of the viewport.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 2. Decode every frame up front (parallel, bounded), keep them as bitmaps.
  useEffect(() => {
    if (!near) return;
    const ctrl = new AbortController();
    let cancelled = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wanted = reduce ? urls.slice(0, 1) : urls;

    (async () => {
      const out: Frame[] = new Array(wanted.length);
      let next = 0;
      const worker = async () => {
        while (next < wanted.length) {
          const i = next++;
          out[i] = await decodeFrame(wanted[i], ctrl.signal);
        }
      };
      try {
        await Promise.all(Array.from({ length: Math.min(6, wanted.length) }, worker));
        if (cancelled) {
          out.forEach((f) => "close" in f && f.close());
          return;
        }
        framesRef.current = out;
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
      framesRef.current.forEach((f) => "close" in f && f.close());
      framesRef.current = [];
      setReady(false);
    };
  }, [near, urls]);

  // 3. Draw: timer-driven (loop / pingpong) or scroll-driven, only while visible.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const frames = framesRef.current;
    if (!ready || !canvas || !wrap || !frames.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let current = -1;
    const draw = (i: number) => {
      const idx = Math.max(0, Math.min(frames.length - 1, i));
      if (idx === current) return;
      current = idx;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[idx], 0, 0, canvas.width, canvas.height);
    };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      const keep = current;
      current = -1;
      draw(Math.max(0, keep));
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(wrap);

    if (frames.length === 1) return () => ro.disconnect();

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(wrap);

    if (mode === "scroll") {
      let top = 0;
      let h = 1;
      const measure = () => {
        const r = wrap.getBoundingClientRect();
        top = r.top + window.scrollY;
        h = r.height;
      };
      measure();
      const update = (y: number) => {
        if (!visible) return;
        const vh = window.innerHeight;
        // 0 when the element enters at the bottom, 1 when it leaves at the top
        const p = (y + vh - top) / (vh + h);
        draw(Math.floor(Math.max(0, Math.min(0.9999, p)) * frames.length));
      };
      update(window.scrollY);
      const off = onScroll(update);
      window.addEventListener("resize", measure);
      return () => {
        off();
        window.removeEventListener("resize", measure);
        io.disconnect();
        ro.disconnect();
      };
    }

    const frameMs = 1000 / fps;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let pos = 0;
    let dir = 1;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      acc += now - last;
      last = now;
      if (acc < frameMs) return;
      const steps = Math.floor(acc / frameMs);
      acc -= steps * frameMs;
      for (let s = 0; s < steps; s++) {
        if (mode === "pingpong") {
          if (pos + dir >= frames.length || pos + dir < 0) dir *= -1;
          pos += dir;
        } else {
          pos = (pos + 1) % frames.length;
        }
      }
      draw(pos);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [ready, mode, fps]);

  return (
    <div
      ref={wrapRef}
      className={`seq ${ready ? "is-ready" : ""} ${failed ? "is-failed" : ""} ${className}`}
      style={{ aspectRatio: `${width} / ${height}`, ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {!ready && !failed && <span className="seq-skel skel-shimmer" aria-hidden="true" />}
      <canvas ref={canvasRef} className="seq-canvas" />
    </div>
  );
}
