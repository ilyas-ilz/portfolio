"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  depth: number;
  twinkle: number;
  phase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  len: number;
}

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Populate cosmic starfield
      const count = Math.min(280, Math.floor((width * height) / 5500));
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.5 + depth * 1.5,
          depth,
          twinkle: 0.4 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    resize();
    window.addEventListener("resize", resize);

    // Shooting star spawner
    let lastShootTime = 0;
    const maybeSpawnShootingStar = (time: number) => {
      if (time - lastShootTime > 3200 + Math.random() * 3000) {
        lastShootTime = time;
        const startX = Math.random() * width * 0.75;
        const startY = Math.random() * height * 0.35;
        const speed = 7 + Math.random() * 5;
        shootingStars.push({
          x: startX,
          y: startY,
          vx: speed,
          vy: speed * (0.35 + Math.random() * 0.28),
          life: 1,
          len: 90 + Math.random() * 90,
        });
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    let prevTime = performance.now();

    const render = (time: number) => {
      animId = requestAnimationFrame(render);
      if (!isVisible) return;
      // 30fps is plenty for twinkling stars and leaves frame budget for scrolling
      if (time - prevTime < 32) return;

      const dt = (time - prevTime) * 0.001;
      prevTime = time;

      maybeSpawnShootingStar(time);

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Twinkling Depth Stars with Parallax
      for (const s of stars) {
        const twinkleFactor = 0.5 + Math.sin(time * 0.002 * s.twinkle + s.phase) * 0.5;
        const offsetX = mouseX * s.depth * 28;
        const offsetY = mouseY * s.depth * 28;

        ctx.globalAlpha = (0.3 + s.depth * 0.7) * twinkleFactor;
        ctx.fillStyle = s.depth > 0.75 ? "#00f0ff" : s.depth > 0.45 ? "#ceb7ff" : "#dfe9ff";

        ctx.beginPath();
        ctx.arc(s.x + offsetX, s.y + offsetY, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      // 2. Draw Shooting Stars / Comets with Radiant Trailing Gradient
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const st = shootingStars[i];
        st.x += st.vx;
        st.y += st.vy;
        st.life -= 0.014;

        if (st.life <= 0 || st.x > width + 100 || st.y > height + 100) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = st.x - st.len;
        const tailY = st.y - st.len * (st.vy / st.vx);

        const grad = ctx.createLinearGradient(st.x, st.y, tailX, tailY);
        grad.addColorStop(0, `rgba(174, 240, 255, ${st.life * 0.95})`);
        grad.addColorStop(0.3, `rgba(192, 132, 252, ${st.life * 0.6})`);
        grad.addColorStop(1, "rgba(0, 240, 255, 0)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(st.x, st.y);
        ctx.stroke();

        // Glowing Comet Head
        ctx.fillStyle = `rgba(255, 255, 255, ${st.life})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div className="sky" aria-hidden="true">
      <div className="sky-nebula sky-nebula-a" />
      <div className="sky-nebula sky-nebula-b" />
      <div className="sky-nebula sky-nebula-c" />
      <canvas ref={canvasRef} id="starfield" className="sky-stars" />
    </div>
  );
}
