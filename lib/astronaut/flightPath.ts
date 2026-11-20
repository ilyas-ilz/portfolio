import { measureSections } from "../sectionTrack";
import type { AstroPose } from "./poses";

/**
 * Scroll-mapped flight timeline for the guide astronaut.
 *
 * The page is split into sections (DOM order). Scroll position maps to a
 * continuous progress value u = sectionIndex + localProgress. Each section
 * defines keyframes at local progress `a`; they are turned into absolute
 * screen positions (inside the free "lane" right of the content column) and
 * interpolated with monotone cubic splines, so the path never overshoots
 * and never jumps — in both scroll directions.
 *
 * Orientation convention (yaw): 0 = facing the viewer, -π/2 = side view
 * facing the content, -π = back to the viewer (jetpack visible).
 */

type LaneKind = "head" | "section";

interface Key {
  /** local progress inside the section, 0..1 */
  a: number;
  /** free zone to fly in; "head" = right of the hero title */
  lane?: LaneKind;
  /** 0 = inner edge of the lane, 1 = outer edge */
  fx: number;
  /** figure centre, fraction of viewport height */
  fy: number;
  /** size multiplier */
  s?: number;
  yaw: number;
  /** forward lean in the body frame */
  pitch: number;
  /** world-X tilt, negative = head away from the viewer */
  tilt?: number;
  /** screen-plane roll */
  bank?: number;
  /** 0 = section pose, 1 = cruise flight pose */
  fly: number;
  /** base jet power 0..1 */
  thrust: number;
  /** 0..1: flying off into depth at the end of the page (shrink, climb, fade) */
  vanish?: number;
  pose?: AstroPose;
}

const PI = Math.PI;

const SECTION_KEYS: Record<string, Key[]> = {
  // Home: big, front-facing, waving, barely drifting
  top: [
    { a: 0, lane: "head", fx: 0.5, fy: 0.42, s: 1.15, yaw: -0.12, pitch: 0, fly: 0.05, thrust: 0.15, pose: "wave" },
    { a: 0.15, lane: "head", fx: 0.5, fy: 0.45, s: 1.1, yaw: -0.2, pitch: 0.05, fly: 0.1, thrust: 0.2 },
    { a: 0.42, fx: 0.5, fy: 0.42, yaw: -0.3, pitch: 0.12, fly: 0.25, thrust: 0.3, pose: "idle" },
    { a: 0.8, fx: 0.55, fy: 0.36, yaw: -0.42, pitch: 0.22, fly: 0.45, thrust: 0.45 },
  ],
  // Projects: three-quarter view cruising a soft S-curve down the lane
  work: [
    { a: 0, fx: 0.5, fy: 0.34, yaw: -0.5, pitch: 0.22, bank: 0.04, fly: 0.65, thrust: 0.5 },
    { a: 0.25, fx: 0.25, fy: 0.5, yaw: -0.68, pitch: 0.26, bank: 0.08, fly: 0.75, thrust: 0.55 },
    { a: 0.5, fx: 0.75, fy: 0.6, yaw: -0.82, pitch: 0.22, bank: -0.05, fly: 0.75, thrust: 0.55 },
    { a: 0.75, fx: 0.3, fy: 0.46, yaw: -0.95, pitch: 0.26, bank: 0.07, fly: 0.75, thrust: 0.55 },
  ],
  // About: slows down, near side view, floating with the laptop
  about: [
    { a: 0, fx: 0.5, fy: 0.4, yaw: -1.05, pitch: 0.15, fly: 0.5, thrust: 0.4, pose: "idle" },
    { a: 0.3, fx: 0.5, fy: 0.46, yaw: -1.12, pitch: 0.05, fly: 0.25, thrust: 0.25, pose: "laptop" },
    { a: 0.7, fx: 0.45, fy: 0.48, yaw: -1.22, pitch: 0.05, fly: 0.25, thrust: 0.25 },
  ],
  // Skills: diagonal glide across the lane, body rolling into the turn
  skills: [
    { a: 0, fx: 0.85, fy: 0.3, yaw: -1.35, pitch: 0.2, bank: 0.08, fly: 0.8, thrust: 0.55, pose: "idle" },
    { a: 0.5, fx: 0.5, fy: 0.45, yaw: -1.55, pitch: 0.26, bank: 0.14, fly: 0.85, thrust: 0.6 },
    { a: 0.9, fx: 0.15, fy: 0.58, yaw: -1.72, pitch: 0.24, bank: 0.1, fly: 0.85, thrust: 0.6 },
  ],
  // Experience: keeps turning away — side, then rear three-quarter
  experience: [
    { a: 0, fx: 0.3, fy: 0.52, yaw: -1.82, pitch: 0.24, fly: 0.85, thrust: 0.6 },
    { a: 0.45, fx: 0.5, fy: 0.46, yaw: -2.25, pitch: 0.3, tilt: -0.08, fly: 0.9, thrust: 0.65 },
    { a: 0.85, fx: 0.6, fy: 0.42, yaw: -2.6, pitch: 0.34, tilt: -0.16, fly: 0.95, thrust: 0.7 },
  ],
  // Contact: full rear view, jets at full burn, climbing away into depth:
  // body axis points away from the viewer so boots, soles and flames face you.
  // The last stretch of the page flies him off into the distance until he vanishes.
  contact: [
    { a: 0, fx: 0.55, fy: 0.44, yaw: -2.8, pitch: 0.38, tilt: -0.25, bank: 0.05, fly: 1, thrust: 0.8 },
    { a: 0.4, fx: 0.45, fy: 0.4, s: 0.9, yaw: -3.02, pitch: 0.45, tilt: -0.45, bank: 0.14, fly: 1, thrust: 0.95 },
    { a: 0.62, fx: 0.42, fy: 0.36, s: 0.85, yaw: -PI, pitch: 0.5, tilt: -0.62, bank: 0.18, fly: 1, thrust: 1 },
    { a: 1, fx: 0.5, fy: 0.3, s: 0.85, yaw: -PI, pitch: 0.55, tilt: -0.85, bank: 0.1, fly: 1, thrust: 1, vanish: 1 },
  ],
};

