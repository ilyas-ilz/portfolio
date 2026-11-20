async (page) => {
  const tag = "v3-" + page.viewportSize().width;
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
  const at = (id, f) => Math.max(0, Math.min(maxS, tops[id][0] - vh * 0.5 + tops[id][1] * f));
  const shots = [
    ["hero", 0],
    ["work-a", at("work", 0.12)],
    ["work-b", at("work", 0.55)],
    ["about", at("about", 0.5)],
    ["skills", at("skills", 0.5)],
    ["exp", at("experience", 0.6)],
    ["contact-a", at("contact", 0.1)],
    ["contact", maxS],
  ];
  const out = [];
  for (const [name, y] of shots) {
    await page.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)), y);
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `.playwright-mcp/${tag}-${name}.png` });
    out.push(
      [name, Math.round(y)].join("@") +
        " " +
        (await page.evaluate(() => {
          const b = document.querySelector(".guide-badge")?.getBoundingClientRect();
          return (
            document.querySelector(".guide-badge")?.textContent +
            " nav:" +
            document.querySelector(".nav-item.is-active")?.textContent +
            " badge:" +
            (b ? [Math.round(b.left), Math.round(b.right), Math.round(b.top), Math.round(b.bottom)].join(",") : "-")
          );
        })),
    );
  }
  return out;
}
