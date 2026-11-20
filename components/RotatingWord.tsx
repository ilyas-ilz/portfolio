"use client";

import { useEffect, useState } from "react";

interface RotatingWordProps {
  words: string[];
  interval?: number;
}

/** Cycles through phrases with a slide-up swap. All phrases share one grid cell so nothing reflows. */
export default function RotatingWord({ words, interval = 2600 }: RotatingWordProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % words.length), interval);
    return () => window.clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span className="rotator" aria-live="polite">
      {words.map((word, i) => (
        <span key={word} className="rotator-word" data-state={i === index ? "in" : "out"} aria-hidden={i !== index}>
          {word}
        </span>
      ))}
    </span>
  );
}