const FALLBACK_KEYS: Key[] = [{ a: 0, fx: 0.5, fy: 0.45, yaw: -1, pitch: 0.2, fly: 0.5, thrust: 0.4, pose: "idle" }];

export const CHANNELS = ["x", "y", "size", "yaw", "pitch", "tilt", "bank", "fly", "thrust", "vanish"] as const;
export type Channel = (typeof CHANNELS)[number];
export type FlightState = Record<Channel, number>;

export type FlightMode = "lane" | "dock";

export interface FlightLayout {
  mode: FlightMode;
  vw: number;
  vh: number;
  ids: string[];
  /** scroll offset at which section i becomes the active one */
  starts: number[];
  maxScroll: number;
  /** width of the free lane next to the content (smallest across sections) */
  laneWidth: number;
  /** largest figure size on this layout (canvas is sized for it) */
  maxSize: number;
  keyU: number[];
  values: Record<Channel, number[]>;
  tangents: Record<Channel, number[]>;
  poses: Array<{ u: number; pose: AstroPose }>;
}

/** Figure height / figure width (helmet width), for keeping it inside the viewport. */
export const FIGURE_ASPECT = 2.1;

/** front / rear silhouette width in helmet widths (lane sizing; side views add spanK below) */
const FIGURE_SPAN = 1.32;
/**
 * Rendered silhouette extent from the figure centre, in helmet widths, measured
 * from the canvas pixels across the whole timeline (widest: 0.81 right of centre,
 * 1.17 below it) plus a small margin. Dock mode keeps this inside the viewport.
 */
const SIL_HALF_W = 0.86;
const BOB_X = 3; // horizontal zero-g bob amplitude in the render loop, px
const LANE_GAP = 10; // distance from content edge
const EDGE_GAP = 6; // distance from viewport edge
const MIN_LANE = 96; // narrower than this → dock mode
const MAX_FIG = 150;
const TOP_CLEAR = 86; // fixed nav
const BOTTOM_CLEAR = 116; // badge + back-to-top button
/**
 * Dock: boots end this far above the viewport bottom, leaving the badge a steady
 * gap above the back-to-top button (.to-top: bottom clamp(16px, 2.4vw, 32px), 52px tall).
 */
const dockBottom = (vw: number) => Math.min(32, Math.max(16, vw * 0.024)) + 106;

interface Lane {
  l: number;
  r: number;
}

function laneOf(el: Element | null, vw: number): Lane | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0) return null;
  const pr = parseFloat(getComputedStyle(el).paddingRight) || 0;
  return { l: r.right - pr + LANE_GAP, r: vw - EDGE_GAP };
}

const laneWidth = (lane: Lane) => Math.max(0, lane.r - lane.l);
const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

