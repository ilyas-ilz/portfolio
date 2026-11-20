/**
 * Joint targets for the procedural astronaut.
 * Section poses (wave, laptop, ...) and the cruise flight pose are plain
 * joint tables; the render loop blends between them every frame.
 */

export type AstroPose = "idle" | "wave" | "laptop" | "cheer";

export interface Joints {
  rootY: number;
  headRx: number;
  headRy: number;
  armLx: number;
  armLz: number;
  foreL: number;
  armRx: number;
  armRz: number;
  foreR: number;
  legLx: number;
  shinL: number;
  legRx: number;
  shinR: number;
  laptop: number;
}

export const BASE: Joints = {
  rootY: 0,
  headRx: 0,
  headRy: 0,
  armLx: 0,
  armLz: -0.35,
  foreL: -0.3,
  armRx: 0,
  armRz: 0.35,
  foreR: -0.3,
  legLx: 0.1,
  shinL: 0.15,
  legRx: -0.05,
  shinR: 0.1,
  laptop: 0,
};

export const JOINT_KEYS = Object.keys(BASE) as Array<keyof Joints>;

/** Section pose at time t (seconds). Oscillations live here; blending happens in the loop. */
export function poseJoints(pose: AstroPose, t: number): Joints {
  const j: Joints = { ...BASE };
  j.rootY = Math.sin(t * 1.6) * 0.08;
  switch (pose) {
    case "wave":
      j.armRz = 2.5;
      j.armRx = -0.2;
      j.foreR = -0.5 + Math.sin(t * 7) * 0.45;
      j.armLz = -0.25;
      j.headRx = -0.05;
      break;
    case "laptop":
      j.armLx = -1.05;
      j.armRx = -1.05;
      j.armLz = -0.12;
      j.armRz = 0.12;
      j.foreL = -0.9 + Math.sin(t * 14) * 0.08;
      j.foreR = -0.9 + Math.sin(t * 14 + 1.7) * 0.08;
      j.headRx = 0.32;
      j.legLx = -1.25;
      j.shinL = 1.6;
      j.legRx = -1.25;
      j.shinR = 1.6;
      j.laptop = 1;
      break;
    case "cheer": {
      const pump = Math.abs(Math.sin(t * 3.2));
      j.armLz = -2.6 + pump * 0.3;
      j.armRz = 2.6 - pump * 0.3;
      j.foreL = -0.2;
      j.foreR = -0.2;
      j.rootY += pump * 0.18;
      j.legLx = -0.25 * pump;
      j.legRx = -0.25 * pump;
      j.shinL = 0.5 * pump;
      j.shinR = 0.5 * pump;
      j.headRx = -0.15;
      break;
    }
    default:
      // idle: slow zero-g drift with lazy limbs
      j.armLz = -0.45 - Math.sin(t * 1.3) * 0.08;
      j.armRz = 0.45 + Math.sin(t * 1.3 + 0.5) * 0.08;
      j.legLx = 0.15 + Math.sin(t * 1.1) * 0.08;
      j.legRx = -0.1 - Math.sin(t * 1.1) * 0.08;
  }
  return j;
}

/**
 * Cruise flight pose (body frame): arms swept back along the body, legs
 * trailing with knees bent so the backs of the legs and the boot soles face
 * backwards — exactly what the viewer sees once the astronaut turns away.
 * `effort` (0..1) deepens the sweep and the kick when the jets push harder.
 */
export function cruiseJoints(t: number, effort: number): Joints {
  const j: Joints = { ...BASE };
  const kick = Math.sin(t * (3 + effort * 3.5));
  const sway = Math.sin(t * 1.7);
  j.rootY = Math.sin(t * 1.3) * 0.05;
  // arms swept back along the body: streamlined and keeps the silhouette narrow
  j.armLz = -0.4 - effort * 0.14 - sway * 0.05;
  j.armRz = 0.4 + effort * 0.14 + sway * 0.05;
  j.armLx = 0.55 + effort * 0.2;
  j.armRx = 0.55 + effort * 0.2;
  j.foreL = -0.25;
  j.foreR = -0.25;
  j.legLx = 0.32 + kick * (0.08 + effort * 0.1);
  j.legRx = 0.26 - kick * (0.08 + effort * 0.1);
  j.shinL = 0.65 + Math.max(0, kick) * 0.25;
  j.shinR = 0.6 + Math.max(0, -kick) * 0.25;
  j.headRx = -0.12;
  return j;
}
