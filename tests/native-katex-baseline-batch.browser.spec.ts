import { expect, test } from "@playwright/test";

test("batched native baselines preserve nested, scaled and changed typography", async ({ page }) => {
  await page.goto("/experiments/kinetic-figure/supply-tax/#beat.log-exponent.locate-the-unknown");
  await expect(page.locator("[data-kp-log-exponent-focus-card] [data-kp-editor-animation-player]"))
    .toHaveAttribute("data-kp-editor-animation-surface-readiness", "ready");
  const result = await page.evaluate(async () => {
    const geometryPath = "/src/rendering/native-katex-paint-geometry.ts";
    const katexPath = "/node_modules/katex/dist/katex.mjs";
    const { measureKpNativeKatexBaselineY, measureKpNativeKatexBaselines,
      measureKpNativeKatexTextInkRect, measureKpNativeKatexTextInkRects } = await import(geometryPath);
    const { default: katex } = await import(katexPath);
    const stage = document.createElement("div");
    stage.style.cssText = "position:relative;font-size:24px;width:600px;transform-origin:top left";
    document.body.append(stage);
    const residuals: number[] = [];
    let unchanged = true;
    let count = 0;
    try {
      for (const tex of [String.raw`a^2+\frac{x_1}{y}+\sqrt{z}`, String.raw`\begin{pmatrix}1&-2\\x&3\end{pmatrix}`, String.raw`\log_b(a^x)=x\log_b(a)`]) {
        katex.render(tex, stage);
        await document.fonts.ready;
        // Include ancestors as well as leaves to pressure simultaneous nested
        // probes, scripts and line boxes; compare with independent old reads.
        const elements = [...stage.querySelectorAll<HTMLElement>(".katex-html span")];
        for (const [font, transform] of [["24px", "none"], ["31px", "scale(0.7)"], ["19px", "translateY(17px) scale(1.2)"]]) {
          stage.style.fontSize = font!;
          stage.style.transform = transform!;
          const before = stage.innerHTML;
          const leaves = elements.filter(element => element.childElementCount === 0 && element.textContent?.trim());
          for (const cohort of [elements, leaves, [...leaves, ...leaves]]) {
            const expected = cohort.map(element => measureKpNativeKatexBaselineY(stage, element));
            const actual: readonly number[] = measureKpNativeKatexBaselines(stage, cohort);
            residuals.push(...actual.map((value, index) => Math.abs(value - expected[index]!)));
            const expectedInk = cohort.map(element => measureKpNativeKatexTextInkRect(stage, element));
            const actualInk: { left: number; top: number; width: number; height: number }[] = measureKpNativeKatexTextInkRects(stage, cohort);
            actualInk.forEach((rect, index) => {
              for (const key of ["left", "top", "width", "height"] as const)
                residuals.push(Math.abs(rect[key] - expectedInk[index]![key]));
            });
            count += actual.length;
          }
          unchanged &&= before === stage.innerHTML;
        }
      }
      return { maximumResidual: Math.max(...residuals), unchanged, count };
    } finally { stage.remove(); }
  });
  expect(result.count).toBeGreaterThan(100);
  expect(result.unchanged).toBe(true);
  expect(result.maximumResidual).toBeLessThan(0.1);
});

test("ink probe failures clean up and fan-out endpoints share only one observation", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const path = "/src/rendering/native-katex-paint-geometry.ts";
    const { measureKpNativeKatexTextInkRects, measureKpNativeKatexTextInkRect,
      attachKpNativeKatexTrackPaintGeometry } = await import(path);
    const stage = document.createElement("div");
    stage.style.cssText = "position:relative;font:24px serif";
    stage.innerHTML = "<span>x</span><span>y</span>";
    document.body.append(stage);
    const leaves = [...stage.querySelectorAll("span")], before = stage.innerHTML;
    const original = HTMLElement.prototype.getBoundingClientRect;
    let failed = false, probes = 0;
    try {
      HTMLElement.prototype.getBoundingClientRect = function () {
        if (this.getAttribute("aria-hidden") === "true" && stage.contains(this)) throw new Error("probe failure");
        return original.call(this);
      };
      try { measureKpNativeKatexTextInkRects(stage, leaves); }
      catch (error) { failed = error instanceof Error && error.message === "probe failure"; }
    } finally { HTMLElement.prototype.getBoundingClientRect = original; }
    const cleaned = stage.innerHTML === before;
    try {
      const atoms = leaves.map((sourceElement, index) => ({ id: String(index), sourceElement, paintMeasurement: "atomic-text" }));
      // This tests the geometry boundary, not semantic certification. Real
      // canonical compositor cohorts separately exercise issued scene plans.
      const scene = { stage, atoms };
      const tracks = Array.from({ length: 4 }, () => ({ sourceAtomId: "0", targetAtomId: "1" }));
      HTMLElement.prototype.getBoundingClientRect = function () {
        if (this.getAttribute("aria-hidden") === "true" && stage.contains(this)) probes++;
        return original.call(this);
      };
      const first = attachKpNativeKatexTrackPaintGeometry({ tracks, source: scene, target: scene });
      const firstProbes = probes;
      HTMLElement.prototype.getBoundingClientRect = original;
      stage.style.fontSize = "36px";
      const changed = attachKpNativeKatexTrackPaintGeometry({ tracks, source: scene, target: scene });
      const expected = measureKpNativeKatexTextInkRect(stage, leaves[0]!);
      const authored = { left: 1, top: 2, width: 3, height: 4 };
      const custom = attachKpNativeKatexTrackPaintGeometry({ tracks: [{ startPaintRect: authored, endPaintRect: authored }], source: scene, target: scene });
      return { failed, cleaned, firstProbes,
        shared: first.every((t: { startPaintRect: object }) => t.startPaintRect === first[0].startPaintRect),
        fresh: changed[0].startPaintRect.width > first[0].startPaintRect.width,
        residual: Math.abs(changed[0].startPaintRect.top - expected.top),
        authored: custom[0].startPaintRect === authored && custom[0].endPaintRect === authored,
        unchanged: stage.innerHTML === before };
    } finally { HTMLElement.prototype.getBoundingClientRect = original; stage.remove(); }
  });
  expect(result).toMatchObject({ failed: true, cleaned: true, firstProbes: 2, shared: true, fresh: true, authored: true, unchanged: true });
  expect(result.residual).toBeLessThan(0.1);
});
