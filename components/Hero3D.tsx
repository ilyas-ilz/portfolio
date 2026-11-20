"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Hero3DProps {
  className?: string;
}

export default function Hero3D({ className = "" }: Hero3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let animationFrameId: number;
    let isVisible = true;

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 540;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 6.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.cursor = "grab";

    // --- Master Group ---
    const masterGroup = new THREE.Group();
    masterGroup.position.set(0, -2.5, 0);
    scene.add(masterGroup);

    // 1. Procedural High-Detail Planet Texture
    const createPlanetTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.Texture();

      // Deep ocean gradient
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
      oceanGrad.addColorStop(0, "#081329");
      oceanGrad.addColorStop(0.5, "#0b1d3a");
      oceanGrad.addColorStop(1, "#050d1e");
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, 1024, 512);

      // Continent landmass shapes
      ctx.fillStyle = "#1e3a5f";
      const landPatches = [
        { x: 200, y: 160, r: 120 },
        { x: 300, y: 220, r: 90 },
        { x: 180, y: 320, r: 80 },
        { x: 520, y: 170, r: 140 },
        { x: 640, y: 200, r: 110 },
        { x: 600, y: 330, r: 95 },
        { x: 800, y: 240, r: 130 },
        { x: 880, y: 310, r: 70 },
      ];

      for (const p of landPatches) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.filter = "blur(12px)";
        ctx.fill();
      }
      ctx.filter = "none";

      // Vibrant emerald-cyan coastal shelves
      ctx.fillStyle = "#00f0ff18";
      for (const p of landPatches) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 25, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cloud swirl bands
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.ellipse(
          (i * 130) % 1024,
          100 + (i * 38) % 320,
          140 + (i * 20),
          16 + (i % 3) * 8,
          0.15,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      return new THREE.CanvasTexture(canvas);
    };

    const planetTexture = createPlanetTexture();

    // 2. Planet Sphere Core with Custom Rim Shader
    const planetRadius = 3.5;
    const planetGeo = new THREE.SphereGeometry(planetRadius, 64, 64);

    const atmosphereVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const atmosphereFragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 uRimColor;
      uniform vec3 uCoreColor;
      uniform float uIntensity;

      void main() {
        vec3 viewDir = normalize(-vPosition);
        float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
        float rim = pow(fresnel, 2.8) * uIntensity;
        vec3 finalColor = mix(uCoreColor, uRimColor, rim);
        gl_FragColor = vec4(finalColor, min(1.0, 0.65 + rim * 0.9));
      }
    `;

    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uRimColor: { value: new THREE.Color(0x00f0ff) },
        uCoreColor: { value: new THREE.Color(0x0c1430) },
        uIntensity: { value: 1.85 },
      },
      transparent: true,
      blending: THREE.NormalBlending,
    });

    const planetMesh = new THREE.Mesh(planetGeo, atmosphereMat);
    masterGroup.add(planetMesh);

    // 2b. Outer Atmospheric Glow Aura (Fresnel Halo)
    const haloGeo = new THREE.SphereGeometry(planetRadius * 1.15, 48, 48);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 uHaloColor;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
          float alpha = pow(fresnel, 4.0) * 0.85;
          gl_FragColor = vec4(uHaloColor, alpha);
        }
      `,
      uniforms: {
        uHaloColor: { value: new THREE.Color(0x5ee7ff) },
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    masterGroup.add(haloMesh);

    // 3. Holographic Tech Network Shell (Connecting Nodes & Coordinate Lines)
    const techGeo = new THREE.IcosahedronGeometry(planetRadius * 1.05, 2);
    const techMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });
    const techMesh = new THREE.Mesh(techGeo, techMat);
    masterGroup.add(techMesh);

    // 4. Orbital Celestial Particle Ring 1 (Tilted Cyan / Aquamarine)
    const ring1Count = 340;
    const ring1Positions = new Float32Array(ring1Count * 3);
    const ring1Colors = new Float32Array(ring1Count * 3);
    const ring1Radius = 4.4;

    const colCyan = new THREE.Color(0x00f0ff);
    const colIndigo = new THREE.Color(0x818cf8);
    const colViolet = new THREE.Color(0xc084fc);

    for (let i = 0; i < ring1Count; i++) {
      const angle = (i / ring1Count) * Math.PI * 2;
      const spread = (Math.random() - 0.5) * 0.22;
      const r = ring1Radius + spread;
      ring1Positions[i * 3] = Math.cos(angle) * r;
      ring1Positions[i * 3 + 1] = (Math.random() - 0.5) * 0.14;
      ring1Positions[i * 3 + 2] = Math.sin(angle) * r;

      const pick = Math.random();
      const c = pick > 0.5 ? colCyan : pick > 0.25 ? colIndigo : colViolet;
      ring1Colors[i * 3] = c.r;
      ring1Colors[i * 3 + 1] = c.g;
      ring1Colors[i * 3 + 2] = c.b;
    }

    const ring1Geo = new THREE.BufferGeometry();
    ring1Geo.setAttribute("position", new THREE.BufferAttribute(ring1Positions, 3));
    ring1Geo.setAttribute("color", new THREE.BufferAttribute(ring1Colors, 3));

    // Particle sprite texture generator
    const makeParticleTexture = () => {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 64;
      const cx = c.getContext("2d");
      if (cx) {
        const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(255, 255, 255, 1)");
        g.addColorStop(0.35, "rgba(0, 240, 255, 0.85)");
        g.addColorStop(0.7, "rgba(192, 132, 252, 0.35)");
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        cx.fillStyle = g;
        cx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(c);
    };

    const particleTex = makeParticleTexture();

    const ring1Mat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      map: particleTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ring1Mesh = new THREE.Points(ring1Geo, ring1Mat);
    ring1Mesh.rotation.x = Math.PI / 3.4;
    ring1Mesh.rotation.z = Math.PI / 8;
    masterGroup.add(ring1Mesh);

    // 5. Intersecting Orbit Ring 2 (Purple / Neon Lavender)
    const ring2Count = 260;
    const ring2Positions = new Float32Array(ring2Count * 3);
    const ring2Colors = new Float32Array(ring2Count * 3);
    const ring2Radius = 5.0;

    for (let i = 0; i < ring2Count; i++) {
      const angle = (i / ring2Count) * Math.PI * 2;
      const spread = (Math.random() - 0.5) * 0.25;
      const r = ring2Radius + spread;
      ring2Positions[i * 3] = Math.cos(angle) * r;
      ring2Positions[i * 3 + 1] = (Math.random() - 0.5) * 0.16;
      ring2Positions[i * 3 + 2] = Math.sin(angle) * r;

      const pick = Math.random();
      const c = pick > 0.4 ? colViolet : colCyan;
      ring2Colors[i * 3] = c.r;
      ring2Colors[i * 3 + 1] = c.g;
      ring2Colors[i * 3 + 2] = c.b;
    }

    const ring2Geo = new THREE.BufferGeometry();
    ring2Geo.setAttribute("position", new THREE.BufferAttribute(ring2Positions, 3));
    ring2Geo.setAttribute("color", new THREE.BufferAttribute(ring2Colors, 3));

    const ring2Mat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      map: particleTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ring2Mesh = new THREE.Points(ring2Geo, ring2Mat);
    ring2Mesh.rotation.x = -Math.PI / 4.2;
    ring2Mesh.rotation.y = Math.PI / 4.5;
    masterGroup.add(ring2Mesh);

    // 6. Orbiting Communication Satellite & Laser Beacon
    const satelliteGroup = new THREE.Group();
    masterGroup.add(satelliteGroup);

    const satBodyGeo = new THREE.BoxGeometry(0.12, 0.08, 0.16);
    const satBodyMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const satBody = new THREE.Mesh(satBodyGeo, satBodyMat);

    const satWingGeo = new THREE.BoxGeometry(0.36, 0.01, 0.1);
    const satWingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const satWing = new THREE.Mesh(satWingGeo, satWingMat);

    satelliteGroup.add(satBody);
    satelliteGroup.add(satWing);

    // Satellite Light Beacon
    const satLight = new THREE.PointLight(0x00f0ff, 2.5, 3.5);
    satelliteGroup.add(satLight);

    // 7. Kinetic Shockwave Warp Ring
    const shockwaveGeo = new THREE.RingGeometry(0.1, 0.22, 64);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwaveMesh.rotation.x = Math.PI / 2;
    masterGroup.add(shockwaveMesh);

    let shockwaveActive = false;
    let shockwaveScale = 1;
    let shockwaveOpacity = 0;

    // --- Mouse Drag, Rotation & Inertia ---
    const mouse = {
      isDown: false,
      prevX: 0,
      prevY: 0,
      velX: 0,
      velY: 0,
      targetRotX: 0.12,
      targetRotY: 0,
    };

    const handlePointerDown = (e: PointerEvent) => {
      mouse.isDown = true;
      mouse.prevX = e.clientX;
      mouse.prevY = e.clientY;
      renderer.domElement.style.cursor = "grabbing";
      setIsInteracting(true);

      // Trigger cosmic kinetic pulse shockwave
      shockwaveActive = true;
      shockwaveScale = 0.5;
      shockwaveOpacity = 1.0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!mouse.isDown) return;
      const dx = e.clientX - mouse.prevX;
      const dy = e.clientY - mouse.prevY;
      mouse.velY = dx * 0.0055;
      mouse.velX = dy * 0.0055;
      mouse.targetRotY += mouse.velY;
      mouse.targetRotX += mouse.velX;
      mouse.prevX = e.clientX;
      mouse.prevY = e.clientY;
    };

    const handlePointerUp = () => {
      mouse.isDown = false;
      renderer.domElement.style.cursor = "grab";
      setIsInteracting(false);
    };

    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // Visibility observer
    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    io.observe(container);

    // --- Render Loop ---
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = (performance.now() - startTime) * 0.001;

      // Idle planet spin
      if (!mouse.isDown) {
        mouse.targetRotY += 0.0022;
        mouse.velX *= 0.94;
        mouse.velY *= 0.94;
        mouse.targetRotX += mouse.velX;
        mouse.targetRotY += mouse.velY;
      }

      // Smooth rotation damping
      masterGroup.rotation.y += (mouse.targetRotY - masterGroup.rotation.y) * 0.08;
      masterGroup.rotation.x += (mouse.targetRotX - masterGroup.rotation.x) * 0.08;

      // Rotate tech shell independently
      techMesh.rotation.y = -elapsed * 0.04;
      techMesh.rotation.z = elapsed * 0.02;

      // Rotate particle rings
      ring1Mesh.rotation.y = elapsed * 0.06;
      ring2Mesh.rotation.z = -elapsed * 0.045;

      // Orbit Satellite
      const satOrbitRadius = 4.3;
      const satAngle = elapsed * 0.65;
      satelliteGroup.position.set(
        Math.cos(satAngle) * satOrbitRadius,
        Math.sin(satAngle * 1.5) * 0.55,
        Math.sin(satAngle) * satOrbitRadius
      );
      satelliteGroup.rotation.y = satAngle + Math.PI / 2;

      // Handle shockwave expansion
      if (shockwaveActive) {
        shockwaveScale += 0.08;
        shockwaveOpacity -= 0.025;
        shockwaveMesh.scale.set(shockwaveScale, shockwaveScale, shockwaveScale);
        shockwaveMat.opacity = Math.max(0, shockwaveOpacity);
        if (shockwaveOpacity <= 0) {
          shockwaveActive = false;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      ro.disconnect();
      io.disconnect();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      planetGeo.dispose();
      haloGeo.dispose();
      techGeo.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      shockwaveGeo.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className={`hero-3d-canvas-wrap ${className}`}>
      {/* The astronaut is rendered once by Hero.tsx for every planet mode. */}

      {/* Orbit Telemetry Badge */}
      <div className="hero-orbit-hud">
        <span className="hud-dot" />
        <span className="hud-text">
          {isInteracting ? "ORBITAL ANGLE LOCKED // ROTATING" : "CELESTIAL CORE // DRAG TO ROTATE"}
        </span>
      </div>
    </div>
  );
}
