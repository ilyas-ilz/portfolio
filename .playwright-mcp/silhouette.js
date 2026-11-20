async (page) => {
  // Measures the rendered astronaut silhouette (opaque canvas pixels) in helmet widths,
  // relative to the stage centre, at points across the whole scroll timeline.
  await page.reload();
  await page.waitForTimeout(2500);
  const vh = page.viewportSize().height;
  const tops = await page.evaluate(() =>
    Object.fromEntries(
      ["top", "work", "about", "skills", "experience", "contact"].map((id) => {
        const r = document.getElementById(id).getBoundingClientRect();
        return [id, [r.top + scrollY, r.height]];
      }),
    ),
  );
  const maxS = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const pts = [];
  for (const id of Object.keys(tops)) {
    for (const f of [0.05, 0.3, 0.55, 0.8]) {
      pts.push([id + f, Math.max(0, Math.min(maxS, tops[id][0] - vh * 0.5 + tops[id][1] * f))]);
    }
  }
  pts.push(["end", maxS]);
  const out = [];
  for (const [name, y] of pts) {
    await page.evaluate((y) => window.__lenis.scrollTo(y, { immediate: true }), y);
    await page.waitForTimeout(2300);
    const res = await page.evaluate(
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
            for (let yy = 0; yy < h; yy++) {
              for (let xx = 0; xx < w; xx++) {
                if (px[(yy * w + xx) * 4 + 3] > 200) {
                  if (xx < l) l = xx;
                  if (xx > r) r = xx;
                  const sy = h - 1 - yy;
                  if (sy < t) t = sy;
                  if (sy > b) b = sy;
                }
              }
            }
            const rect = document.querySelector(".astro-stage").getBoundingClientRect();
            const size = rect.width * 0.31;
            const cx = (rect.left + rect.right) / 2;
            const cy = (rect.top + rect.bottom) / 2;
            const sx = (v) => rect.left + (v / w) * rect.width;
            const sy = (v) => rect.top + (v / h) * rect.height;
            const k = (v) => +v.toFixed(2);
            done({
              L: k((cx - sx(l)) / size),
              R: k((sx(r + 1) - cx) / size),
              T: k((cy - sy(t)) / size),
              B: k((sy(b + 1) - cy) / size),
              edgeL: k(sx(l) - rect.left),
              edgeR: k(rect.right - sx(r + 1)),
              size: k(size),
            });
          });
        }),
    );
    out.push(name + " " + JSON.stringify(res));
  }
  return out;
}
