"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { emitScroll, setScrollDriven } from "@/lib/scrollBus";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Ultra-Responsive Smooth Scrolling Engine
 * Tuned for instant response, zero lag, and 120fps hardware-accelerated compositor performance.
 */
export default function Motion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    let lenis: Lenis | null = null;

    if (!reduceMotion) {
      // lerp-based smoothing: frame-rate independent, no "rubber band" lag
      lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1,
        syncTouch: false,
      });

      window.__lenis = lenis;
      setScrollDriven(true);
      lenis.on("scroll", (l: Lenis) => emitScroll(l.scroll));
      cleanups.push(() => setScrollDriven(false));

      // Dedicated unified animation loop
      let rafId: number;
      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      cleanups.push(() => {
        cancelAnimationFrame(rafId);
        lenis?.destroy();
        delete window.__lenis;
      });

      // Smooth internal anchor scrolling
      const handleAnchorClick = (e: MouseEvent) => {
        const target = (e.target as HTMLElement)?.closest('a[href^="#"]');
        if (!target) return;
        const href = target.getAttribute("href");
        if (!href || href === "#") return;

        const el = document.querySelector(href);
        if (el) {
          e.preventDefault();
          lenis?.scrollTo(el as HTMLElement, { offset: -72, duration: 1.1 });
        }
      };

      document.addEventListener("click", handleAnchorClick);
      cleanups.push(() => document.removeEventListener("click", handleAnchorClick));
    }

    // High-performance IntersectionObserver for entrance reveals
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );

    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    // Localized Card Spotlight (only active when hovering with mouse)
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const cards = document.querySelectorAll<HTMLElement>("[data-spot]");

      cards.forEach((card) => {
        const onCardMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
          card.style.setProperty("--my", `${e.clientY - rect.top}px`);
        };

        const onCardLeave = () => {
          card.style.setProperty("--mx", "-999px");
          card.style.setProperty("--my", "-999px");
        };

        card.addEventListener("mousemove", onCardMove, { passive: true });
        card.addEventListener("mouseleave", onCardLeave);

        cleanups.push(() => {
          card.removeEventListener("mousemove", onCardMove);
          card.removeEventListener("mouseleave", onCardLeave);
        });
      });
    }

    // Timeline progress tracker
    const timeline = document.querySelector<HTMLElement>("[data-progress]");
    if (timeline) {
      let ticking = false;
      let cachedTop = 0;
      let cachedHeight = 0;

      const measure = () => {
        const rect = timeline.getBoundingClientRect();
        cachedTop = rect.top + window.scrollY;
        cachedHeight = rect.height || 1;
      };

      measure();
      window.addEventListener("resize", measure, { passive: true });

      const onScrollUpdate = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollPos = window.scrollY + window.innerHeight * 0.6;
            const p = Math.min(1, Math.max(0, (scrollPos - cachedTop) / cachedHeight));
            timeline.style.setProperty("--progress", p.toFixed(3));
            ticking = false;
          });
          ticking = true;
        }
      };

      if (lenis) {
        lenis.on("scroll", onScrollUpdate);
        cleanups.push(() => lenis?.off("scroll", onScrollUpdate));
      } else {
        window.addEventListener("scroll", onScrollUpdate, { passive: true });
        cleanups.push(() => window.removeEventListener("scroll", onScrollUpdate));
      }

      cleanups.push(() => window.removeEventListener("resize", measure));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