/** Measure the page and bake keyframes into absolute screen values. */
export function measureFlight(sectionIds: readonly string[], headSelector?: string): FlightLayout | null {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  // same section boundaries as the nav (lib/sectionTrack)
  const track = measureSections(sectionIds);
  if (!track) return null;
  const { starts, maxScroll } = track;
  const found = track.els.map((el) => ({ id: el.id, el }));

  const sectionLanes = found.map((s) => laneOf(s.el.querySelector(":scope > .container") ?? s.el, vw) ?? { l: vw, r: vw });
  const minLane = Math.min(...sectionLanes.map(laneWidth));
  const mode: FlightMode = minLane >= MIN_LANE ? "lane" : "dock";
  const headEl = headSelector ? found[0].el.querySelector(headSelector) : null;
  const headLane = laneOf(headEl, vw) ?? sectionLanes[0];

  const figFor = (lane: Lane) => Math.min(MAX_FIG, laneWidth(lane) / FIGURE_SPAN);
  // FIGURE_SPAN is the front / rear silhouette; see spanK below for side views
  // phones / tablets / small laptops have no free gutter: one stable spot in the
  // bottom-right corner, stacked above the back-to-top button, always fully visible
  // (the figure is click-through; only the small badge takes taps)
  const dockFig = vw < 640 ? 46 : 64;

  const keyU: number[] = [];
  const values = Object.fromEntries(CHANNELS.map((c) => [c, [] as number[]])) as Record<Channel, number[]>;
  const poses: Array<{ u: number; pose: AstroPose }> = [];
  let maxSize = 1;

  found.forEach((s, i) => {
    const keys = SECTION_KEYS[s.id] ?? FALLBACK_KEYS;
    for (const k of keys) {
      const u = i + Math.min(k.a, i === found.length - 1 ? 1 : 0.999);
      if (keyU.length && u <= keyU[keyU.length - 1]) continue;
      const mul = k.s ?? 1;
      let x: number;
      let y: number;
      let size: number;
      if (mode === "lane") {
        const lane = k.lane === "head" ? headLane : sectionLanes[i];
        // side views are wider (forward lean + trailing legs) than front / rear views
        const spanK = FIGURE_SPAN + 0.32 * Math.abs(Math.sin(k.yaw));
        size = Math.min(figFor(lane) * mul, laneWidth(lane) / spanK);
        const w = laneWidth(lane);
        const span = size * spanK;
        x = w > span ? lane.l + span / 2 + k.fx * (w - span) : (lane.l + lane.r) / 2;
        const half = (size * FIGURE_ASPECT) / 2;
        y = clamp(k.fy * vh, TOP_CLEAR + half, vh - BOTTOM_CLEAR - half);
      } else {
        size = dockFig * Math.max(0.8, mul);
        // right edge of the widest pose stays EDGE_GAP inside the viewport, bob included
        x = vw - EDGE_GAP - BOB_X - size * SIL_HALF_W;
        y = vh - dockBottom(vw) - (size * FIGURE_ASPECT) / 2;
      }
      maxSize = Math.max(maxSize, size);
      keyU.push(u);
      const row: FlightState = {
        x,
        y,
        size,
        yaw: k.yaw,
        pitch: k.pitch,
        tilt: k.tilt ?? 0,
        bank: k.bank ?? 0,
        fly: k.fly,
        thrust: k.thrust,
        vanish: k.vanish ?? 0,
      };
      for (const c of CHANNELS) values[c].push(row[c]);
      if (k.pose) poses.push({ u, pose: k.pose });
    }
  });

  const tangents = Object.fromEntries(CHANNELS.map((c) => [c, monotoneTangents(keyU, values[c])])) as Record<Channel, number[]>;

  return {
    mode,
    vw,
    vh,
    ids: found.map((s) => s.id),
    starts,
    maxScroll,
    laneWidth: mode === "lane" ? minLane : 0,
    maxSize,
    keyU,
    values,
    tangents,
    poses,
  };
}

/** Continuous progress u for a scroll offset. */
export function progressAt(layout: FlightLayout, scrollY: number): number {
  const { starts, maxScroll } = layout;
  let i = 0;
  while (i + 1 < starts.length && scrollY >= starts[i + 1]) i++;
  const end = i + 1 < starts.length ? starts[i + 1] : maxScroll;
  const span = Math.max(1, end - starts[i]);
  return i + Math.min(1, Math.max(0, (scrollY - starts[i]) / span));
}

/** Active section index (DOM order) for a progress value. */
export function indexAt(layout: FlightLayout, u: number): number {
  return Math.min(layout.ids.length - 1, Math.max(0, Math.floor(u)));
}

/** Section pose in effect at u (last pose keyframe at or before u). */
export function poseAt(layout: FlightLayout, u: number): AstroPose {
  let pose: AstroPose = "idle";
  for (const p of layout.poses) {
    if (p.u > u) break;
    pose = p.pose;
  }
  return pose;
}

/** Sample every channel at u into `out`. */
export function sampleFlight(layout: FlightLayout, u: number, out: FlightState): FlightState {
  const { keyU, values, tangents } = layout;
  const n = keyU.length;
  if (n === 1 || u <= keyU[0]) {
    for (const c of CHANNELS) out[c] = values[c][0];
    return out;
  }
  if (u >= keyU[n - 1]) {
    for (const c of CHANNELS) out[c] = values[c][n - 1];
    return out;
  }
  let k = 0;
  while (k + 1 < n && keyU[k + 1] <= u) k++;
  const h = keyU[k + 1] - keyU[k];
  const t = (u - keyU[k]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  for (const c of CHANNELS) {
    const v = values[c];
    const m = tangents[c];
    out[c] = h00 * v[k] + h10 * h * m[k] + h01 * v[k + 1] + h11 * h * m[k + 1];
  }
  return out;
}

/** Fritsch–Carlson tangents: C1-smooth and never overshoots the keyframes. */
function monotoneTangents(xs: number[], ys: number[]): number[] {
  const n = xs.length;
  const m = new Array<number>(n).fill(0);
  if (n < 2) return m;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      m[i] = tau * a * d[i];
      m[i + 1] = tau * b * d[i];
    }
  }
  return m;
}
