import * as THREE from "three";
import { softDotTexture } from "./model";

/**
 * Small pool of world-space exhaust puffs. They are emitted at the nozzle
 * exits along the jet direction and keep their own position, so they trail
 * behind the astronaut. `shift` lets the caller compensate for the canvas
 * itself moving across the screen, so trails also lag behind screen motion.
 */

const PUFFS = 48;
const PUFF_LIFE = 0.55;

export interface Exhaust {
  step: (dt: number, thrust: number, shiftX: number, shiftY: number) => void;
  clear: () => void;
  dispose: () => void;
}

export function createExhaust(scene: THREE.Scene, body: THREE.Object3D, nozzles: THREE.Object3D[]): Exhaust {
  const pos = new Float32Array(PUFFS * 3);
  // RGBA: the alpha channel must fade with the puff. With RGB only, a fading
  // (or dead) puff still writes the sprite's alpha into the transparent canvas
  // and shows up as a dark speck over the page.
  const col = new Float32Array(PUFFS * 4);
  const vel = new Float32Array(PUFFS * 3);
  const life = new Float32Array(PUFFS);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 4));
  const tex = softDotTexture();
  const mat = new THREE.PointsMaterial({
    size: 0.9,
    map: tex,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  let next = 0;
  let acc = 0;
  let alive = 0;
  const tmpV = new THREE.Vector3();
  const tmpD = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();

  const step = (dt: number, thrust: number, shiftX: number, shiftY: number) => {
    if (thrust > 0.2) {
      acc += dt * 46 * thrust;
      body.getWorldQuaternion(tmpQ);
      tmpD.set(0, -1, 0).applyQuaternion(tmpQ);
      while (acc >= 1) {
        acc -= 1;
        const nz = nozzles[next & 1];
        nz.getWorldPosition(tmpV).addScaledVector(tmpD, 0.4);
        const i = next % PUFFS;
        next++;
        pos[i * 3] = tmpV.x;
        pos[i * 3 + 1] = tmpV.y;
        pos[i * 3 + 2] = tmpV.z;
        const sp = 1.6 + Math.random() * 1.1 * thrust;
        vel[i * 3] = tmpD.x * sp + (Math.random() - 0.5) * 0.4;
        vel[i * 3 + 1] = tmpD.y * sp + (Math.random() - 0.5) * 0.4;
        vel[i * 3 + 2] = tmpD.z * sp + (Math.random() - 0.5) * 0.4;
        life[i] = PUFF_LIFE * (0.6 + Math.random() * 0.4) * (0.6 + thrust * 0.4);
      }
    } else {
      acc = 0;
    }
    if (next === 0) return;

    alive = 0;
    const drag = Math.max(0, 1 - dt * 2.5);
    for (let i = 0; i < PUFFS; i++) {
      const k = i * 3;
      const c = i * 4;
      if (life[i] <= 0) {
        col[c] = col[c + 1] = col[c + 2] = col[c + 3] = 0;
        continue;
      }
      alive++;
      life[i] = Math.max(0, life[i] - dt);
      vel[k] *= drag;
      vel[k + 1] *= drag;
      vel[k + 2] *= drag;
      pos[k] += vel[k] * dt + shiftX;
      pos[k + 1] += vel[k + 1] * dt + shiftY;
      pos[k + 2] += vel[k + 2] * dt;
      // white-hot core → cyan, fading out through alpha (colour and coverage together)
      const f = life[i] / PUFF_LIFE;
      col[c] = 0.35 + 0.5 * f;
      col[c + 1] = 0.92;
      col[c + 2] = 1.0;
      col[c + 3] = f;
    }
    points.visible = alive > 0;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  };

  const clear = () => {
    life.fill(0);
    col.fill(0);
    acc = 0;
    points.visible = false;
    geo.attributes.color.needsUpdate = true;
  };

  return {
    step,
    clear,
    dispose: () => {
      scene.remove(points);
      geo.dispose();
      mat.dispose();
      tex.dispose();
    },
  };
}
