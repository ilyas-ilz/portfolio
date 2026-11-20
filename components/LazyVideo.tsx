"use client";

import { useEffect, useRef, useState } from "react";

interface LazyVideoProps {
  src: string;
  poster: string;
  label: string;
  width: number;
  height: number;
  /** Play only while this is true (topmost / hovered card). */
  isActive?: boolean;
  /** Pre-buffer the file (next card in the stack) without playing it. */
  warm?: boolean;
  /** Wait this long (ms) before loading/playing, so fast scroll-through never starts videos. */
  delay?: number;
  className?: string;
}

/**
 * Video with a shimmer skeleton:
 *  1. shimmer until the poster image has decoded,
 *  2. poster shown until the video can actually play (no black flash),
 *  3. src is attached only when warm/active, so the network stays idle otherwise.
 * The browser HTTP cache (see next.config headers) makes revisits instant.
 */
export default function LazyVideo({
  src,
  poster,
  label,
  width,
  height,
  isActive = true,
  warm = false,
  delay = 0,
  className = "",
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useRef(false);
  const [posterReady, setPosterReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let ready = delay === 0;
    const sync = () => {
      ready = true;
      if (reduce) return;
      const shouldLoad = (isActive && inView.current) || warm;
      if (shouldLoad && !video.getAttribute("src")) {
        video.preload = isActive ? "auto" : "metadata";
        video.src = src;
      }
      if (isActive && inView.current) video.play().catch(() => {});
      else video.pause();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
        if (ready) sync();
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    io.observe(video);
    const timer = window.setTimeout(sync, delay);
    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, [src, isActive, warm, delay]);

  // Release decoder + buffered frames when the element goes away. Without this
  // Chrome can keep hundreds of MB of video memory alive for detached players.
  useEffect(() => {
    const video = ref.current;
    return () => {
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  return (
    <div
      className={`lv ${posterReady ? "is-poster" : ""} ${playing ? "is-playing" : ""} ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <span className="lv-skel" aria-hidden="true" />
      <img
        className="lv-poster"
        src={poster}
        alt=""
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setPosterReady(true)}
        onError={() => setPosterReady(true)}
      />
      {src && (
        <video
          ref={ref}
          width={width}
          height={height}
          muted
          loop
          playsInline
          preload="none"
          aria-label={label}
          onPlaying={() => setPlaying(true)}
        />
      )}
    </div>
  );
}
