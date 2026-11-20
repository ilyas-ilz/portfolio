async (page) => {
  // Scrolls the whole page; at each stop reports the rendered silhouette box
  // (opaque canvas pixels), the badge box, badge text vs nav, and the gap to
  // the back-to-top button. Takes screenshots of the first stops.
  const tag = "m2-" + page.viewportSize().width;
  await page.reload();
  await page.waitForTimeout(2500);
  const maxS = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const vh = page.viewportSize().height;
  const out = [];
  let shot = 0;
  let worst = { right: Infinity, left: Infinity, top: Infinity, toTopGap: Infinity };
  for (let y = 0; y <= maxS + 1; y += Math.round(vh * 0.45)) {
    const yy = Math.min(y, maxS);
    await page.evaluate((y) => window.__lenis.scrollTo(y, { immediate: true }), yy);
    await page.waitForTimeout(1400);
    const info = await page.evaluate(
      () =>
        new Promise((done) => {
          requestAnimationFrame(() => {
            const c = document.querySelector(".astro3d canvas");
            const gl = c.getContext("webgl2");
            const w = gl.drawingBufferWidth;
            const h = gl.drawingBufferHeight;
            const px = new Uint8Array(w * h * 4);
            gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
            let l = w, r = -1, t = h, b = -1;
            for (let j = 0; j < h; j++)
              for (let i = 0; i < w; i++)
                if (px[(j * w + i) * 4 + 3] > 200) {
                  if (i < l) l = i;
                  if (i > r) r = i;
                  const s = h - 1 - j;
                  if (s < t) t = s;
                  if (s > b) b = s;
                }
            const st = document.querySelector(".astro-stage").getBoundingClientRect();
            const sx = (v) => st.left + (v / w) * st.width;
            const sy = (v) => st.top + (v / h) * st.height;
            const vw = document.documentElement.clientWidth;
            const bd = document.querySelector(".guide-badge").getBoundingClientRect();
            const tt = document.querySelector(".to-top");
            const ttr = tt.getBoundingClientRect();
            const shown = tt.classList.contains("is-shown");
            const R = Math.round;
            done({
              fig: [R(sx(l)), R(sy(t)), R(sx(r + 1)), R(sy(b + 1))],
              clipR: R(vw - sx(r + 1)),
              badge: [R(bd.left), R(bd.top), R(bd.right), R(bd.bottom)],
              badgeVis: getComputedStyle(document.querySelector(".guide-badge")).visibility,
              toTopGap: shown ? R(ttr.top - bd.bottom) : null,
              text: document.querySelector(".guide-badge").textContent,
              nav: document.querySelector(".nav-item.is-active")?.textContent ?? "-",
            });
          });
        }),
    );
    worst.right = Math.min(worst.right, info.clipR);
    worst.left = Math.min(worst.left, info.fig[0]);
    worst.top = Math.min(worst.top, info.fig[1]);
    if (info.toTopGap !== null) worst.toTopGap = Math.min(worst.toTopGap, info.toTopGap);
    const bad = info.clipR < 0 || info.fig[1] < 72 || info.badgeVis !== "visible" || !info.text.endsWith(info.nav) || (info.toTopGap !== null && info.toTopGap < 4);
    if (bad) out.push(`BAD ${yy} ${JSON.stringify(info)}`);
    if (shot < 12) await page.screenshot({ path: `.playwright-mcp/${tag}-${String(shot++).padStart(2, "0")}.png` });
  }
  out.push("WORST " + JSON.stringify(worst));
  return out;
}
