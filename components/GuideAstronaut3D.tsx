"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { createExhaust } from "@/lib/astronaut/exhaust";
import {
  CHANNELS,
  FIGURE_ASPECT,
  indexAt,
  measureFlight,
  poseAt,
  progressAt,
  sampleFlight,
  type FlightLayout,
  type FlightMode,
  type FlightState,
} from "@/lib/astronaut/flightPath";
import { buildAstronaut } from "@/lib/astronaut/model";
import { BASE, cruiseJoints, JOINT_KEYS, poseJoints, type Joints } from "@/lib/astronaut/poses";
import { onScroll } from "@/lib/scrollBus";

/**
 * Guide astronaut: one real-time 3D character that flies through the page.
 *
 * A single requestAnimationFrame loop drives everything from one scroll-mapped
 * timeline (lib/astronaut/flightPath): screen position inside the free lane
 * next to the content, size, body orientation (front → three-quarter → side →
 * rear three-quarter → rear), limb pose, jet power and exhaust. The stage is
 * moved with a compositor-only transform, so the WebGL canvas never re-lays
 * out, and the HUD (progress badge + card) is positioned by the same loop.
 */

export interface FlightSectionInfo {
  index: number;
  total: number;
  id: string;
}

export interface FlightLayoutInfo {
  mode: FlightMode;
  laneWidth: number;
  order: string[];
}

interface Props {
  sections: readonly string[];
  /** element inside the first section the hero position keeps clear of */
  headSelector?: string;
  hudRef: RefObject<HTMLDivElement | null>;
  cardRef: RefObject<HTMLDivElement | null>;
  onSection: (info: FlightSectionInfo) => void;
  onLayout?: (info: FlightLayoutInfo) => void;
}

/** helmet width as a fraction of the canvas width (camera framing below) */
const FIG_FRAC = 0.31;
const CANVAS_ASPECT = 1.15; // height / width
const VIEW_H = 2 * 16 * Math.tan(THREE.MathUtils.degToRad(14)); // world units visible at z = 0

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
/** smooth 0 → 1 while x goes from a to b */
const band = (x: number, a: number, b: number) => smooth((x - a) / (b - a));

/** end-of-page fly-off: smallest scale reached and how far it climbs (in figure widths) */
const VANISH_DEPTH = 0.94;
const VANISH_RISE = 1.3;
const climb = (s: FlightState, v: number) => s.y - v * s.size * VANISH_RISE;

/**
 * Way back (scrolling up): instead of replaying the down-scroll flight in
 * reverse (flying backwards), he turns round through the side profile and
 * faces the viewer, flying back toward you. Held until the visitor scrolls down.
 */
const TURN_V = 60; // px/s of scroll that counts as a direction change
const COME_YAW = -0.3; // three-quarter front, looking toward the content
const COME_PITCH = 0.25; // leaning into the flight, toward the viewer

