/**
 * One scroll signal for the whole page.
 *
 * Motion.tsx emits from inside Lenis' own animation frame, so anything that
 * subscribes here updates in the SAME frame the page moves — no one-frame lag
 * between the scroll position and scroll-linked transforms (that lag is what
 * makes sticky/stacked effects look jittery).
 * Without Lenis (reduced motion) it falls back to native scroll events.
 */
type Listener = (scrollY: number) => void;

const listeners = new Set<Listener>();
let driven = false;
let nativeBound = false;
let rafId = 0;

function nativeTick(): void {
  rafId = 0;
  emitScroll(window.scrollY);
}

function onNativeScroll(): void {
  if (driven || rafId) return;
  rafId = requestAnimationFrame(nativeTick);
}

export function emitScroll(y: number): void {
  for (const fn of listeners) fn(y);
}

/** Called by Motion once Lenis is running; native fallback is then ignored. */
export function setScrollDriven(value: boolean): void {
  driven = value;
}

export function onScroll(fn: Listener): () => void {
  listeners.add(fn);
  if (!nativeBound && typeof window !== "undefined") {
    window.addEventListener("scroll", onNativeScroll, { passive: true });
    nativeBound = true;
  }
  return () => {
    listeners.delete(fn);
  };
}
