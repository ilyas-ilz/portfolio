import * as THREE from "three";

/**
 * Procedural cartoon astronaut (no model download): toon shading +
 * inverted-hull outlines. Every joint is a real pivot group.
 * The jetpack carries the detail that matters from behind: tanks, vents,
 * twin engines with glowing nozzles, flames and soft glow sprites.
 */

export interface Limb {
  pivot: THREE.Group;
  joint: THREE.Group;
}

export interface AstronautRig {
  /** whole-body transform (orientation + flight offset) */
  flight: THREE.Group;
  /** bob / pose root inside `flight` */
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  armL: Limb;
  armR: Limb;
  legL: Limb;
  legR: Limb;
  laptop: THREE.Group;
  led: THREE.Mesh;
  nozzles: THREE.Object3D[];
  flames: THREE.Mesh[];
  /** additive glow billboards at the nozzle exits */
  jetGlows: THREE.Sprite[];
  /** emissive inner rings of the engines */
  engineCores: THREE.MeshBasicMaterial;
  disposables: Array<{ dispose: () => void }>;
}

function toonGradient(): THREE.DataTexture {
  const data = new Uint8Array([90, 170, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

/** Soft round sprite used for exhaust puffs and engine glow. */
export function softDotTexture(): THREE.DataTexture {
  const n = 32;
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const d = Math.hypot(x - n / 2 + 0.5, y - n / 2 + 0.5) / (n / 2);
      const a = Math.max(0, 1 - d);
      const i = (y * n + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(a * a * 255);
    }
  }
  const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

export function buildAstronaut(scene: THREE.Scene): AstronautRig {
  const grad = toonGradient();
  const disposables: Array<{ dispose: () => void }> = [grad];
  const track = <T extends { dispose: () => void }>(d: T): T => {
    disposables.push(d);
    return d;
  };
  const mat = (color: number) => track(new THREE.MeshToonMaterial({ color, gradientMap: grad }));
  const outlineMat = track(new THREE.MeshBasicMaterial({ color: 0x1a0d33, side: THREE.BackSide }));

  const white = mat(0xf4f6ff);
  const grey = mat(0xb9bfd6);
  const darkGrey = mat(0x7d84a3);
  const purple = mat(0x6d4bd8);
  const visorMat = track(
    new THREE.MeshStandardMaterial({ color: 0x2a1650, roughness: 0.15, metalness: 0.6, emissive: 0x1b0b3a, emissiveIntensity: 0.6 }),
  );
  const glow = track(new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
  const shineMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
  const engineCores = track(new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));

  const mesh = (geo: THREE.BufferGeometry, m: THREE.Material, outline = 1.06) => {
    track(geo);
    const me = new THREE.Mesh(geo, m);
    if (outline) {
      const o = new THREE.Mesh(geo, outlineMat);
      o.scale.setScalar(outline);
      me.add(o);
    }
    return me;
  };

  const flight = new THREE.Group();
  flight.position.y = -1.2;
  scene.add(flight);
  const root = new THREE.Group();
  flight.add(root);
  const body = new THREE.Group();
  root.add(body);

  // torso + belt + chest light
  const torso = mesh(new THREE.CapsuleGeometry(0.62, 0.55, 6, 16), white);
  torso.position.y = -0.35;
  body.add(torso);
  const belt = mesh(new THREE.TorusGeometry(0.6, 0.09, 8, 24), grey, 0);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = -0.62;
  body.add(belt);
  const panel = mesh(new THREE.BoxGeometry(0.42, 0.3, 0.12), grey, 1.08);
  panel.position.set(0, -0.2, 0.58);
  body.add(panel);
  const led = mesh(new THREE.SphereGeometry(0.06, 10, 10), glow, 0);
  led.position.set(-0.1, -0.18, 0.66);
  body.add(led);
  const led2 = mesh(new THREE.SphereGeometry(0.05, 10, 10), purple, 0);
  led2.position.set(0.1, -0.18, 0.66);
  body.add(led2);

  // backpack: main pack, twin fuel tanks, vent strip and status light (visible from behind)
  const pack = mesh(new THREE.BoxGeometry(1.0, 1.0, 0.45), grey, 1.05);
  pack.position.set(0, -0.25, -0.62);
  body.add(pack);
  for (const x of [-0.26, 0.26]) {
    const tank = mesh(new THREE.CapsuleGeometry(0.16, 0.55, 4, 12), white, 1.08);
    tank.position.set(x, -0.22, -0.9);
    body.add(tank);
    const band = mesh(new THREE.TorusGeometry(0.165, 0.035, 6, 16), purple, 0);
    band.rotation.x = Math.PI / 2;
    band.position.set(x, -0.05, -0.9);
    body.add(band);
  }
  const vent = mesh(new THREE.BoxGeometry(0.16, 0.5, 0.06), darkGrey, 1.1);
  vent.position.set(0, -0.25, -0.86);
  body.add(vent);
  const packLed = mesh(new THREE.SphereGeometry(0.045, 8, 8), glow, 0);
  packLed.position.set(0, 0.12, -0.9);
  body.add(packLed);

  // twin engines: nozzle bell, glowing core, flame cone, glow sprite
  const flames: THREE.Mesh[] = [];
  const nozzles: THREE.Object3D[] = [];
  const jetGlows: THREE.Sprite[] = [];
  const glowTex = track(softDotTexture());
  for (const x of [-0.28, 0.28]) {
    const nozzle = mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.24, 14), purple, 1.08);
    nozzle.position.set(x, -0.86, -0.66);
    body.add(nozzle);
    nozzles.push(nozzle);
    const core = mesh(new THREE.CircleGeometry(0.1, 14), engineCores, 0);
    core.rotation.x = Math.PI / 2;
    core.position.set(x, -0.985, -0.66);
    body.add(core);

    const flameMat = track(
      new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    const flame = mesh(new THREE.ConeGeometry(0.12, 0.7, 12), flameMat, 0);
    flame.rotation.x = Math.PI;
    flame.position.set(x, -1.3, -0.66);
    body.add(flame);
    flames.push(flame);

    const glowMat = track(
      new THREE.SpriteMaterial({ map: glowTex, color: 0x38e1ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    const sprite = new THREE.Sprite(glowMat);
    sprite.position.set(x, -1.08, -0.66);
    sprite.scale.setScalar(0.001);
    body.add(sprite);
    jetGlows.push(sprite);
  }

  // head: helmet, visor, shine, ear pods, collar
  const head = new THREE.Group();
  head.position.y = 0.55;
  body.add(head);
  const helmet = mesh(new THREE.SphereGeometry(1, 32, 24), white, 1.04);
  helmet.position.y = 0.75;
  head.add(helmet);
  const visor = mesh(new THREE.SphereGeometry(0.8, 32, 24), visorMat, 0);
  visor.scale.set(1.02, 0.8, 0.5);
  visor.position.set(0, 0.74, 0.62);
  head.add(visor);
  // glass reflection: a slim streak + a small glint, sitting on the visor surface
  // (not floating in front of it, so it reads as a reflection from every angle)
  const shine = mesh(new THREE.SphereGeometry(0.16, 12, 10), shineMat, 0);
  shine.scale.set(0.42, 1.25, 0.2);
  shine.position.set(-0.4, 0.96, 0.925);
  shine.rotation.set(-0.35, -0.4, 0.55);
  head.add(shine);
  const shine2 = mesh(new THREE.SphereGeometry(0.045, 10, 8), shineMat, 0);
  shine2.position.set(-0.2, 1.13, 0.925);
  head.add(shine2);
  for (const x of [-1, 1]) {
    const pod = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 20), purple, 1.08);
    pod.rotation.z = Math.PI / 2;
    pod.position.set(x * 0.98, 0.75, 0);
    head.add(pod);
  }
  const collar = mesh(new THREE.TorusGeometry(0.55, 0.13, 10, 28), grey, 1.06);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = -0.05;
  head.add(collar);

  // limbs: pivot groups so rotations happen at the joints
  const limb = (side: 1 | -1, isArm: boolean): Limb => {
    const pivot = new THREE.Group();
    pivot.position.set(side * (isArm ? 0.72 : 0.3), isArm ? 0.05 : -0.95, 0);
    body.add(pivot);
    const upper = mesh(new THREE.CapsuleGeometry(isArm ? 0.2 : 0.24, isArm ? 0.38 : 0.34, 4, 12), white);
    upper.position.y = isArm ? -0.32 : -0.34;
    pivot.add(upper);
    const joint = new THREE.Group();
    joint.position.y = isArm ? -0.66 : -0.7;
    pivot.add(joint);
    const lower = mesh(new THREE.CapsuleGeometry(isArm ? 0.18 : 0.22, 0.26, 4, 12), white);
    lower.position.y = -0.26;
    joint.add(lower);
    const end = isArm ? mesh(new THREE.SphereGeometry(0.21, 14, 12), grey) : mesh(new THREE.BoxGeometry(0.42, 0.24, 0.55), grey, 1.07);
    end.position.set(0, isArm ? -0.56 : -0.58, isArm ? 0 : 0.08);
    joint.add(end);
    if (!isArm) {
      // boot sole: darker plate, reads clearly when the soles face the viewer
      const sole = mesh(new THREE.BoxGeometry(0.44, 0.06, 0.57), darkGrey, 0);
      sole.position.set(0, -0.72, 0.08);
      joint.add(sole);
    }
    return { pivot, joint };
  };
  const armL = limb(-1, true);
  const armR = limb(1, true);
  const legL = limb(-1, false);
  const legR = limb(1, false);

  // laptop prop (shown in the "laptop" pose). Built lid-at-the-back, then turned
  // around so the lid stands at the far edge and the display faces the astronaut.
  const laptop = new THREE.Group();
  laptop.position.set(0, -0.9, 1.05);
  laptop.rotation.y = Math.PI;
  body.add(laptop);
  const base = mesh(new THREE.BoxGeometry(1.1, 0.06, 0.7), grey, 1.06);
  laptop.add(base);
  const screen = mesh(new THREE.BoxGeometry(1.1, 0.7, 0.05), purple, 1.06);
  screen.position.set(0, 0.35, -0.33);
  screen.rotation.x = -0.25;
  laptop.add(screen);
  const display = mesh(new THREE.PlaneGeometry(0.95, 0.55), glow, 0);
  display.position.set(0, 0.36, -0.29);
  display.rotation.x = -0.25;
  laptop.add(display);

  return { flight, root, body, head, armL, armR, legL, legR, laptop, led, nozzles, flames, jetGlows, engineCores, disposables };
}