export default function GuideAstronaut3D({ sections, headSelector, hudRef, cardRef, onSection, onLayout }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const twinkleRef = useRef<HTMLSpanElement>(null);
  const cb = useRef({ onSection, onLayout });
  cb.current = { onSection, onLayout };

  useEffect(() => {
    const stage = stageRef.current;
    const wrap = wrapRef.current;
    const twinkle = twinkleRef.current;
    if (!stage || !wrap || !twinkle) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    wrap.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1 / CANVAS_ASPECT, 0.1, 50);
    camera.position.set(0, -0.9, 16);
    camera.lookAt(0, -1.25, 0);

    scene.add(new THREE.HemisphereLight(0xcff8ff, 0x2a1450, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x00f0ff, 1.6);
    rim.position.set(4, 1, -3);
    scene.add(rim);
    // back light so the jetpack side is readable once the astronaut turns away
    const back = new THREE.DirectionalLight(0xc4b5fd, 0.9);
    back.position.set(-2, 2, -6);
    scene.add(back);

    const rig = buildAstronaut(scene);
    const exhaust = createExhaust(scene, rig.body, rig.nozzles);
    const coreDim = new THREE.Color(0x1d3a52);
    const coreHot = new THREE.Color(0x9ff6ff);

    /* ---------------- layout ---------------- */
    let layout: FlightLayout | null = null;
    let stageW = 0;
    let stageH = 0;
    let lastIndex = -1;

    const measure = () => {
      const next = measureFlight(sections, headSelector);
      if (!next) return;
      layout = next;
      const w = Math.round(next.maxSize / FIG_FRAC);
      const h = Math.round(w * CANVAS_ASPECT);
      if (w !== stageW || h !== stageH) {
        stageW = w;
        stageH = h;
        stage.style.width = `${w}px`;
        stage.style.height = `${h}px`;
        renderer.setSize(w, h, false);
      }
      cb.current.onLayout?.({ mode: next.mode, laneWidth: next.laneWidth, order: next.ids });
      lastIndex = -1; // re-announce the active section after a re-layout
    };

    /* ---------------- scroll ---------------- */
    let scrollY = window.scrollY;
    const offScroll = onScroll((y) => {
      scrollY = y;
      if (reduce) requestStill();
    });

    /* ---------------- pointer: head follows the cursor ---------------- */
    let px = 0;
    let py = 0;
    const onPointer = (e: PointerEvent) => {
      px = Math.max(-1, Math.min(1, (e.clientX - window.innerWidth * 0.5) / (window.innerWidth * 0.5)));
      py = Math.max(-1, Math.min(1, (e.clientY - window.innerHeight * 0.5) / (window.innerHeight * 0.5)));
    };
    if (!reduce) window.addEventListener("pointermove", onPointer, { passive: true });

    /* ---------------- shared state ---------------- */
    const goal = Object.fromEntries(CHANNELS.map((c) => [c, 0])) as FlightState;
    const cur: FlightState = { ...goal };
    const joints: Joints = { ...BASE };
    let primed = false;

    const qYaw = new THREE.Quaternion();
    const qPitch = new THREE.Quaternion();
    const qTilt = new THREE.Quaternion();
    const qBank = new THREE.Quaternion();
    const AX = new THREE.Vector3(1, 0, 0);
    const AY = new THREE.Vector3(0, 1, 0);
    const AZ = new THREE.Vector3(0, 0, 1);

    const orient = (yaw: number, pitch: number, tilt: number, bank: number) => {
      qYaw.setFromAxisAngle(AY, yaw);
      qPitch.setFromAxisAngle(AX, pitch); // body frame: lean into the direction it faces
      qTilt.setFromAxisAngle(AX, tilt); // world frame: toward / away from the viewer
      qBank.setFromAxisAngle(AZ, bank); // world frame: screen-plane roll
      rig.flight.quaternion.copy(qBank).multiply(qTilt).multiply(qYaw).multiply(qPitch);
    };

    const applyJoints = (look: number) => {
      rig.root.position.y = joints.rootY;
      rig.head.rotation.set(joints.headRx + py * 0.25 * look, joints.headRy + px * 0.55 * look, 0);
      rig.armL.pivot.rotation.set(joints.armLx, 0, joints.armLz);
      rig.armL.joint.rotation.x = joints.foreL;
      rig.armR.pivot.rotation.set(joints.armRx, 0, joints.armRz);
      rig.armR.joint.rotation.x = joints.foreR;
      rig.legL.pivot.rotation.x = joints.legLx;
      rig.legL.joint.rotation.x = joints.shinL;
      rig.legR.pivot.rotation.x = joints.legRx;
      rig.legR.joint.rotation.x = joints.shinR;
      rig.laptop.visible = joints.laptop > 0.05;
      rig.laptop.scale.setScalar(Math.max(0.001, joints.laptop));
    };

    const applyJets = (thrust: number, t: number) => {
      const flicker = 0.85 + Math.sin(t * 47) * 0.08 + Math.random() * 0.12;
      for (const f of rig.flames) {
        f.visible = thrust > 0.08;
        const wide = 0.75 + thrust * 0.45;
        f.scale.set(wide, thrust * (0.9 + thrust * 0.6) * flicker, wide);
      }
      for (const g of rig.jetGlows) {
        g.scale.setScalar(0.25 + thrust * 0.95 * flicker);
        g.material.opacity = 0.25 + thrust * 0.6;
      }
      rig.engineCores.color.copy(coreDim).lerp(coreHot, clamp01(0.25 + thrust));
    };

    /** Place stage + HUD. Card placement reads its size first (no layout thrash). */
    const placeDom = (x: number, y: number, size: number, lean: number, bobX: number, bobY: number) => {
      if (!layout) return;
      const scale = size / layout.maxSize;
      stage.style.transform = `translate3d(${(x - stageW / 2 + bobX).toFixed(1)}px, ${(y - stageH / 2 + bobY).toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
      const hud = hudRef.current;
      if (!hud) return;
      // a leaning / receding body is shorter on screen: keep the badge right under the boots
      const visible = Math.max(0.5, Math.cos(Math.min(1.3, lean)));
      const feet = y + ((size * FIGURE_ASPECT) / 2) * visible;
      const card = cardRef.current;
      let cardX = 0;
      let cardY = 0;
      if (card && hud.dataset.open === "1") {
        const cw = card.offsetWidth;
        const ch = card.offsetHeight;
        const left = Math.min(layout.vw - cw - 12, Math.max(12, x - cw / 2));
        const below = feet + 40;
        const above = y - (size * FIGURE_ASPECT) / 2 - ch - 10;
        // keep clear of the back-to-top button (bottom ≤ 84px incl. its margin)
        const top = below + ch <= layout.vh - 96 ? below : Math.max(80, above);
        cardX = left - x;
        cardY = top - feet;
        card.style.transform = `translate3d(${cardX.toFixed(1)}px, ${cardY.toFixed(1)}px, 0)`;
      }
      hud.style.transform = `translate3d(${x.toFixed(1)}px, ${(feet + 6).toFixed(1)}px, 0)`;
    };

    /**
     * End of the page: the astronaut fades into the distance and leaves a
     * twinkling star where he vanished. The badge fades first and stops taking
     * taps. Returns false once he is fully gone (nothing left to render).
     */
    let lastFade = "";
    const applyVanish = (v: number, x: number, y: number) => {
      const fig = 1 - band(v, 0.78, 1);
      const hudA = 1 - band(v, 0.45, 0.8);
      const star = band(v, 0.8, 1);
      const key = `${fig.toFixed(3)}|${hudA.toFixed(3)}|${star.toFixed(3)}`;
      if (key !== lastFade) {
        lastFade = key;
        stage.style.opacity = fig.toFixed(3);
        twinkle.style.opacity = star.toFixed(3);
        twinkle.classList.toggle("is-on", star > 0);
        const hud = hudRef.current;
        if (hud) {
          hud.style.opacity = hudA.toFixed(3);
          hud.dataset.gone = hudA < 0.2 ? "1" : "0";
        }
      }
      if (star > 0) twinkle.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      return fig > 0.001;
    };

    const announce = (u: number) => {
      if (!layout) return;
      const idx = indexAt(layout, u);
      if (idx !== lastIndex) {
        lastIndex = idx;
        cb.current.onSection({ index: idx, total: layout.ids.length, id: layout.ids[idx] });
      }
    };

    /* ---------------- reduced motion: one still frame per section ---------------- */
    let stillQueued = 0;
    const renderStill = () => {
      stillQueued = 0;
      if (!layout) return;
      const u = progressAt(layout, scrollY);
      const idx = indexAt(layout, u);
      sampleFlight(layout, Math.min(layout.ids.length - 0.001, idx + 0.5), cur);
      Object.assign(joints, poseJoints(poseAt(layout, idx + 0.5), 0));
      orient(cur.yaw, cur.pitch * 0.5, cur.tilt, cur.bank);
      applyJoints(0);
      applyJets(cur.thrust * 0.5, 0);
      placeDom(cur.x, cur.y, cur.size, Math.abs(cur.pitch * 0.5) + Math.abs(cur.tilt), 0, 0);
      applyVanish(0, cur.x, cur.y); // still frames keep him visible (mid-section pose)
      announce(u);
      renderer.render(scene, camera);
    };
    function requestStill() {
      if (!stillQueued) stillQueued = requestAnimationFrame(renderStill);
    }

    /* ---------------- animation loop ---------------- */
    let raf = 0;
    let last = performance.now();
    const t0 = last;
    let prevScroll = scrollY;
    let vScroll = 0; // smoothed scroll velocity, px/s
    let prevX = 0;
    let prevY = 0;
    let vx = 0;
    let heading = 0; // 0 = down the page (designed timeline), 1 = way back up (facing the viewer)
    let headingGoal = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || !layout) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const t = (now - t0) / 1000;

      // scroll → timeline target
      const u = progressAt(layout, scrollY);
      sampleFlight(layout, u, goal);
      if (!primed) {
        Object.assign(cur, goal);
        prevX = cur.x;
        prevY = climb(cur, smooth(cur.vanish));
        primed = true;
      }
      const vRaw = (scrollY - prevScroll) / dt;
      prevScroll = scrollY;
      vScroll += (vRaw - vScroll) * (1 - Math.exp(-dt / 0.12));

      // one damping for every channel = scrubbed, cinematic follow (~0.4 s)
      const k = 1 - Math.exp(-dt / 0.4);
      for (const c of CHANNELS) cur[c] += (goal[c] - cur[c]) * k;
      // end of the page: fly off into depth (shrink + climb + fade); scroll-mapped, so it reverses
      const vanish = smooth(cur.vanish);
      const depth = 1 - vanish * VANISH_DEPTH;
      const sx = cur.x;
      const sy = climb(cur, vanish);
      vx += ((sx - prevX) / dt - vx) * (1 - Math.exp(-dt / 0.15));
      const dx = sx - prevX;
      const dy = sy - prevY;
      prevX = sx;
      prevY = sy;

      announce(u);

      // movement energy: fast scrolling = harder burn, deeper flight pose
      const boost = clamp01(Math.abs(vScroll) / 2400);
      const thrust = clamp01(cur.thrust + boost * 0.55);
      const fly = clamp01(cur.fly + boost * 0.35);

      // limbs: section pose ↔ cruise pose, blended by the same flight amount
      const target = poseJoints(poseAt(layout, u), t);
      const w = smooth(fly);
      if (w > 0) {
        const cruise = cruiseJoints(t, clamp01(thrust * 0.7 + boost * 0.5));
        for (const j of JOINT_KEYS) target[j] += (cruise[j] - target[j]) * w;
      }
      const kj = 1 - Math.pow(0.0015, dt);
      for (const j of JOINT_KEYS) joints[j] += (target[j] - joints[j]) * kj;

      // travel direction: scrolling up turns him round to face the way he is going
      if (vScroll < -TURN_V) headingGoal = 1;
      else if (vScroll > TURN_V) headingGoal = 0;
      // the further away he is, the faster he turns: coming back out of the star he has
      // already turned round, so the first visible frame faces the viewer
      const turnTau = 0.35 * (1 - vanish) + 0.03;
      heading += (headingGoal - heading) * (1 - Math.exp(-dt / turnTau));
      const back = smooth(heading);
      // straight at the viewer out of the distance, easing to three-quarter front up close
      const comeYaw = COME_YAW * (1 - vanish * 0.8);

      // orientation: timeline (or the way back) + zero-g sway + lean into the travel direction
      const sway = 1 - fly * 0.6;
      const yawBase = cur.yaw + (comeYaw - cur.yaw) * back;
      const pitchBase = cur.pitch + (COME_PITCH - cur.pitch) * back;
      const tilt = cur.tilt * (1 - back);
      const bankBase = cur.bank * (1 - back);
      const yaw = yawBase + Math.sin(t * 0.5) * 0.07 * sway;
      const pitch = pitchBase + boost * 0.22 + Math.sin(t * 0.9) * 0.03;
      const bank = bankBase + Math.max(-0.25, Math.min(0.25, -vx / 900)) + Math.sin(t * 0.7) * 0.04 * sway;
      orient(yaw, pitch, tilt, bank);

      // head tracks the cursor only while the visor faces the viewer
      const facing = clamp01(1 - (Math.abs(yawBase) - 0.5) / 0.7);
      applyJoints((1 - w) * facing);
      rig.led.visible = Math.sin(t * 4) > -0.3;
      applyJets(thrust, t);

      // exhaust trails stay put on screen while the stage moves
      const size = cur.size * depth;
      const ppu = ((size / layout.maxSize) * stageH) / VIEW_H;
      exhaust.step(dt, thrust, -dx / ppu, dy / ppu);

      const bobAmp = (1 - fly * 0.5) * depth;
      const lean = Math.abs(pitchBase) + Math.abs(tilt) + Math.abs(bankBase) * 0.5;
      placeDom(sx, sy, size, lean, Math.sin(t * 0.7) * 3 * bobAmp, Math.sin(t * 1.1) * 6 * bobAmp);
      if (applyVanish(vanish, sx, sy)) renderer.render(scene, camera);
    };

    measure();
    if (reduce) requestStill();
    else raf = requestAnimationFrame(frame);

    /* ---------------- re-measure on viewport or document size changes ---------------- */
    let measureQueued = 0;
    const queueMeasure = () => {
      if (measureQueued) return;
      measureQueued = requestAnimationFrame(() => {
        measureQueued = 0;
        measure();
        exhaust.clear();
        if (reduce) requestStill();
      });
    };
    const ro = new ResizeObserver(queueMeasure);
    ro.observe(document.body);
    window.addEventListener("resize", queueMeasure);
    window.addEventListener("load", queueMeasure);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(stillQueued);
      cancelAnimationFrame(measureQueued);
      offScroll();
      ro.disconnect();
      window.removeEventListener("resize", queueMeasure);
      window.removeEventListener("load", queueMeasure);
      window.removeEventListener("pointermove", onPointer);
      exhaust.dispose();
      rig.disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [sections, headSelector, hudRef, cardRef]);

  return (
    <>
      <div ref={stageRef} className="astro-stage" aria-hidden="true">
        <span className="astro-halo" />
        <div ref={wrapRef} className="astro3d" />
      </div>
      <span ref={twinkleRef} className="astro-twinkle" aria-hidden="true" />
    </>
  );
}
